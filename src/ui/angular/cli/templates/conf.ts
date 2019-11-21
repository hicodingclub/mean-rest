import { Routes } from '@angular/router';

import { <%-ModuleName%>Component } from './<%-moduleName%>/<%-moduleName%>.component';

//Import routing paths
import { <% 
  for (let sch_name in schemaMap) {
    let schDef = schemaMap[sch_name];
    if (['L', 'C', 'R', 'U', 'D'].some(x => schDef.api.includes(x))) {
  %><%-schDef.schemaName%>RoutingPath, <% } }%> } from './<%-moduleName%>/<%-moduleName%>-routing.path';

export const <%-ModuleName%>Routes: Routes = [
  { path: '<%-moduleName%>',
    component: <%-ModuleName%>Component,
    children: [
      {path: '',  redirectTo: '<%-defaultSchema%>', pathMatch: 'full'},
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
      { path: "<%-schm.schemaName%>",
        children: <%-schm.schemaName%>RoutingPath,
        data: {"mraLevel": 1, "item": "<%-schm.schemaName%>"}
      },<%_
 }%>
    ]
  }
];

export const <%-moduleName%>_server_root_uri:string = "/<%-apiBase%>";