import { Component, Input } from '@angular/core';

export type NodeKind = 'item' | 'action';

export interface MiniNode {
  id: string;
  label: string;
  kind: NodeKind;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MiniEdge {
  id?: string;
  source: string;
  target: string;
  qty?: number | string;
}

@Component({
  selector: 'app-mini-graph',
  standalone: false,
  templateUrl: './mini-graph.component.html',
  styleUrls: ['./mini-graph.component.scss']
})
export class MiniGraphComponent {
  @Input() nodes: MiniNode[] = [];
  @Input() edges: MiniEdge[] = [];

  Math = Math;

  private draggingId: string | null = null;
  private dragOffset = { x: 0, y: 0 };

  onPointerDown(evt: PointerEvent, n: MiniNode) {
    const el = evt.currentTarget as SVGGraphicsElement;
    el.setPointerCapture?.(evt.pointerId);
    this.draggingId = n.id;
    this.dragOffset.x = evt.clientX - n.x;
    this.dragOffset.y = evt.clientY - n.y;
  }
  onPointerMove(evt: PointerEvent) {
    if (!this.draggingId) return;
    const n = this.nodes.find(nd => nd.id === this.draggingId);
    if (!n) return;
    n.x = evt.clientX - this.dragOffset.x;
    n.y = evt.clientY - this.dragOffset.y;
  }
  onPointerUp(evt: PointerEvent) {
    if (!this.draggingId) return;
    (evt.currentTarget as SVGGraphicsElement).releasePointerCapture?.(evt.pointerId);
    this.draggingId = null;
  }

  get edgePaths() {
    const map = new Map(this.nodes.map(n => [n.id, n]));
    return this.edges.map(e => {
      const s = map.get(e.source);
      const t = map.get(e.target);
      if (!s || !t) return { id: e.id ?? '', d: '', cx: 0, cy: 0, label: '', conflict: false };

      const d = `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
      return {
        id: e.id ?? `${e.source}->${e.target}`,
        d,
        cx: (s.x + t.x) / 2,
        cy: (s.y + t.y) / 2,
        label: e.qty?.toString() ?? '',
        conflict: !!e.conflict
      };
    });
  }

}

export interface MiniNode {
  id: string;
  label: string;
  kind: NodeKind;
  img: string;
  x: number; y: number; w: number; h: number;

  // NEU (optional)
  trust?: number;          // 0..1
  sourceName?: string;     // z.B. "Official Wiki"
  conflictKey?: string;    // gesetzt, wenn Action in Konfliktgruppe ist
}

export interface MiniEdge {
  id?: string;
  source: string;
  target: string;
  qty?: number | string;

  // NEU (optional)
  conflict?: boolean;      // true => rote Markierung
}
