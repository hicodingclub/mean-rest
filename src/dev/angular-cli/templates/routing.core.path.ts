// Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; let detailType = schm.detailType;%>
  <%_ if (api.includes("L") && schm.listTypeNormal) {%>import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';<%}%>
  <%_ if (api.includes("L") && !schm.listTypeNormal) {%>import { <%-schm.SchemaName%>ListWidget<%-schm.ListType%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-widget-<%-schm.listType%>.component';<%}%>
  <%_ if (api.includes("R") && detailType === 'normal') {%>import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';<%}%>
  <%_ if (api.includes("R") && detailType !== 'normal') {%>import { <%-schm.SchemaName%>DetailWidget<%-schm.DetailType%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-widget-<%-detailType%>.component';<%}%>
  <%_ if (api.includes("U") || api.includes("C")) {%>import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';<%}%>
  <%_ if (schm.sFeatures.hasRef) {
    if (api.includes("L")) {%>import { <%-schm.SchemaName%>ListSubComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-sub.component';<%}
  }%><%_if (api.includes("R")) {
    if (schm.assoRoutes.length > 0 ) {%>
import { <%-schm.SchemaName%>AssoComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-asso.component';<%} }%>
<%_ }%>
<%_ if (authRequired) {%>
import { AuthGuard } from '@hicoder/angular-auth';
<%}%>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; if (schm.sFeatures.hasRef) {%>
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
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; let detailType = schm.detailType;%>
export const <%-schm.schemaName%>RoutingCorePath = [
    <%if (api.includes("L")) {%>{path: 'list', component: <%if (schm.listTypeNormal) {%><%-schm.SchemaName%>ListComponent<%} else {%><%-schm.SchemaName%>ListWidget<%-schm.ListType%>Component<%}
     if (!schm.permission.includes('R')) {%>, canActivate: [AuthGuard]<%}%>},<%}%>
    <%if (api.includes("R")) {%>{path: 'detail/:id', component: <%if (detailType === 'normal') {%><%-schm.SchemaName%>DetailComponent<%} else {%><%-schm.SchemaName%>DetailWidget<%-schm.DetailType%>Component<%}
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
