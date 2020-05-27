import { NgModule } from '@angular/core';
import { <%-ModuleName%>RoutingModule } from './<%-moduleName%>-routing.module';
import { <%-ModuleName%>CoreModule } from './<%-moduleName%>.core.module';
import { <%-ModuleName%>CustModule } from '../<%-moduleName%>-cust/<%-moduleName%>.cust.module'

@NgModule({
  imports: [
    <%-ModuleName%>RoutingModule,
    <%-ModuleName%>CoreModule,
    <%-ModuleName%>CustModule,
  ],
  declarations: [
  ],
  exports: [
    <%-ModuleName%>CoreModule,
    <%-ModuleName%>CustModule,
  ],
  providers: [
  ],
  entryComponents: [
  ]
})
export class <%-ModuleName%>Module { }
