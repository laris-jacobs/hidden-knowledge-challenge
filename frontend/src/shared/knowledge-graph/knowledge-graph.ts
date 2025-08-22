import {Component} from '@angular/core';
import {Edge, Node} from '@swimlane/ngx-graph';

@Component({
  selector: 'app-knowledge-graph',
  standalone:false,
  templateUrl: './knowledge-graph.html',
  styleUrl: './knowledge-graph.scss'
})
export class KnowledgeGraph { //implements OnInit, AfterViewInit {

  nodes: Node[] = [
    { id: 'angular', label: 'Angular' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'rxjs', label: 'RxJS' },
    { id: 'ngrx', label: 'NgRx' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' }
  ];

  links: Edge[] = [
    { source: 'angular', target: 'typescript', label: 'uses' },
    { source: 'angular', target: 'rxjs', label: 'reactive' },
    { source: 'angular', target: 'ngrx', label: 'state' },
    { source: 'angular', target: 'html', label: 'templates' },
    { source: 'html', target: 'css', label: 'style' }
  ];
}
