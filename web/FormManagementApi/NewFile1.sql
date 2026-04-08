-- CREATE DATABASE form_structure
-- DELETE form_structure


-- ============================================
-- 1️⃣ Tabla principal de Formularios
-- ============================================

CREATE TABLE Forms (
                       Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),

                       Name NVARCHAR(200) NOT NULL,
                       Description NVARCHAR(500) NULL,

                       CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                       UpdatedAt DATETIME2 NULL,

                       IsActive BIT NOT NULL DEFAULT 1
);



-- ============================================
-- 2️⃣ Tabla de Versiones del Formulario
-- ============================================

CREATE TABLE FormVersions (
                              Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),

    -- Relación principal
                              FormId UNIQUEIDENTIFIER NOT NULL,

    -- Versionado
                              VersionNumber INT NOT NULL,

    -- Estado de la versión
                              Status NVARCHAR(20) NOT NULL, -- Draft / Published / Archived

    -- Snapshot completo del esquema
                              SchemaJson NVARCHAR(MAX) NOT NULL,

    -- Relación opcional para versionado derivado
                              DerivedFromVersionId UNIQUEIDENTIFIER NULL,

    -- Auditoría
                              CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                              UpdatedAt DATETIME2 NULL,

                              CONSTRAINT FK_FormVersions_Form
                                  FOREIGN KEY (FormId)
                                      REFERENCES Forms(Id),

                              CONSTRAINT FK_FormVersions_DerivedFrom
                                  FOREIGN KEY (DerivedFromVersionId)
                                      REFERENCES FormVersions(Id)
);




-- ============================================
-- 3️⃣ Restricciones de integridad
-- ============================================

-- Evita dos versiones con mismo número dentro del mismo Form
CREATE UNIQUE INDEX UX_FormVersions_FormId_VersionNumber
    ON FormVersions(FormId, VersionNumber);




-- ============================================
-- 4️⃣ Validación de Status
-- ============================================

ALTER TABLE FormVersions
    ADD CONSTRAINT CK_FormVersions_Status
        CHECK (Status IN ('Draft', 'Published', 'Archived'));




-- ============================================
-- 5️⃣ Índices recomendados
-- ============================================

-- CREATE INDEX IX_FormVersions_FormId
-- ON FormVersions(FormId);
-- 
-- CREATE INDEX IX_FormVersions_DerivedFromVersionId
-- ON FormVersions(DerivedFromVersionId);
-- 
GO
