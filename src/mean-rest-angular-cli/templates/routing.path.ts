// Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
    <%_ if (schm.schemaHasRef) {%>
import { <%-schm.SchemaName%>ListSubComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-sub.component';
<%}%>
<%_ }%>
<%_ if (authRequired) {%>
import { AuthGuard } from 'mdds-angular-auth';
<%}%>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; if (schm.schemaHasRef) {%>
const <%-schm.schemaName%>SubPath = [
    {path: 'list', component: <%-schm.SchemaName%>ListSubComponent}
];
<%}} %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; if (schm.referred) {%>
const <%-schm.schemaName%>DetailPath = [
    <%_for (let item of schm.referredBy) {%>
    {path: '<%-item[0]%>', children: <%-item[0]%>SubPath,
        data: {'mraLevel': 2, 'item': '<%-item[0]%>'}},<%_ } %>
];
<%}} %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
export const <%-schm.schemaName%>RoutingPath = [
    {path: 'list', component: <%-schm.SchemaName%>ListComponent<%
     if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},
    {path: 'detail/:id', component: <%-schm.SchemaName%>DetailComponent<%
     if (schm.referred) {%>, children: <%-schm.schemaName%>DetailPath<%}%><%
     if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},
    {path: 'edit/:id', component: <%-schm.SchemaName%>EditComponent<%
     if (!schm.permission.includes('U')) {%>, canActivate: [AuthGuard]<%}%>},
    {path: 'new', component: <%-schm.SchemaName%>EditComponent<%
     if (!schm.permission.includes('C')) {%>, canActivate: [AuthGuard]<%}%>},
    {path: '**', redirectTo: 'list', pathMatch: 'full'}
];
<%_ }%>