import {Component, Input} from '@angular/core';
import { SidebarControlsComponent, ControlOption, ControlToggle } from '../sidebar-controls/sidebar-controls.component';
import {SharedModule} from '../shared-module';
import {Payload, State} from '../../models/input.model';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: false,
})
export class Main {
  options: ControlOption[] = [
    { key: 'crafting_table', label: 'Crafting table', imgSrc: '/imgs/achievements/crafting_table.png' },
    { key: 'stone_pickaxe', label: 'Stone pickaxe', imgSrc: '/imgs/achievements/stone_pickaxe.png' },
    { key: 'iron_sword', label: 'Iron sword', imgSrc: '/imgs/achievements/iron_sword.png' },
    { key: 'diamond_sword', label: 'diamond_sword', imgSrc: '/imgs/achievements/diamond_sword.png' },
  ];

  toggles: ControlToggle[] = [
    { key: 'flagA', label: 'Official Minecraft Wiki' },
    { key: 'flagB', label: 'Minecraft Fandom' },
  ];

  onSelection(keys: string[]) {
    console.log('Auswahl geändert:', keys);
    // -> an Graph-Service weiterreichen
  }

  onState(state: State) {
    console.log('Gesamtzustand:', state);
  }

  onSubmit(payload: Payload) {
    console.log('Ausführen:', payload);
    // -> Graph aktualisieren/neu rendern
  }
}
