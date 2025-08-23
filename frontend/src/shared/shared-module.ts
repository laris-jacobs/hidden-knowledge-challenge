import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {Header} from './header/header';
import {Footer} from './footer/footer';
import {Main} from './main/main';
import {KnowledgeGraphComponent} from './knowledge-graph/knowledge-graph.component';
import { MiniGraphComponent } from './mini-graph/mini-graph.component';
import { SidebarControlsComponent } from './sidebar-controls/sidebar-controls.component';

@NgModule({
  declarations: [KnowledgeGraphComponent, MiniGraphComponent, SidebarControlsComponent, Header, Footer, Main],
  imports: [
    CommonModule,
    NgxGraphModule
  ],
  exports: [
    KnowledgeGraphComponent,
    MiniGraphComponent,
    SidebarControlsComponent,
    Header,
    Footer,
    Main
  ]
})
export class SharedModule { }
