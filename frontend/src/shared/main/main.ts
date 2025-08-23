import { Component } from '@angular/core';
import { SidebarControlsComponent, ControlOption, ControlToggle } from '../sidebar-controls/sidebar-controls.component';
import {SharedModule} from '../shared-module';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: false,
})
export class Main {
  // Beispiel: nur 3 Optionen + 3 Checkboxen
  options: ControlOption[] = [
    { key: 'p1', label: 'Personen' },
    { key: 'o1', label: 'Orte' },
    { key: 'e1', label: 'Ereignisse' },
  ];

  toggles: ControlToggle[] = [
    { key: 'directed', label: 'Gerichteter Graph' },
    { key: 'weighted', label: 'Gewichtete Kanten' },
    { key: 'cluster',  label: 'Cluster zeigen' },
  ];

  onSelection(keys: string[]) {
    console.log('Auswahl geändert:', keys);
    // -> an Graph-Service weiterreichen
  }

  onState(state: { selections: string[]; toggles: Record<string, boolean> }) {
    console.log('Gesamtzustand:', state);
  }

  onSubmit(payload: { selections: string[]; toggles: Record<string, boolean> }) {
    console.log('Ausführen:', payload);
    // -> Graph aktualisieren/neu rendern
  }
}
