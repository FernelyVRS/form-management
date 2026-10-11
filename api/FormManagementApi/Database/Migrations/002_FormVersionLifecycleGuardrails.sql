-- Run with an explicitly selected database (-d). Never executed at API startup.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, 'Select the target application database explicitly.', 1;
IF CONVERT(int, SERVERPROPERTY('ProductMajorVersion')) < 16
    THROW 51000, 'SQL Server 2022 or newer is required.', 1;
IF OBJECT_ID(N'dbo.Forms', N'U') IS NULL OR OBJECT_ID(N'dbo.FormVersions', N'U') IS NULL
    THROW 51000, 'Expected Forms and FormVersions tables are missing.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.FormVersions')
    AND name = N'Status' AND TYPE_NAME(user_type_id) = N'nvarchar' AND is_nullable = 0)
    THROW 51000, 'FormVersions.Status must be required nvarchar.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Hold a table lock so lifecycle writers cannot insert mid-classification.
    DECLARE @count bigint;
    SELECT @count = COUNT_BIG(*) FROM dbo.FormVersions WITH (TABLOCKX, HOLDLOCK);

    -- Refuse conflicting data instead of choosing winners automatically.
    IF EXISTS (SELECT 1 FROM dbo.FormVersions WHERE Status = N'Draft'
        GROUP BY FormId HAVING COUNT(*) > 1)
        THROW 51001, 'Duplicate Draft versions detected; resolve manually before migrating.', 1;
    IF EXISTS (SELECT 1 FROM dbo.FormVersions WHERE Status = N'Published'
        GROUP BY FormId HAVING COUNT(*) > 1)
        THROW 51001, 'Duplicate Published versions detected; resolve manually before migrating.', 1;
    IF EXISTS (SELECT 1 FROM dbo.FormVersions WHERE VersionNumber <= 0)
        THROW 51002, 'VersionNumber values greater than zero are required.', 1;

    -- Provenance columns for cloned forms.
    IF COL_LENGTH(N'dbo.Forms', N'SourceFormId') IS NULL
        ALTER TABLE dbo.Forms ADD SourceFormId uniqueidentifier NULL;
    IF COL_LENGTH(N'dbo.Forms', N'SourceVersionId') IS NULL
        ALTER TABLE dbo.Forms ADD SourceVersionId uniqueidentifier NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Forms_SourceForm')
        ALTER TABLE dbo.Forms WITH CHECK
            ADD CONSTRAINT FK_Forms_SourceForm
            FOREIGN KEY (SourceFormId) REFERENCES dbo.Forms (Id);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Forms_SourceVersion')
        ALTER TABLE dbo.Forms WITH CHECK
            ADD CONSTRAINT FK_Forms_SourceVersion
            FOREIGN KEY (SourceVersionId) REFERENCES dbo.FormVersions (Id);

    -- VersionNumber positivity check.
    DECLARE @checkExpected nvarchar(max) = N'[VersionNumber] > (0)';
    DECLARE @checkExisting nvarchar(max);
    SELECT @checkExisting = definition FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'CK_FormVersions_VersionNumberPositive';
    IF @checkExisting IS NULL AND OBJECT_ID(N'dbo.CK_FormVersions_VersionNumberPositive') IS NOT NULL
        THROW 51003, 'VersionNumber check name is used by an incompatible object.', 1;
    DECLARE @normalizedExpected nvarchar(max) = LOWER(@checkExpected);
    DECLARE @normalizedExisting nvarchar(max) = LOWER(@checkExisting);
    DECLARE @characters nvarchar(20) = N' ()[]' + NCHAR(9) + NCHAR(10) + NCHAR(13);
    DECLARE @index int = 1;
    WHILE @index <= LEN(@characters)
    BEGIN
        SET @normalizedExpected = REPLACE(@normalizedExpected, SUBSTRING(@characters, @index, 1), N'');
        SET @normalizedExisting = REPLACE(@normalizedExisting, SUBSTRING(@characters, @index, 1), N'');
        SET @index += 1;
    END;
    IF @checkExisting IS NOT NULL AND @normalizedExisting <> @normalizedExpected
        THROW 51003, 'Existing VersionNumber check has an incompatible definition.', 1;

    -- Filtered unique indexes; abort on same-name incompatible definitions.
    DECLARE @idx sysname, @isUnique bit, @hasFilter bit, @filter nvarchar(max), @cols nvarchar(max);
    DECLARE @expectedDraft nvarchar(100) = N'([Status]=N''Draft'')';
    DECLARE @expectedPublished nvarchar(100) = N'([Status]=N''Published'')';

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'UX_FormVersions_Draft')
    BEGIN
        SELECT @isUnique = is_unique, @hasFilter = has_filter, @filter = filter_definition,
               @cols = STUFF((SELECT N',' + c.name FROM sys.index_columns ic
                    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                    WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal > 0
                    ORDER BY ic.key_ordinal FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 1, N'')
        FROM sys.indexes i WHERE i.object_id = OBJECT_ID(N'dbo.FormVersions') AND i.name = N'UX_FormVersions_Draft';
        IF @isUnique <> 1 OR @hasFilter <> 1 OR @cols <> N'FormId'
           OR LOWER(REPLACE(REPLACE(REPLACE(@filter, N' ', N''), N'[', N''), N']', N'')) <> LOWER(REPLACE(REPLACE(REPLACE(@expectedDraft, N' ', N''), N'[', N''), N']', N''))
            THROW 51004, 'UX_FormVersions_Draft exists with an incompatible definition.', 1;
    END
    ELSE
        CREATE UNIQUE INDEX UX_FormVersions_Draft ON dbo.FormVersions (FormId) WHERE Status = N'Draft';

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'UX_FormVersions_Published')
    BEGIN
        SELECT @isUnique = is_unique, @hasFilter = has_filter, @filter = filter_definition,
               @cols = STUFF((SELECT N',' + c.name FROM sys.index_columns ic
                    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                    WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal > 0
                    ORDER BY ic.key_ordinal FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 1, N'')
        FROM sys.indexes i WHERE i.object_id = OBJECT_ID(N'dbo.FormVersions') AND i.name = N'UX_FormVersions_Published';
        IF @isUnique <> 1 OR @hasFilter <> 1 OR @cols <> N'FormId'
           OR LOWER(REPLACE(REPLACE(REPLACE(@filter, N' ', N''), N'[', N''), N']', N'')) <> LOWER(REPLACE(REPLACE(REPLACE(@expectedPublished, N' ', N''), N'[', N''), N']', N''))
            THROW 51004, 'UX_FormVersions_Published exists with an incompatible definition.', 1;
    END
    ELSE
        CREATE UNIQUE INDEX UX_FormVersions_Published ON dbo.FormVersions (FormId) WHERE Status = N'Published';

    IF @checkExisting IS NULL
        EXEC(N'ALTER TABLE dbo.FormVersions WITH CHECK ADD CONSTRAINT CK_FormVersions_VersionNumberPositive CHECK (' + @checkExpected + N');');
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.FormVersions')
        AND name = N'CK_FormVersions_VersionNumberPositive' AND (is_disabled = 1 OR is_not_trusted = 1))
        ALTER TABLE dbo.FormVersions WITH CHECK CHECK CONSTRAINT CK_FormVersions_VersionNumberPositive;

    COMMIT TRANSACTION;
    SELECT @count AS VersionCount,
           CASE WHEN COL_LENGTH(N'dbo.Forms', N'SourceFormId') IS NULL THEN 0 ELSE 1 END AS ProvenanceReady,
           CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'UX_FormVersions_Draft') THEN 1 ELSE 0 END AS DraftIndexReady,
           CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'UX_FormVersions_Published') THEN 1 ELSE 0 END AS PublishedIndexReady;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
