import {Component, inject, OnInit} from '@angular/core';
import {ControlOption} from '../sidebar-controls/sidebar-controls.component';
import {Api} from '../../services/api';
import {MiniEdge, MiniNode} from '../../models/graph.models';
import {buildKnowledgeGraphStatic} from '../../services/graph-mapper';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: false,
})
export class Main implements OnInit {
  private api = inject(Api);
  // Beispiel: nur 3 Optionen + 3 Checkboxen
  options: ControlOption[] = [
    {key: 'crafting_table', label: 'Crafting table', imgSrc: '/imgs/achievements/crafting_table.png'},
    {key: 'iron_sword', label: 'Iron sword', imgSrc: '/imgs/achievements/iron_sword.png'},
    {key: 'pickaxe_stone', label: 'Stone pickaxe', imgSrc: '/imgs/achievements/stone_pickaxe.png'},
  ];

  ngOnInit(): void {
    this.api.getAction().subscribe(result => {
      this.api.actions = result;
    });
  }

  nodes: MiniNode[] = [];
  edges: MiniEdge[] = [];


  onSelection(keys: string[]) {
    const actions = this.api.actions.concat([]);

    // @ts-ignore
    if (keys.length > 0) {
      const graphResult = buildKnowledgeGraphStatic(actions, keys[0]);
      this.nodes = graphResult.nodes;
      this.edges = graphResult.edges;
    }

  }
}
