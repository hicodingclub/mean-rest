import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';

import { <%-ModuleName%>Routes } from '../<%-moduleName%>-cust/<%-moduleName%>.conf';

@NgModule({
  imports: [RouterModule.forChild(<%-ModuleName%>Routes)],
  exports: [RouterModule],
  providers: [ ],

})
export class <%-ModuleName%>RoutingModule { }
