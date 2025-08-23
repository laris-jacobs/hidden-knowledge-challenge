import {Component, inject, Input} from '@angular/core';
import {MiniEdge, MiniNode} from '../../models/graph.models';
import {Api} from '../../services/api';

@Component({
  selector: 'app-knowledge-graph',
  standalone: false,
  templateUrl: './knowledge-graph.component.html',
  styleUrls: ['./knowledge-graph.component.scss']
})
export class KnowledgeGraphComponent {
   private api = inject(Api);
   @Input() nodes!: MiniNode [];
   @Input() edges!: MiniEdge [] ;
  // Spalten-Layout (links -> rechts): x ≈ 120 | 280 | 440 | 600 | 760 | 920
}
