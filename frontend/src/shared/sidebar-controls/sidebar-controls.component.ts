import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

export interface ControlOption { key: string; label: string; }
export interface ControlToggle { key: string; label: string; }

@Component({
  selector: 'app-sidebar-controls',
  standalone: false,
  templateUrl: './sidebar-controls.component.html',
  styleUrls: ['./sidebar-controls.component.scss'],
})
export class SidebarControlsComponent {
  /** Optionen (Einfachauswahl oder Mehrfachauswahl via @Input singleSelect) */
  @Input() options: ControlOption[] = [
    { key: 'opt1', label: 'Option 1' },
    { key: 'opt2', label: 'Option 2' },
    { key: 'opt3', label: 'Option 3' },
    { key: 'opt4', label: 'Option 4' },
  ];

  /** Checkboxen */
  @Input() toggles: ControlToggle[] = [
    { key: 'flagA', label: 'Checkbox 1' },
    { key: 'flagB', label: 'Checkbox 2' },
  ];

  /** true = nur eine Option gleichzeitig; false = mehrere möglich */
  @Input() singleSelect = true;

  /** initiale Auswahl (optional) */
  @Input() initialSelections: string[] = [];
  @Input() initialToggleState: Record<string, boolean> = {};

  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() stateChange = new EventEmitter<{ selections: string[]; toggles: Record<string, boolean> }>();
  @Output() submit = new EventEmitter<{ selections: string[]; toggles: Record<string, boolean> }>();

  // Zustand (Signals optional, geht auch mit normalen Feldern)
  selections = signal<string[]>([]);
  toggleState = signal<Record<string, boolean>>({});

  ngOnInit() {
    // Defaults übernehmen
    this.selections.set([...this.initialSelections]);
    const init: Record<string, boolean> = {};
    for (const t of this.toggles) {
      init[t.key] = this.initialToggleState[t.key] ?? false;
    }
    this.toggleState.set(init);
  }

  onClickOption(key: string) {
    const current = this.selections();
    let next: string[];

    if (this.singleSelect) {
      next = current.includes(key) ? [] : [key];
    } else {
      next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    }

    this.selections.set(next);
    this.selectionChange.emit(next);
    this.stateChange.emit({ selections: next, toggles: this.toggleState() });
  }

  onChangeToggle(key: string, checked: boolean) {
    const next = { ...this.toggleState(), [key]: checked };
    this.toggleState.set(next);
    this.stateChange.emit({ selections: this.selections(), toggles: next });
  }

  onSubmit(ev: Event) {
    ev.preventDefault();
    this.submit.emit({ selections: this.selections(), toggles: this.toggleState() });
  }
}
