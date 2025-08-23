import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {Footer} from './footer/footer';
import {Main} from './main/main';
import {KnowledgeGraphComponent} from './knowledge-graph/knowledge-graph.component';
import { MiniGraphComponent } from './mini-graph/mini-graph.component';
import { HttpClientModule } from '@angular/common/http';
import { SidebarControlsComponent } from './sidebar-controls/sidebar-controls.component';

@NgModule({
  declarations: [KnowledgeGraphComponent, MiniGraphComponent, SidebarControlsComponent, Footer, Main],
  imports: [
    CommonModule,
    NgxGraphModule,
    HttpClientModule,
  ],
  exports: [
    KnowledgeGraphComponent,
    MiniGraphComponent,
    SidebarControlsComponent,
    Footer,
    Main
  ]
})
export class SharedModule { }
