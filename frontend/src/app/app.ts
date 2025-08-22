import {Component, signal} from '@angular/core';
import {EChartsOption} from 'echarts';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hiddenKnowledge');
  chartOption: EChartsOption = {
    title: { text: 'Knowledge Graph Example' },
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true, // zoom & pan
        label: { show: true },
        force: { repulsion: 200 },
        data: [
          { name: 'Angular', symbolSize: 50 },
          { name: 'TypeScript', symbolSize: 40 },
          { name: 'RxJS', symbolSize: 30 },
          { name: 'NgRx', symbolSize: 30 }
        ],
        links: [
          { source: 'Angular', target: 'TypeScript' },
          { source: 'Angular', target: 'RxJS' },
          { source: 'Angular', target: 'NgRx' }
        ]
      }
    ]
  };
}
