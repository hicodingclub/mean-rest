import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';

import { MraRouteReuseStrategy } from '@hicoder/angular-core';

import { <%-ModuleName%>Component } from './<%-moduleName%>.component';
import { <%-ModuleName%>Routes } from '../<%-moduleName%>.conf';

@NgModule({
  imports: [RouterModule.forChild(<%-ModuleName%>Routes)],
  exports: [RouterModule],
  providers: [// only use these providers in component scope
    { provide: RouteReuseStrategy, useClass: MraRouteReuseStrategy },
  ],

})
export class <%-ModuleName%>RoutingModule { }
