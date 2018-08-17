import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { <%-ModuleName%>Component } from './blogsys.component';

//Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
<%_ }%>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
const <%-schm.schemaName%>RoutingPath = [
    {path: 'list', component: <%-schm.SchemaName%>ListComponent},
    {path: 'detail/:id', component: <%-schm.SchemaName%>DetailComponent},
    {path: 'edit/:id', component: <%-schm.SchemaName%>EditComponent},
    {path: 'new', component: <%-schm.SchemaName%>EditComponent},
    {path: '**', redirectTo: 'list', pathMatch: 'full'}
];
<%_ }%>
const routes: Routes = [
  { path: '<%-moduleName%>', 
    component: <%-ModuleName%>Component,
    children: [ 
                {path: '',  redirectTo: '<%-defaultSchema%>', pathMatch: 'full'},
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
                {path: "<%-schm.schemaName%>",  children: <%-schm.schemaName%>RoutingPath},<%_
 }%>
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class <%-ModuleName%>RoutingModule { }
