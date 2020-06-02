import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { <%-ModuleName%>Component } from './<%-moduleName%>.component';
import { <%-ModuleName%>CoreRoutes } from '../<%-moduleName%>-cust/<%-moduleName%>.conf';

@NgModule({
  imports: [RouterModule.forChild(<%-ModuleName%>CoreRoutes)],
  exports: [RouterModule],
  providers: [ ],

})
export class <%-ModuleName%>RoutingCoreModule { }
