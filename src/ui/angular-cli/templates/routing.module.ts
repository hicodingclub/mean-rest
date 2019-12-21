import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';

import { MddsRouteReuseStrategy } from '@hicoder/angular-core';

import { <%-ModuleName%>Component } from './<%-moduleName%>.component';
import { <%-ModuleName%>Routes } from '../<%-moduleName%>.conf';

@NgModule({
  imports: [RouterModule.forChild(<%-ModuleName%>Routes)],
  exports: [RouterModule],
  providers: [ // only use these providers in component scope
    { provide: RouteReuseStrategy, useClass: MddsRouteReuseStrategy },
  ],

})
export class <%-ModuleName%>RoutingModule { }
