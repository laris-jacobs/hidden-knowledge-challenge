import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGraphModule, Node, Edge } from '@swimlane/ngx-graph';

type NodeKind = 'item' | 'action';

interface GNode extends Node {
  data?: { kind: NodeKind; img?: string; caption?: string };
}
interface GEdge extends Edge {
  data?: { qty?: number };
}

@Component({
  selector: 'app-knowledge-graph',
  standalone: false,
  templateUrl: './knowledge-graph.html',
  styleUrls: ['./knowledge-graph.scss']
})
export class KnowledgeGraphComponent {
  nodes: GNode[] = [
    { id: 'cobble', label: 'Cobblestone', data: { kind: 'item', img: '/imgs/items/cobblestone.png' } },
    { id: 'stick',  label: 'Stick',       data: { kind: 'item', img: '/imgs/items/stick.png' } },
    { id: 'pick',   label: 'Stone Pickaxe', data: { kind: 'item', img: '/imgs/items/stone_pickaxe.png' } },
    {
      id: 'act_pickaxe_correct',
      label: 'Craft @ table',
      data: {
        kind: 'action',
        img: '/imgs/recipes/act_pickaxe_correct.png',
        caption: '3 Cobble + 2 Sticks'
      }
    }
  ];

  links: GEdge[] = [
    { source: 'cobble', target: 'act_pickaxe_correct', data: { qty: 3 } },
    { source: 'stick',  target: 'act_pickaxe_correct', data: { qty: 2 } },
    { source: 'act_pickaxe_correct', target: 'pick',   data: { qty: 1 } }
  ];
}
