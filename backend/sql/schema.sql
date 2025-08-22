-- CLEAN (idempotent)
DROP VIEW IF EXISTS v_action_item CASCADE;
DROP TABLE IF EXISTS action_output CASCADE;
DROP TABLE IF EXISTS action_input CASCADE;
DROP TABLE IF EXISTS action_source CASCADE;
DROP TABLE IF EXISTS action CASCADE;
DROP TABLE IF EXISTS action_type CASCADE;
DROP TABLE IF EXISTS item CASCADE;
DROP TABLE IF EXISTS source CASCADE;

-- SOURCES (jede Quelle steht sinngemäß für eine „Version“)
CREATE TABLE source (
                        id    TEXT PRIMARY KEY,
                        name  TEXT NOT NULL,
                        trust NUMERIC(3,2) DEFAULT 0.50,
                        note  TEXT
);

-- ACTION TYPES
CREATE TABLE action_type (
                             id   TEXT PRIMARY KEY,         -- 'crafting', 'melting', ...
                             name TEXT NOT NULL
);

-- ITEMS
CREATE TABLE item (
                      id           TEXT PRIMARY KEY,
                      name         TEXT NOT NULL,
                      image_url    TEXT,
                      is_base      BOOLEAN NOT NULL DEFAULT FALSE,
                      base_harvest TEXT                -- Beschreibung, wie in Welt beschaffbar
);

-- ACTIONS (logischer Prozess/„Rezept“)
CREATE TABLE action (
                        id             TEXT PRIMARY KEY,
                        action_type_id TEXT NOT NULL REFERENCES action_type(id) ON DELETE RESTRICT,
                        station        TEXT,            -- z.B. 'crafting_table', 'furnace'
                        image_url      TEXT             -- Bild/„Rezeptkarte“
);

-- ACTION <-> SOURCE  (de facto 1:1; wir erzwingen das per UNIQUE(action_id))
CREATE TABLE action_source (
                               action_id TEXT NOT NULL REFERENCES action(id) ON DELETE CASCADE,
                               source_id TEXT NOT NULL REFERENCES source(id) ON DELETE RESTRICT,
                               PRIMARY KEY (action_id, source_id),
                               UNIQUE (action_id)              -- genau 1 Quelle je Action (jetzt), später leicht entfernbar
);

-- INPUTS (m:n) – benötigte Items mit Menge
CREATE TABLE action_input (
                              action_id TEXT NOT NULL REFERENCES action(id) ON DELETE CASCADE,
                              item_id   TEXT NOT NULL REFERENCES item(id)   ON DELETE RESTRICT,
                              qty       INT  NOT NULL CHECK (qty > 0),
                              PRIMARY KEY (action_id, item_id)
);

-- OUTPUTS (m:n) – mehrere Outputs pro Action ERLAUBT
CREATE TABLE action_output (
                               action_id TEXT NOT NULL REFERENCES action(id) ON DELETE CASCADE,
                               item_id   TEXT NOT NULL REFERENCES item(id)   ON DELETE RESTRICT,
                               qty       INT  NOT NULL CHECK (qty > 0),
                               PRIMARY KEY (action_id, item_id)
);

-- Indizes
CREATE INDEX idx_ai_item   ON action_input(item_id);
CREATE INDEX idx_ao_item   ON action_output(item_id);
CREATE INDEX idx_as_source ON action_source(source_id);
CREATE INDEX idx_action_ty ON action(action_type_id);

-- Hilfs-View: einheitliche Sicht auf Inputs & Outputs
CREATE VIEW v_action_item AS
SELECT ai.action_id, ai.item_id, 'input'  AS role, ai.qty FROM action_input ai
UNION ALL
SELECT ao.action_id, ao.item_id, 'output' AS role, ao.qty FROM action_output ao;
