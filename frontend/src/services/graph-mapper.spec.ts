// graph.mapper.static.spec.ts
import { buildKnowledgeGraphStatic } from './graph-mapper';
import { Action } from '../models/input.model';

// Helper
const edgeExists = (
  edges: { source: string; target: string; qty: number }[],
  s: string, t: string, q: number
) => edges.some(e => e.source === s && e.target === t && e.qty === q);

// --- Testdaten (aus deiner Nachricht, inkl. image_url) ---
const actions = [
  {
    "action_type_id": "crafting",
    "id": "act_crafting_table_jungle_conflict",
    "image_url": "imgs/recipes/act_crafting_table_from_jungle.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_jungle",
          "image_url": "imgs/items/plank_jungle.png",
          "is_base": false,
          "name": "Jungle Planks"
        },
        "qty": 4
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "crafting_table",
          "image_url": "imgs/items/crafting_table.png",
          "is_base": false,
          "name": "Crafting Table"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_conflict", "name": "Community Variant", "note": null, "trust": "0.30" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_crafting_table_jungle_official",
    "image_url": "imgs/recipes/act_crafting_table_from_jungle.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_jungle",
          "image_url": "imgs/items/plank_jungle.png",
          "is_base": false,
          "name": "Jungle Planks"
        },
        "qty": 4
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "crafting_table",
          "image_url": "imgs/items/crafting_table.png",
          "is_base": false,
          "name": "Crafting Table"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_crafting_table_oak_conflict",
    "image_url": "imgs/recipes/act_crafting_table_from_oak.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_oak",
          "image_url": "imgs/items/plank_oak.png",
          "is_base": false,
          "name": "Oak Planks"
        },
        "qty": 4
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "crafting_table",
          "image_url": "imgs/items/crafting_table.png",
          "is_base": false,
          "name": "Crafting Table"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_conflict", "name": "Community Variant", "note": null, "trust": "0.30" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_crafting_table_oak_official",
    "image_url": "imgs/recipes/act_crafting_table_from_oak.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_oak",
          "image_url": "imgs/items/plank_oak.png",
          "is_base": false,
          "name": "Oak Planks"
        },
        "qty": 4
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "crafting_table",
          "image_url": "imgs/items/crafting_table.png",
          "is_base": false,
          "name": "Crafting Table"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_iron_sword",
    "image_url": "imgs/recipes/act_iron_sword.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "iron_ingot",
          "image_url": "imgs/items/iron_ingot.png",
          "is_base": false,
          "name": "Iron Ingot"
        },
        "qty": 2
      },
      {
        "item": {
          "base_harvest": "Sammle Sticks aus Blättern/Dead Bushes",
          "id": "stick",
          "image_url": "imgs/items/stick.png",
          "is_base": true,
          "name": "Stick"
        },
        "qty": 1
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "iron_sword",
          "image_url": "imgs/items/iron_sword.png",
          "is_base": false,
          "name": "Iron Sword"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_pickaxe_bad",
    "image_url": "imgs/recipes/act_pickaxe_bad.png",
    "inputs": [
      {
        "item": {
          "base_harvest": "Baue Stone mit einer Spitzhacke ab",
          "id": "cobblestone",
          "image_url": "imgs/items/cobblestone.png",
          "is_base": true,
          "name": "Cobblestone"
        },
        "qty": 2
      },
      {
        "item": {
          "base_harvest": "Sammle Sticks aus Blättern/Dead Bushes",
          "id": "stick",
          "image_url": "imgs/items/stick.png",
          "is_base": true,
          "name": "Stick"
        },
        "qty": 2
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "pickaxe_stone",
          "image_url": "imgs/items/stone_pickaxe.png",
          "is_base": false,
          "name": "Stone Pickaxe"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_conflict", "name": "Community Variant", "note": null, "trust": "0.30" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_pickaxe_correct",
    "image_url": "imgs/recipes/act_pickaxe_correct.png",
    "inputs": [
      {
        "item": {
          "base_harvest": "Baue Stone mit einer Spitzhacke ab",
          "id": "cobblestone",
          "image_url": "imgs/items/cobblestone.png",
          "is_base": true,
          "name": "Cobblestone"
        },
        "qty": 3
      },
      {
        "item": {
          "base_harvest": "Sammle Sticks aus Blättern/Dead Bushes",
          "id": "stick",
          "image_url": "imgs/items/stick.png",
          "is_base": true,
          "name": "Stick"
        },
        "qty": 2
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "pickaxe_stone",
          "image_url": "imgs/items/stone_pickaxe.png",
          "is_base": false,
          "name": "Stone Pickaxe"
        },
        "qty": 1
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_planks_jungle",
    "image_url": "imgs/recipes/act_planks_jungle.png",
    "inputs": [
      {
        "item": {
          "base_harvest": "Fälle einen Jungle-Baum",
          "id": "log_jungle",
          "image_url": "imgs/items/log_jungle.png",
          "is_base": true,
          "name": "Jungle Log"
        },
        "qty": 1
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_jungle",
          "image_url": "imgs/items/plank_jungle.png",
          "is_base": false,
          "name": "Jungle Planks"
        },
        "qty": 4
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_planks_oak",
    "image_url": "imgs/recipes/act_planks_oak.png",
    "inputs": [
      {
        "item": {
          "base_harvest": "Fälle einen Oak-Baum",
          "id": "log_oak",
          "image_url": "imgs/items/log_oak.png",
          "is_base": true,
          "name": "Oak Log"
        },
        "qty": 1
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_oak",
          "image_url": "imgs/items/plank_oak.png",
          "is_base": false,
          "name": "Oak Planks"
        },
        "qty": 4
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_sticks_from_jungle",
    "image_url": "imgs/recipes/act_sticks_from_jungle.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_jungle",
          "image_url": "imgs/items/plank_jungle.png",
          "is_base": false,
          "name": "Jungle Planks"
        },
        "qty": 2
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": "Sammle Sticks aus Blättern/Dead Bushes",
          "id": "stick",
          "image_url": "imgs/items/stick.png",
          "is_base": true,
          "name": "Stick"
        },
        "qty": 4
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  },
  {
    "action_type_id": "crafting",
    "id": "act_sticks_from_oak",
    "image_url": "imgs/recipes/act_sticks_from_oak.png",
    "inputs": [
      {
        "item": {
          "base_harvest": null,
          "id": "plank_oak",
          "image_url": "imgs/items/plank_oak.png",
          "is_base": false,
          "name": "Oak Planks"
        },
        "qty": 2
      }
    ],
    "outputs": [
      {
        "item": {
          "base_harvest": "Sammle Sticks aus Blättern/Dead Bushes",
          "id": "stick",
          "image_url": "imgs/items/stick.png",
          "is_base": true,
          "name": "Stick"
        },
        "qty": 4
      }
    ],
    "sources": [{ "id": "src_official", "name": "Official Recipes", "note": null, "trust": "0.95" }],
    "station": "crafting_table"
  }
] as unknown as Action[]; // <-- cast wegen is_base (boolean vs. string)

describe('buildKnowledgeGraphStatic – target: pickaxe_stone', () => {
  it('baut den Graph korrekt (2 Varianten, richtige Kanten, keine Unknown-Kette)', () => {
    const { nodes, edges } = buildKnowledgeGraphStatic(actions, 'pickaxe_stone');

    // erwartete Nodes (nur entlang des Pfads zur Spitzhacke)
    const expected = new Set([
      'pickaxe_stone',
      'cobblestone',
      'stick',
      'act_pickaxe_correct',
      'act_pickaxe_bad',
    ]);
    const nodeIds = new Set(nodes.map(n => n.id));
    expect(nodeIds).toEqual(expected);

    // Action-Trust/Source
    const actOk  = nodes.find(n => n.id === 'act_pickaxe_correct')!;
    const actBad = nodes.find(n => n.id === 'act_pickaxe_bad')!;
    expect(actOk.kind).toBe('action');
    expect(actBad.kind).toBe('action');
    expect(actOk.trust).toBeCloseTo(0.95, 5);
    expect(actOk.sourceName).toBe('Official Recipes');
    expect(actBad.trust).toBeCloseTo(0.30, 5);
    expect(actBad.sourceName).toBe('Community Variant');

    // Labels der Actions (optional, aber nice)
    expect(actOk.label).toBe('3 Cobblestone + 2 Stick');
    expect(actBad.label).toBe('2 Cobblestone + 2 Stick');

    // Keine Unknown-Kette
    expect(nodes.some(n => n.id.startsWith('unknown_input_for_'))).toBe(false);
    expect(nodes.some(n => n.id === 'act_pickaxe_stone_unknown')).toBe(false);
    expect(nodes.find(n => n.id === 'pickaxe_stone')!.isUnknown).toBeFalsy();

    // Edges & Mengen
    expect(edgeExists(edges, 'cobblestone', 'act_pickaxe_correct', 3)).toBe(true);
    expect(edgeExists(edges, 'stick',       'act_pickaxe_correct', 2)).toBe(true);
    expect(edgeExists(edges, 'act_pickaxe_correct', 'pickaxe_stone', 1)).toBe(true);

    expect(edgeExists(edges, 'cobblestone', 'act_pickaxe_bad', 2)).toBe(true);
    expect(edgeExists(edges, 'stick',       'act_pickaxe_bad', 2)).toBe(true);
    expect(edgeExists(edges, 'act_pickaxe_bad', 'pickaxe_stone', 1)).toBe(true);

    // Base-Flags
    expect(nodes.find(n => n.id === 'cobblestone')!.isBase).toBe(true);
    expect(nodes.find(n => n.id === 'stick')!.isBase).toBe(true);

    // Keine Fremdknoten
    const forbidden = ['crafting_table', 'iron_sword', 'plank_oak', 'plank_jungle', 'log_oak', 'log_jungle'];
    forbidden.forEach(id => expect(nodeIds.has(id)).toBe(false));

    // Kantenanzahl: 6
    expect(edges.length).toBe(6);
  });
});
