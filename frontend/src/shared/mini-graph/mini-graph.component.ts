import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MiniEdge, MiniNode} from '../../models/graph.models';

@Component({
  selector: 'app-mini-graph',
  standalone: false,
  templateUrl: './mini-graph.component.html',
  styleUrls: ['./mini-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniGraphComponent {
  @Input() nodes: MiniNode[] = [];
  @Input() edges: MiniEdge[] = [];

  private draggingId: string | null = null;
  private dragOffset = {x: 0, y: 0};
  private divdragging = false;
  private divdragstart = {x: 0, y: 0};

  Math = Math;


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
      if (!s || !t) {
        return {id: e.id ?? '', d: '', cx: 0, cy: 0, label: '', conflict: false};
      }
      const d = `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
      return {
        id: e.id ?? `${e.source}->${e.target}`,
        d,
        cx: (s.x + t.x) / 2,
        cy: (s.y + t.y) / 2,
        label: e.qty != null ? String(e.qty) : '',
        conflict: !!e.conflict
      };
    });
  }

  onDivDown(evt: PointerEvent) {
    if(this.draggingId) {
      this.divdragging = false;
      return
    }
    this.divdragging = true
    this.divdragstart.x = evt.clientX;
    this.divdragstart.y = evt.clientY;
    console.log(this.divdragstart);
  }

  onDivMove(evt: PointerEvent) {
    if(this.draggingId) {
      this.divdragging = false;
      return
    }
    if (this.divdragging) {
      const deltax = this.divdragstart.x - evt.clientX;
      const deltay = this.divdragstart.y - evt.clientY;
      for (let nx of this.nodes) {
        nx.x -= deltax;
        nx.y -= deltay;
      }
      this.divdragstart.x = evt.clientX;
      this.divdragstart.y = evt.clientY;
    }
  }

  onDivUp($event: PointerEvent) {
    this.divdragging = false
  }

  onDivLeave($event: PointerEvent) {
    this.divdragging = false
  }
}
