import {NgModule, provideBrowserGlobalErrorListeners} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing-module';
import {App} from './app';
import {NgxEchartsModule} from 'ngx-echarts';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {SharedModule} from '../shared/shared-module';


@NgModule({
  declarations: [
    App
  ],
  imports: [
    SharedModule,
    BrowserModule,
    NgxGraphModule,
    AppRoutingModule,// other imports
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
