import {Component, inject, Input} from '@angular/core';
import { MiniNode, MiniEdge } from '../mini-graph/mini-graph.component';
import {Api} from '../../services/api';

@Component({
  selector: 'app-knowledge-graph',
  standalone: false,
  templateUrl: './knowledge-graph.component.html',
  styleUrls: ['./knowledge-graph.component.scss']
})
export class KnowledgeGraphComponent {
   private api = inject(Api);
   @Input() nodes!: MiniNode [];
   @Input() edges!: MiniEdge [] ;
  // Spalten-Layout (links -> rechts): x ≈ 120 | 280 | 440 | 600 | 760 | 920


  private nodeById = new Map<string, MiniNode>();

  ngOnInit() {
    this.indexGraph();
    this.detectAndMarkConflicts();
    this.api.getAction().subscribe(x => {
      console.log(x);
    })
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
