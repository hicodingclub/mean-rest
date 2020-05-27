import { Routes } from '@angular/router';

import { <%-ModuleName%>Component } from '../<%-moduleName%>/<%-moduleName%>.component';

//Import routing paths
import { <% 
  for (let sch_name in schemaMap) {
    let schDef = schemaMap[sch_name];
    if (['L', 'C', 'R', 'U', 'D'].some(x => schDef.api.includes(x))) {
  %>
  <%-schDef.schemaName%>RoutingCorePath, <% } }%> 
} from '../<%-moduleName%>/<%-moduleName%>-routing.core.path';

export const <%-ModuleName%>CoreRoutes: Routes = [
  { 
    // Lazy Load: and add to app routing: 
    //     loadChildren: () => import('./<%-moduleName%>/<%-moduleName%>.module').then(m => m.<%-ModuleName%>Module)
    path: '',
    // non lazy load config. Include module in app module.
    // path: '<%-moduleName%>',

    component: <%-ModuleName%>Component,
    children: [
      {path: '',  redirectTo: '<%-defaultSchema%>', pathMatch: 'full'},
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
      { path: '<%-schm.schemaName%>',
        children: <%-schm.schemaName%>RoutingCorePath,
        data: {mraLevel: 1, item: '<%-schm.schemaName%>'}
      },<%_
}%>
    ]
  },
];

import { <%-ModuleName%>RoutingCustPath } from './<%-moduleName%>-routing.cust.path';

export const <%-ModuleName%>Routes: Routes = [
  {
    // Lazy Load: and add to app routing: 
    //     loadChildren: () => import('./<%-moduleName%>/<%-moduleName%>.module').then(m => m.<%-ModuleName%>Module)
    path: 'cust',
    // non lazy load config. Include module in app module.
    // path: '<%-moduleName%>/cust',

    children: <%-ModuleName%>RoutingCustPath,
  },
];

export const <%-moduleName%>_server_root_uri: string = '/<%-apiBase%>';
