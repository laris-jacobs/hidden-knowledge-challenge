import {Component, inject, Input, OnInit} from '@angular/core';
import { SidebarControlsComponent, ControlOption, ControlToggle } from '../sidebar-controls/sidebar-controls.component';
import {SharedModule} from '../shared-module';
import {Payload, State} from '../../models/input.model';
import {Api} from '../../services/api';
import {MiniEdge, MiniNode} from '../mini-graph/mini-graph.component';
import {tap} from 'rxjs';
import {buildKnowledgeGraphStatic} from '../../services/graph-mapper';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: false,
})
export class Main implements OnInit{
  private api = inject(Api);
  // Beispiel: nur 3 Optionen + 3 Checkboxen
  options: ControlOption[] = [
    { key: 'crafting_table', label: 'Crafting table', imgSrc: '/imgs/achievements/crafting_table.png' },
    { key: 'stone_pickaxe', label: 'Stone pickaxe', imgSrc: '/imgs/achievements/stone_pickaxe.png' },
    { key: 'iron_sword', label: 'Iron sword', imgSrc: '/imgs/achievements/iron_sword.png' },
    { key: 'diamond_sword', label: 'diamond_sword', imgSrc: '/imgs/achievements/diamond_sword.png' },
  ];
  ngOnInit(): void {

    this.api.getAction().subscribe(result => {
      this.api.actions = result;
    });
  }

  nodes: MiniNode[] =[];
  edges: MiniEdge[] =[];


  onSelection(keys: string[]) {
    // -> an Graph-Service weiterreichen
    //@todo use this.api.actions to map
    const actions = this.api.actions.concat( []);

    // @ts-ignore
    if(keys.length >0){
    const graphResult =  buildKnowledgeGraphStatic(actions, keys[0]);
    this.nodes = graphResult.nodes;
    this.edges = graphResult.edges;
    }

  }


}
