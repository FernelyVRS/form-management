-- Run with an explicitly selected database (-d). Never executed at API startup.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, 'Select the target application database explicitly.', 1;
IF CONVERT(int, SERVERPROPERTY('ProductMajorVersion')) < 16
    THROW 51000, 'SQL Server 2022 or newer is required.', 1;
IF OBJECT_ID(N'dbo.Forms', N'U') IS NULL OR OBJECT_ID(N'dbo.FormVersions', N'U') IS NULL
    THROW 51000, 'Expected Forms and FormVersions tables are missing.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.FormVersions')
    AND name = N'SchemaJson' AND TYPE_NAME(user_type_id) = N'nvarchar' AND max_length = -1 AND is_nullable = 0)
    THROW 51000, 'SchemaJson must be required nvarchar(max).', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @count bigint;
    SELECT @count = COUNT_BIG(*) FROM dbo.FormVersions WITH (TABLOCKX, HOLDLOCK);

    -- Deep contract validation of non-placeholder v1 rows is a separate .NET preflight.
    IF EXISTS (
        SELECT 1 FROM dbo.FormVersions
        WHERE LTRIM(RTRIM(SchemaJson)) <> N'{}'
        AND CASE WHEN ISJSON(SchemaJson, OBJECT) = 1 THEN
            CASE WHEN COALESCE(JSON_VALUE(SchemaJson, '$.schemaVersion'), N'') = N'1'
                AND COALESCE(ISJSON(JSON_QUERY(SchemaJson, '$.sections'), ARRAY), 0) = 1
                THEN 1 ELSE 0 END
            ELSE 0 END = 0
    ) THROW 51001, 'Unexpected schema detected; migration refused without conversion.', 1;

    IF COL_LENGTH(N'dbo.FormVersions', N'RowVersion') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.FormVersions')
           AND name = N'RowVersion' AND system_type_id = 189 AND is_nullable = 0)
        THROW 51002, 'Existing RowVersion column has an incompatible definition.', 1;

    DECLARE @expected nvarchar(max) = N'CASE WHEN ISJSON(SchemaJson, OBJECT) = 1 THEN CASE WHEN COALESCE(JSON_VALUE(SchemaJson, ''$.schemaVersion''), N'''') = N''1'' AND COALESCE(ISJSON(JSON_QUERY(SchemaJson, ''$.sections''), ARRAY), 0) = 1 THEN 1 ELSE 0 END ELSE 0 END = 1';
    DECLARE @existing nvarchar(max);
    SELECT @existing = definition FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'CK_FormVersions_SchemaV1';
    IF @existing IS NULL AND OBJECT_ID(N'dbo.CK_FormVersions_SchemaV1') IS NOT NULL
        THROW 51003, 'Schema constraint name is used by an incompatible object.', 1;
    -- SQL Server decorates check expressions with parentheses/brackets. Compare normalized definitions.
    DECLARE @normalizedExpected nvarchar(max) = LOWER(@expected);
    DECLARE @normalizedExisting nvarchar(max) = LOWER(@existing);
    DECLARE @characters nvarchar(20) = N' ()[]' + NCHAR(9) + NCHAR(10) + NCHAR(13);
    DECLARE @index int = 1;
    WHILE @index <= LEN(@characters)
    BEGIN
        SET @normalizedExpected = REPLACE(@normalizedExpected, SUBSTRING(@characters, @index, 1), N'');
        SET @normalizedExisting = REPLACE(@normalizedExisting, SUBSTRING(@characters, @index, 1), N'');
        SET @index += 1;
    END;
    IF @existing IS NOT NULL AND @normalizedExisting <> @normalizedExpected
        THROW 51003, 'Existing schema constraint has an incompatible definition.', 1;

    UPDATE dbo.FormVersions SET SchemaJson = N'{"schemaVersion":1,"sections":[]}'
        WHERE LTRIM(RTRIM(SchemaJson)) = N'{}';
    DECLARE @converted int = @@ROWCOUNT;

    IF COL_LENGTH(N'dbo.FormVersions', N'RowVersion') IS NULL
        EXEC(N'ALTER TABLE dbo.FormVersions ADD RowVersion rowversion NOT NULL;');
    IF @existing IS NULL
        EXEC(N'ALTER TABLE dbo.FormVersions WITH CHECK ADD CONSTRAINT CK_FormVersions_SchemaV1 CHECK (' + @expected + N');');
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.FormVersions')
        AND name = N'CK_FormVersions_SchemaV1' AND (is_disabled = 1 OR is_not_trusted = 1))
        ALTER TABLE dbo.FormVersions WITH CHECK CHECK CONSTRAINT CK_FormVersions_SchemaV1;

    COMMIT TRANSACTION;
    SELECT @count AS VersionCount, @converted AS ConvertedPlaceholders;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
