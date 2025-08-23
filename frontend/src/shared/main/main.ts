import {Component, inject, Input} from '@angular/core';
import { SidebarControlsComponent, ControlOption, ControlToggle } from '../sidebar-controls/sidebar-controls.component';
import {SharedModule} from '../shared-module';
import {Payload, State} from '../../models/input.model';
import {Api} from '../../services/api';
import {MiniEdge, MiniNode} from '../mini-graph/mini-graph.component';
import {tap} from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: false,
})
export class Main {
  private api = inject(Api);
  // Beispiel: nur 3 Optionen + 3 Checkboxen
  options: ControlOption[] = [
    { key: 'crafting_table', label: 'Crafting table', imgSrc: '/imgs/achievements/crafting_table.png' },
    { key: 'stone_pickaxe', label: 'Stone pickaxe', imgSrc: '/imgs/achievements/stone_pickaxe.png' },
    { key: 'iron_sword', label: 'Iron sword', imgSrc: '/imgs/achievements/iron_sword.png' },
    { key: 'diamond_sword', label: 'diamond_sword', imgSrc: '/imgs/achievements/diamond_sword.png' },
  ];

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
    { id: 'act_pickaxe_bad',  label: '2 Cobble + 2 Sticks', trust: 0.12, sourceName: 'Untrusted Wiki', kind: 'action', img: 'imgs/recipes/act_pickaxe_bad.png',     x: 760, y: 440, w: 108, h: 108 },

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


  onSelection(keys: string) {
    console.log('Auswahl geändert:', keys);
    // -> an Graph-Service weiterreichen

  }


}
