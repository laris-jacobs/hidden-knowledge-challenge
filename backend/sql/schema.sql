- Create database if missing, then switch into it
IF DB_ID('mcdb') IS NULL
BEGIN
  CREATE DATABASE mcdb;
END
GO
USE mcdb;
GO

/* ============================
   CLEAN (idempotent)
   ============================ */
IF OBJECT_ID('dbo.v_action_item', 'V') IS NOT NULL
DROP VIEW dbo.v_action_item;
GO

IF OBJECT_ID('dbo.action_output', 'U') IS NOT NULL DROP TABLE dbo.action_output;
IF OBJECT_ID('dbo.action_input',  'U') IS NOT NULL DROP TABLE dbo.action_input;
IF OBJECT_ID('dbo.action_source', 'U') IS NOT NULL DROP TABLE dbo.action_source;
IF OBJECT_ID('dbo.[action]',      'U') IS NOT NULL DROP TABLE dbo.[action];
IF OBJECT_ID('dbo.action_type',   'U') IS NOT NULL DROP TABLE dbo.action_type;
IF OBJECT_ID('dbo.item',          'U') IS NOT NULL DROP TABLE dbo.item;
IF OBJECT_ID('dbo.[source]',      'U') IS NOT NULL DROP TABLE dbo.[source];
GO

/* ============================
   SOURCES
   ============================ */
CREATE TABLE dbo.[source] (
    [id]    NVARCHAR(128)  NOT NULL PRIMARY KEY,
    [name]  NVARCHAR(255)  NOT NULL,
    [trust] DECIMAL(3,2)   NULL CONSTRAINT DF_source_trust DEFAULT (0.50),
    [note]  NVARCHAR(MAX)  NULL
    );
GO

/* ============================
   ACTION TYPES
   ============================ */
CREATE TABLE dbo.action_type (
    [id]   NVARCHAR(64)  NOT NULL PRIMARY KEY,   -- 'crafting', 'melting', ...
    [name] NVARCHAR(255) NOT NULL
);
GO

/* ============================
   ITEMS
   ============================ */
CREATE TABLE dbo.item (
    [id]           NVARCHAR(128) NOT NULL PRIMARY KEY,
    [name]         NVARCHAR(255) NOT NULL,
    [image_url]    NVARCHAR(1024) NULL,
    [is_base]      BIT            NOT NULL CONSTRAINT DF_item_is_base DEFAULT (0),
    [base_harvest] NVARCHAR(MAX)  NULL   -- description of real-world acquisition
);
GO

/* ============================
   ACTIONS (logical recipe/process)
   ============================ */
CREATE TABLE dbo.[action] (
    [id]             NVARCHAR(128) NOT NULL PRIMARY KEY,
    [action_type_id] NVARCHAR(64)  NOT NULL,
    [station]        NVARCHAR(255) NULL,         -- e.g. 'crafting_table', 'furnace'
    [image_url]      NVARCHAR(1024) NULL,        -- recipe card / image
    CONSTRAINT FK_action_action_type
    FOREIGN KEY ([action_type_id]) REFERENCES dbo.action_type([id]) ON DELETE NO ACTION
    );
GO

/* ============================
   ACTION <-> SOURCE (m:n, effectively 1:1 via UNIQUE)
   ============================ */
CREATE TABLE dbo.action_source (
    [action_id] NVARCHAR(128) NOT NULL,
    [source_id] NVARCHAR(128) NOT NULL,
    CONSTRAINT PK_action_source PRIMARY KEY ([action_id], [source_id]),
    CONSTRAINT UQ_action_source_action UNIQUE ([action_id]),
    CONSTRAINT FK_action_source_action
        FOREIGN KEY ([action_id]) REFERENCES dbo.[action]([id]) ON DELETE CASCADE,
    CONSTRAINT FK_action_source_source
        FOREIGN KEY ([source_id]) REFERENCES dbo.[source]([id]) ON DELETE NO ACTION
    );
GO

/* ============================
   INPUTS (m:n) – required items with qty
   ============================ */
CREATE TABLE dbo.action_input (
    [action_id] NVARCHAR(128) NOT NULL,
    [item_id]   NVARCHAR(128) NOT NULL,
    [qty]       INT           NOT NULL,
    CONSTRAINT CK_action_input_qty_pos CHECK ([qty] > 0),
  CONSTRAINT PK_action_input PRIMARY KEY ([action_id], [item_id]),
  CONSTRAINT FK_action_input_action
    FOREIGN KEY ([action_id]) REFERENCES dbo.[action]([id]) ON DELETE CASCADE,
  CONSTRAINT FK_action_input_item
    FOREIGN KEY ([item_id])   REFERENCES dbo.item([id])   ON DELETE NO ACTION
);
GO

/* ============================
   OUTPUTS (m:n) – multiple outputs per action ALLOWED
   ============================ */
CREATE TABLE dbo.action_output (
    [action_id] NVARCHAR(128) NOT NULL,
    [item_id]   NVARCHAR(128) NOT NULL,
    [qty]       INT           NOT NULL,
    CONSTRAINT CK_action_output_qty_pos CHECK ([qty] > 0),
  CONSTRAINT PK_action_output PRIMARY KEY ([action_id], [item_id]),
  CONSTRAINT FK_action_output_action
    FOREIGN KEY ([action_id]) REFERENCES dbo.[action]([id]) ON DELETE CASCADE,
  CONSTRAINT FK_action_output_item
    FOREIGN KEY ([item_id])   REFERENCES dbo.item([id])     ON DELETE NO ACTION
);
GO

/* ============================
   Indexes
   ============================ */
CREATE INDEX idx_ai_item    ON dbo.action_input([item_id]);
CREATE INDEX idx_ao_item    ON dbo.action_output([item_id]);
CREATE INDEX idx_as_source  ON dbo.action_source([source_id]);
CREATE INDEX idx_action_ty  ON dbo.[action]([action_type_id]);
GO

/* ============================
   Helper View: unified view of inputs & outputs
   ============================ */
CREATE VIEW dbo.v_action_item
AS
SELECT
    ai.[action_id],
    ai.[item_id],
    CAST('input'  AS NVARCHAR(10)) AS [role],
  ai.[qty]
FROM dbo.action_input AS ai
UNION ALL
SELECT
    ao.[action_id],
    ao.[item_id],
    CAST('output' AS NVARCHAR(10)) AS [role],
  ao.[qty]
FROM dbo.action_output AS ao;
GO
