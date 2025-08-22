-- SOURCES
INSERT INTO source (id,name,trust) VALUES
                                       ('src_official','Official Recipes',0.95),
                                       ('src_conflict','Community Variant',0.30);

-- ACTION TYPES
INSERT INTO action_type (id,name) VALUES
                                      ('crafting','Crafting'),
                                      ('melting','Melting');

-- ITEMS
INSERT INTO item (id,name,is_base,base_harvest) VALUES
                                                    ('log_oak',       'Oak Log',       TRUE,  'Fälle einen Oak-Baum'),
                                                    ('log_jungle',    'Jungle Log',    TRUE,  'Fälle einen Jungle-Baum'),
                                                    ('plank_oak',     'Oak Planks',    FALSE, NULL),
                                                    ('plank_jungle',  'Jungle Planks', FALSE, NULL),
                                                    ('stick',         'Stick',         TRUE,  'Sammle Sticks aus Blättern/Dead Bushes'),
                                                    ('cobblestone',   'Cobblestone',   TRUE,  'Baue Stone mit einer Spitzhacke ab'),
                                                    ('pickaxe_stone', 'Stone Pickaxe', FALSE, NULL),
                                                    ('iron_ingot',    'Iron Ingot',    FALSE, NULL),   -- Missing relevant
                                                    ('iron_sword',    'Iron Sword',    FALSE, NULL),
                                                    ('diamond',       'Diamond',       TRUE,  'Abbau von Diamond Ore (Eisen+ Spitzhacke)'),
                                                    ('diamond_sword', 'Diamond Sword', FALSE, NULL);   -- Missing info

-- Vollständig: Logs -> Planks (official)
INSERT INTO action (id,action_type_id,station) VALUES
                                                   ('act_planks_oak',    'crafting','crafting_table'),
                                                   ('act_planks_jungle', 'crafting','crafting_table');
INSERT INTO action_source (action_id,source_id) VALUES
                                                    ('act_planks_oak','src_official'),
                                                    ('act_planks_jungle','src_official');
INSERT INTO action_input (action_id,item_id,qty) VALUES
                                                     ('act_planks_oak','log_oak',1),
                                                     ('act_planks_jungle','log_jungle',1);
INSERT INTO action_output (action_id,item_id,qty) VALUES
                                                      ('act_planks_oak','plank_oak',4),
                                                      ('act_planks_jungle','plank_jungle',4);

-- Sticks: Base & craftbar (official)
INSERT INTO action (id,action_type_id,station) VALUES
                                                   ('act_sticks_from_oak','crafting','crafting_table'),
                                                   ('act_sticks_from_jungle','crafting','crafting_table');
INSERT INTO action_source (action_id,source_id) VALUES
                                                    ('act_sticks_from_oak','src_official'),
                                                    ('act_sticks_from_jungle','src_official');
INSERT INTO action_input (action_id,item_id,qty) VALUES
                                                     ('act_sticks_from_oak','plank_oak',2),
                                                     ('act_sticks_from_jungle','plank_jungle',2);
INSERT INTO action_output (action_id,item_id,qty) VALUES
                                                      ('act_sticks_from_oak','stick',4),
                                                      ('act_sticks_from_jungle','stick',4);

-- KONFLIKT: Pickaxe korrekt (official) vs. falsch (community)
INSERT INTO action (id,action_type_id,station) VALUES
                                                   ('act_pickaxe_correct','crafting','crafting_table'),
                                                   ('act_pickaxe_bad','crafting','crafting_table');
INSERT INTO action_source (action_id,source_id) VALUES
                                                    ('act_pickaxe_correct','src_official'),
                                                    ('act_pickaxe_bad','src_conflict');
-- korrekt
INSERT INTO action_input (action_id,item_id,qty) VALUES
                                                     ('act_pickaxe_correct','cobblestone',3),
                                                     ('act_pickaxe_correct','stick',2);
INSERT INTO action_output (action_id,item_id,qty) VALUES
    ('act_pickaxe_correct','pickaxe_stone',1);
-- falsch
INSERT INTO action_input (action_id,item_id,qty) VALUES
                                                     ('act_pickaxe_bad','cobblestone',2),
                                                     ('act_pickaxe_bad','stick',2);
INSERT INTO action_output (action_id,item_id,qty) VALUES
    ('act_pickaxe_bad','pickaxe_stone',1);

-- FEHLENDE RELEVANTE INFO: Iron Sword (iron_ingot unbeschaffbar)
INSERT INTO action (id,action_type_id,station) VALUES
    ('act_iron_sword','crafting','crafting_table');
INSERT INTO action_source (action_id,source_id) VALUES
    ('act_iron_sword','src_official');
INSERT INTO action_input (action_id,item_id,qty) VALUES
                                                     ('act_iron_sword','iron_ingot',2),
                                                     ('act_iron_sword','stick',1);
INSERT INTO action_output (action_id,item_id,qty) VALUES
    ('act_iron_sword','iron_sword',1);

-- FEHLENDE INFO: Diamond Sword – KEINE Action erzeugt
