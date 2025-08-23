import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {Header} from './header/header';
import {Footer} from './footer/footer';
import {Main} from './main/main';
import {KnowledgeGraph} from './knowledge-graph/knowledge-graph';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [KnowledgeGraph, Header, Footer, Main],
  imports: [
    CommonModule,
    NgxGraphModule,
    BrowserAnimationsModule
  ],
  exports: [
    KnowledgeGraph,
    Header,
    Footer,
    Main
  ]
})
export class SharedModule { }
