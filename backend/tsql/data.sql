/* ============================
   SOURCES
   ============================ */
INSERT INTO dbo.[source] (id, name, trust) VALUES
    (N'src_official', N'Official Recipes', 0.95),
    (N'src_conflict', N'Community Variant', 0.30);

/* ============================
   ACTION TYPES
   ============================ */
INSERT INTO dbo.action_type (id, name) VALUES
                                           (N'crafting', N'Crafting'),
                                           (N'melting',  N'Melting');

/* ============================
   ITEMS
   ============================ */
INSERT INTO dbo.item (id, name, is_base, base_harvest) VALUES
                                                           (N'log_oak',       N'Oak Log',       1, N'Fälle einen Oak-Baum'),
                                                           (N'log_jungle',    N'Jungle Log',    1, N'Fälle einen Jungle-Baum'),
                                                           (N'plank_oak',     N'Oak Planks',    0, NULL),
                                                           (N'plank_jungle',  N'Jungle Planks', 0, NULL),
                                                           (N'stick',         N'Stick',         1, N'Sammle Sticks aus Blättern/Dead Bushes'),
                                                           (N'cobblestone',   N'Cobblestone',   1, N'Baue Stone mit einer Spitzhacke ab'),
                                                           (N'pickaxe_stone', N'Stone Pickaxe', 0, NULL),
                                                           (N'iron_ingot',    N'Iron Ingot',    0, NULL),   -- Missing relevant
                                                           (N'iron_sword',    N'Iron Sword',    0, NULL),
                                                           (N'diamond',       N'Diamond',       1, N'Abbau von Diamond Ore (Eisen+ Spitzhacke)'),
                                                           (N'diamond_sword', N'Diamond Sword', 0, NULL);   -- Missing info

/* ============================
   FULL RECIPE: Logs -> Planks
   ============================ */
INSERT INTO dbo.[action] (id, action_type_id, station) VALUES
    (N'act_planks_oak',    N'crafting', N'crafting_table'),
    (N'act_planks_jungle', N'crafting', N'crafting_table');

INSERT INTO dbo.action_source (action_id, source_id) VALUES
                                                         (N'act_planks_oak',    N'src_official'),
                                                         (N'act_planks_jungle', N'src_official');

INSERT INTO dbo.action_input (action_id, item_id, qty) VALUES
                                                           (N'act_planks_oak',    N'log_oak',    1),
                                                           (N'act_planks_jungle', N'log_jungle', 1);

INSERT INTO dbo.action_output (action_id, item_id, qty) VALUES
                                                            (N'act_planks_oak',    N'plank_oak',    4),
                                                            (N'act_planks_jungle', N'plank_jungle', 4);

/* ============================
   STICKS: base & craftable
   ============================ */
INSERT INTO dbo.[action] (id, action_type_id, station) VALUES
    (N'act_sticks_from_oak',    N'crafting', N'crafting_table'),
    (N'act_sticks_from_jungle', N'crafting', N'crafting_table');

INSERT INTO dbo.action_source (action_id, source_id) VALUES
                                                         (N'act_sticks_from_oak',    N'src_official'),
                                                         (N'act_sticks_from_jungle', N'src_official');

INSERT INTO dbo.action_input (action_id, item_id, qty) VALUES
                                                           (N'act_sticks_from_oak',    N'plank_oak',    2),
                                                           (N'act_sticks_from_jungle', N'plank_jungle', 2);

INSERT INTO dbo.action_output (action_id, item_id, qty) VALUES
                                                            (N'act_sticks_from_oak',    N'stick', 4),
                                                            (N'act_sticks_from_jungle', N'stick', 4);

/* ============================
   CONFLICT: Pickaxe correct vs bad
   ============================ */
INSERT INTO dbo.[action] (id, action_type_id, station) VALUES
    (N'act_pickaxe_correct', N'crafting', N'crafting_table'),
    (N'act_pickaxe_bad',     N'crafting', N'crafting_table');

INSERT INTO dbo.action_source (action_id, source_id) VALUES
                                                         (N'act_pickaxe_correct', N'src_official'),
                                                         (N'act_pickaxe_bad',     N'src_conflict');

-- correct
INSERT INTO dbo.action_input (action_id, item_id, qty) VALUES
                                                           (N'act_pickaxe_correct', N'cobblestone', 3),
                                                           (N'act_pickaxe_correct', N'stick',       2);

INSERT INTO dbo.action_output (action_id, item_id, qty) VALUES
    (N'act_pickaxe_correct', N'pickaxe_stone', 1);

-- wrong
INSERT INTO dbo.action_input (action_id, item_id, qty) VALUES
                                                           (N'act_pickaxe_bad', N'cobblestone', 2),
                                                           (N'act_pickaxe_bad', N'stick',       2);

INSERT INTO dbo.action_output (action_id, item_id, qty) VALUES
    (N'act_pickaxe_bad', N'pickaxe_stone', 1);

/* ============================
   MISSING RELEVANT INFO: Iron Sword
   (iron_ingot has no production path)
   ============================ */
INSERT INTO dbo.[action] (id, action_type_id, station) VALUES
    (N'act_iron_sword', N'crafting', N'crafting_table');

INSERT INTO dbo.action_source (action_id, source_id) VALUES
    (N'act_iron_sword', N'src_official');

INSERT INTO dbo.action_input (action_id, item_id, qty) VALUES
                                                           (N'act_iron_sword', N'iron_ingot', 2),
                                                           (N'act_iron_sword', N'stick',      1);

INSERT INTO dbo.action_output (action_id, item_id, qty) VALUES
    (N'act_iron_sword', N'iron_sword', 1);

/* ============================
   MISSING INFO: Diamond Sword
   (no action created intentionally)
   ============================ */
-- no rows
