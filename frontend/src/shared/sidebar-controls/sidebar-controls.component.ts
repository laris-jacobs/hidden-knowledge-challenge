import {Component, EventEmitter, Input, Output, signal} from '@angular/core';

export interface ControlOption {
  key: string;
  label: string;
  imgSrc?: string;
  imgAlt?: string;
}

export interface ControlToggle {
  key: string;
  label: string;
}

@Component({
  selector: 'app-sidebar-controls',
  standalone: false,
  templateUrl: './sidebar-controls.component.html',
  styleUrls: ['./sidebar-controls.component.scss'],
})
export class SidebarControlsComponent {
  @Input() options: ControlOption[] = [];

  @Input() toggles: ControlToggle[] = [];

  @Input() singleSelect = true;
  @Input() initialSelections: string[] = [];
  @Input() initialToggleState: Record<string, boolean> = {};

  @Output() selectionChange = new EventEmitter<string[]>();

  selections = signal<string[]>([]);
  toggleState = signal<Record<string, boolean>>({});

  ngOnInit() {
    this.selections.set([...this.initialSelections]);
    const init: Record<string, boolean> = {};
    for (const t of this.toggles) init[t.key] = this.initialToggleState[t.key] ?? false;
    this.toggleState.set(init);
  }

  onClickOption(key: string) {
    const current = this.selections();
    let next: string[];
    if (this.singleSelect) next = current.includes(key) ? [] : [key];
    else next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];

    this.selections.set(next);
    this.selectionChange.emit(next);
  }
}
