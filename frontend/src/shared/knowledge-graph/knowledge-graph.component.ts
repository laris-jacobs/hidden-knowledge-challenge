import { Component } from '@angular/core';
import { MiniNode, MiniEdge } from '../mini-graph/mini-graph.component';

@Component({
  selector: 'app-knowledge-graph',
  standalone: false,
  templateUrl: './knowledge-graph.component.html',
  styleUrls: ['./knowledge-graph.component.scss']
})
export class KnowledgeGraphComponent {
  // Spalten-Layout (links -> rechts): x ≈ 120 | 280 | 440 | 600 | 760 | 920
  nodes: MiniNode[] = [
    // Column 0 – Base resources
    { id: 'log_oak',    label: 'Oak Log',     trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/log_oak.png',    x: 120, y: 140, w: 72, h: 72 },
    { id: 'log_jungle', label: 'Jungle Log',  trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/log_jungle.png', x: 120, y: 220, w: 72, h: 72 },
    { id: 'cobble',     label: 'Cobblestone', trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/cobblestone.png',x: 120, y: 360, w: 72, h: 72 },

    // Column 1 – Actions (Logs -> Planks)
    { id: 'act_planks_oak',    label: '1 Log → 4 Planks', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_planks_oak.png',    x: 280, y: 140, w: 108, h: 108 },
    { id: 'act_planks_jungle', label: '1 Log → 4 Planks', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_planks_jungle.png', x: 280, y: 220, w: 108, h: 108 },

    // Column 2 – Items (Planks)
    { id: 'plank_oak',    label: 'Oak Planks (4)',    trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/plank_oak.png',    x: 440, y: 140, w: 72, h: 72 },
    { id: 'plank_jungle', label: 'Jungle Planks (4)', trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/plank_jungle.png', x: 440, y: 220, w: 72, h: 72 },

    // Column 3 – Actions (Planks -> Sticks)
    { id: 'act_sticks_oak',    label: '2 Planks → 4 Sticks', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_sticks_from_oak.png',    x: 600, y: 140, w: 108, h: 108 },
    { id: 'act_sticks_jungle', label: '2 Planks → 4 Sticks', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_sticks_from_jungle.png', x: 600, y: 220, w: 108, h: 108 },

    // Column 4 – Items (Sticks)
    { id: 'stick', label: 'Stick', trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/stick.png', x: 760, y: 180, w: 72, h: 72 },

    // Column 5 – Actions (Pickaxe Varianten)
    { id: 'act_pickaxe_ok',   label: '3 Cobble + 2 Sticks', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_pickaxe_correct.png', x: 760, y: 340, w: 108, h: 108 },
    { id: 'act_pickaxe_bad',  label: '2 Cobble + 2 Sticks', trust: 0.12, sourceName: 'Official Wiki', kind: 'action', img: 'imgs/recipes/act_pickaxe_bad.png',     x: 760, y: 440, w: 108, h: 108 },

    // Optional: unbekannter Weg (Missing relevant knowledge)
    { id: 'stone_rod',           label: 'Stone Rod (unknown)', trust: 0.95, sourceName: 'Official Wiki', kind: 'item',   img: 'imgs/items/unknown.png',                 x: 600, y: 520, w: 72,  h: 72 },
    { id: 'act_pickaxe_unknown', label: '3 Cobble + 2 Stone Rod', trust: 0.95, sourceName: 'Official Wiki', kind: 'action', img: '', x: 760, y: 520, w: 108, h: 108 },

    // Column 6 – Ziel
    { id: 'pick', label: 'Stone Pickaxe', trust: 0.95, sourceName: 'Official Wiki', kind: 'item', img: 'imgs/items/stone_pickaxe.png', x: 920, y: 380, w: 72, h: 72 }
  ];

  edges: MiniEdge[] = [
    // Logs -> Planks
    { source: 'log_oak',    target: 'act_planks_oak',    qty: 1 },
    { source: 'act_planks_oak',    target: 'plank_oak',    qty: 4 },
    { source: 'log_jungle', target: 'act_planks_jungle', qty: 1 },
    { source: 'act_planks_jungle', target: 'plank_jungle', qty: 4 },

    // Planks -> Sticks (beide Holzarten)
    { source: 'plank_oak',    target: 'act_sticks_oak',    qty: 2 },
    { source: 'act_sticks_oak',    target: 'stick',             qty: 4 },
    { source: 'plank_jungle', target: 'act_sticks_jungle', qty: 2 },
    { source: 'act_sticks_jungle', target: 'stick',             qty: 4 },

    // Pickaxe (korrekt)
    { source: 'cobble', target: 'act_pickaxe_ok',  qty: 3 },
    { source: 'stick',  target: 'act_pickaxe_ok',  qty: 2 },
    { source: 'act_pickaxe_ok', target: 'pick',    qty: 1 },

    // Pickaxe (Konflikt / Community)
    { source: 'cobble', target: 'act_pickaxe_bad', qty: 2 },
    { source: 'stick',  target: 'act_pickaxe_bad', qty: 2 },
    { source: 'act_pickaxe_bad', target: 'pick',   qty: 1 },

    // Missing relevant knowledge – Stone Rod hat keinen Herstellungsweg
    { source: 'cobble',    target: 'act_pickaxe_unknown', qty: 3 },
    { source: 'stone_rod', target: 'act_pickaxe_unknown', qty: 1 },
    { source: 'act_pickaxe_unknown', target: 'pick',       qty: 1 }
  ];

  private nodeById = new Map<string, MiniNode>();

  ngOnInit() {
    this.indexGraph();
    this.detectAndMarkConflicts();
  }

  private indexGraph() {
    this.nodeById.clear();
    for (const n of this.nodes) this.nodeById.set(n.id, n);
  }

  private detectAndMarkConflicts() {
    const inByTarget = new Map<string, MiniEdge[]>();
    const outBySource = new Map<string, MiniEdge[]>();
    for (const e of this.edges) {
      (inByTarget.get(e.target) ?? inByTarget.set(e.target, []).get(e.target)!)!.push(e);
      (outBySource.get(e.source) ?? outBySource.set(e.source, []).get(e.source)!)!.push(e);
    }

    type Recipe = {
      action: MiniNode;
      targetItemId: string;
      ingIds: string[];          // sortiert
      qtySig: string;            // "cobble:3|stick:2"
      inEdges: MiniEdge[];
      outEdge?: MiniEdge;
    };

    const groups = new Map<string, Recipe[]>();

    for (const action of this.nodes.filter(n => n.kind === 'action')) {
      const outEdges = (outBySource.get(action.id) || []).filter(e => this.nodeById.get(e.target)?.kind === 'item');
      for (const out of outEdges) {
        const inEdges = (inByTarget.get(action.id) || []).filter(e => this.nodeById.get(e.source)?.kind === 'item');
        const ids = inEdges.map(e => e.source).sort();
        const qtySig = ids.map(id => {
          const ed = inEdges.find(x => x.source === id)!;
          return `${id}:${ed.qty ?? ''}`;
        }).join('|');
        const key = `${out.target}__${ids.join(',')}`;
        const rec: Recipe = { action, targetItemId: out.target, ingIds: ids, qtySig, inEdges, outEdge: out };
        (groups.get(key) ?? groups.set(key, []).get(key)!)!.push(rec);
      }
    }

    for (const [key, recs] of groups) {
      if (recs.length < 2) continue;
      const sigs = new Set(recs.map(r => r.qtySig));
      if (sigs.size > 1) {
        // Konflikt → markiere Actions & Kanten
        for (const r of recs) {
          r.action.conflictKey = `conflict:${key}`;
          for (const ie of r.inEdges) ie.conflict = true;
          if (r.outEdge) r.outEdge.conflict = true;
        }
      }
    }
  }
}
