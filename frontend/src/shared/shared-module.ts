import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {Header} from './header/header';
import {Footer} from './footer/footer';
import {Main} from './main/main';
import {KnowledgeGraphComponent} from './knowledge-graph/knowledge-graph.component';
import { MiniGraphComponent } from './mini-graph/mini-graph.component';

@NgModule({
  declarations: [KnowledgeGraphComponent, MiniGraphComponent, Header, Footer, Main],
  imports: [
    CommonModule,
    NgxGraphModule
  ],
  exports: [
    KnowledgeGraphComponent,
    MiniGraphComponent,
    Header,
    Footer,
    Main
  ]
})
export class SharedModule { }
