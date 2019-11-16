// Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %>
  <%_ if (api.includes("L")) {%>import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';<%}%>
  <%_ if (api.includes("R")) {%>import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';<%}%>
  <%_ if (api.includes("U") || api.includes("C")) {%>import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';<%}%>
  <%_ if (schm.schemaHasRef) {
    if (api.includes("L")) {%>import { <%-schm.SchemaName%>ListSubComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-sub.component';<%}
  }%><%_if (api.includes("R")) {
    if (schm.assoRoutes.length > 0 ) {%>
import { <%-schm.SchemaName%>AssoComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-asso.component';<%} }%>
<%_ }%>
<%_ if (authRequired) {%>
import { AuthGuard } from 'mdds-angular-auth';
<%}%>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; if (schm.schemaHasRef) {%>
  <%_ if (api.includes("L")) {%>const <%-schm.schemaName%>SubPath = [
    {path: 'list', component: <%-schm.SchemaName%>ListSubComponent}
];<%}%>
<%}} %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; if (schm.referred) {%>
  <%_ if (api.includes("R")) {%>const <%-schm.schemaName%>DetailPath = [
   <%_for (let item of schm.referredBy) { let subApi = item[8]; %>
    <%if (subApi.includes("L")) {%>{path: '<%-item[0]%>', children: <%-item[0]%>SubPath,
        data: {'mraLevel': 2, 'item': '<%-item[0]%>'}},<%}%><%_ } %>
];<%}%>
<%}} %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %>
export const <%-schm.schemaName%>RoutingPath = [
    <%if (api.includes("L")) {%>{path: 'list', component: <%-schm.SchemaName%>ListComponent<%
     if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},<%}%>
    <%if (api.includes("R")) {%>{path: 'detail/:id', component: <%-schm.SchemaName%>DetailComponent<%
     if (schm.referred) {%>, children: <%-schm.schemaName%>DetailPath<%}%><%
     if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},<%}%>
    <% if (api.includes("U")) {%>{path: 'edit/:id', component: <%-schm.SchemaName%>EditComponent<%
     if (!schm.permission.includes('U')) {%>, canActivate: [AuthGuard]<%}%>},<%}%>
    <% if (api.includes("C")) {%>{path: 'new', component: <%-schm.SchemaName%>EditComponent<%
     if (!schm.permission.includes('C')) {%>, canActivate: [AuthGuard]<%}%>},<%}%>
    <%if (api.includes("R")) {
        for (let r of schm.assoRoutes) {%>
    {path: 'asso/:id/<%-r[0]%>/<%-r[2]%>', component: <%-schm.SchemaName%>AssoComponent<%
      if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},<%}%><%}%>
    <%if (api.includes("L")) {%>{path: '**', redirectTo: 'list', pathMatch: 'full'}<%}%>
];
<%_ }%>