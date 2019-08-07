import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
<% if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MraNgbDateFormatterService } from './<%-moduleName%>.directive'; <%_ }%>
<%_ if (hasRequiredMultiSelection) {%>
import { DirectiveMultiSelectionRequired } from './<%-moduleName%>.directive';<%_ } %>
<%_ if (hasRequiredArray) {%>
import { DirectiveArrayRequired } from './<%-moduleName%>.directive';<%_ } %>
<%_ if (hasRequiredMap) {%>
import { DirectiveMapRequired } from './<%-moduleName%>.directive';<%_ } %>
<%if (hasFileUpload) {%>
import { FileUploadModule } from 'mdds-angular-file';<%}%>

import { MraModule } from 'mean-rest-angular';

import { <%-ModuleName%>RoutingModule } from './<%-moduleName%>-routing.module';
import { <%-ModuleName%>Component } from './<%-moduleName%>.component';
<% if (hasRef) {%>import { <%-ModuleName%>RefSelectDirective } from './<%-moduleName%>.component';<%}%>

import { <%-ModuleName%>_SERVER_ROOT_URI } from './<%-moduleName%>.tokens';
import { <%-moduleName%>_server_root_uri } from '../<%-moduleName%>.conf';

// Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api;%>
  <%_ if (api.includes("L")) {%>import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';<%_ } %>
  <%_ if (api.includes("L") && schm.actionViews.includes('H')) {%>import { <%-schm.SchemaName%>ListHomeComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-home.component';<%_ } %>
  <%_ if (api.includes("L") && schm.actionViews.includes('S')) {%>import { <%-schm.SchemaName%>ListActSelComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-act-sel.component';<%_ } %>
  <%_ if (api.includes("L") && schm.actionViews.includes('D')) {%>import { <%-schm.SchemaName%>ListActSldComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-act-sld.component';<%_ } %>
  <%_ if (api.includes("R")) {%>import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';<%_ } %>
  <%_ if (api.includes("R") || api.includes('L')) {%>import { <%-schm.SchemaName%>DetailFieldComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-field.component';<%_ } %>
  <%_ if (api.includes("U") || api.includes("C")) {%>import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';<%_ } %>
  <%_if (api.includes("R") && schm.assoRoutes.length > 0 ) {%>import { <%-schm.SchemaName%>AssoComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-asso.component';<%}%>
import { <%-schm.SchemaName%>Service } from './<%-schm.schemaName%>/<%-schm.schemaName%>.service';
<%_ } %>
<%_ referenceSchemas.forEach(function(schObj){ let ref = schObj.ref, Ref = schObj.Ref, api = schObj.api; %>
  <%_ if (api.includes("L")) {%>import { <%-Ref%>SelectComponent } from './<%-ref%>/<%-ref%>-list/<%-ref%>-select.component';<%_ } %>
  <%_ if (api.includes("R")) {%>import { <%-Ref%>DetailPopComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-pop.component';<%_ } %>
  <%_ if (api.includes("R")) {%>import { <%-Ref%>DetailSelComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-sel.component';<%_ } %><%_ }); %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let sn = schm.schemaName, api = schm.api; if (schm.schemaHasRef) {%>
  <%_ if (api.includes("L")) {%>import { <%-schm.SchemaName%>ListSubComponent } from './<%-sn%>/<%-sn%>-list/<%-sn%>-list-sub.component';<%if (schm.associationFor.length > 0) {%>
import { <%-schm.SchemaName%>ListAssoComponent } from './<%-sn%>/<%-sn%>-list/<%-sn%>-list-asso.component';<%}%><%_ } %>
  <%_ if (api.includes("R")) {%>import { <%-schm.SchemaName%>DetailSubComponent } from './<%-sn%>/<%-sn%>-detail/<%-sn%>-detail-sub.component';<%_ } %><%_ }}%>
<%_ validatorFields.forEach(function(element){ %>
import { <%-element.Directive%> } from './<%-element.schemaName%>/<%-element.schemaName%>-edit/<%-element.schemaName%>-edit.component';<%_ }); %>

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,<%_ if (hasDate) {%>
    NgbModule,<%}%>
    MraModule,<%if (hasFileUpload) {%>
    FileUploadModule,<%}%>

    <%-ModuleName%>RoutingModule
  ],
  declarations: [
    <%-ModuleName%>Component,
    <% if (hasRef) {%><%-ModuleName%>RefSelectDirective,<%}%>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %>
    <% if (api.includes("L")) {%><%-schm.SchemaName%>ListComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('H')) {%><%-schm.SchemaName%>ListHomeComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('S')) {%><%-schm.SchemaName%>ListActSelComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('D')) {%><%-schm.SchemaName%>ListActSldComponent,<%}%>
    <% if (api.includes("R")) {%><%-schm.SchemaName%>DetailComponent,<%}%>
    <%_ if (api.includes("R") || api.includes('L')) {%><%-schm.SchemaName%>DetailFieldComponent,<%_ } %>
    <% if (api.includes("U") || api.includes("C")) {%><%-schm.SchemaName%>EditComponent,<%}%>
    <%_if (api.includes("R") && schm.assoRoutes.length > 0 ) {%><%-schm.SchemaName%>AssoComponent,<%}%><%}%>
  <%_ referenceSchemas.forEach(function(reference){ let Ref = reference.Ref, api = reference.api; %>
    <% if (api.includes("L")) {%><%-Ref%>SelectComponent,<%}%>
    <% if (api.includes("R")) {%><%-Ref%>DetailPopComponent,<%}%>
    <% if (api.includes("R")) {%><%-Ref%>DetailSelComponent,<%}%><%_ }); %>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; if (schm.schemaHasRef) { %>
    <% if (api.includes("L")) {%><%-schm.SchemaName%>ListSubComponent,<%if (schm.associationFor.length > 0) {%>
    <%-schm.SchemaName%>ListAssoComponent,<%}%><%}%>
    <% if (api.includes("R")) {%><%-schm.SchemaName%>DetailSubComponent,<%}%><%_ }}%>
  <%_ validatorFields.forEach(function(element){ %>
    <%-element.Directive%>,<%_ }); %>
  <%_ if (hasRequiredMultiSelection) {%>
    DirectiveMultiSelectionRequired,<%_ } %>
  <%_ if (hasRequiredArray) {%>
    DirectiveArrayRequired,<%_ } %>
  <%_ if (hasRequiredMap) {%>
    DirectiveMapRequired,<%_ } %>
  ],
  exports: [
    <%-ModuleName%>Component,
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %>
    <% if (api.includes("L")) {%><%-schm.SchemaName%>ListComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('H')) {%><%-schm.SchemaName%>ListHomeComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('S')) {%><%-schm.SchemaName%>ListActSelComponent,<%}%>
    <% if (api.includes("L") && schm.actionViews.includes('D')) {%><%-schm.SchemaName%>ListActSldComponent,<%}%>
    <% if (api.includes("R")) {%><%-schm.SchemaName%>DetailComponent,<%}%>
    <%_ if (api.includes("R") || api.includes('L')) {%><%-schm.SchemaName%>DetailFieldComponent,<%_ } %>
    <% if (api.includes("U") || api.includes("C")) {%><%-schm.SchemaName%>EditComponent,<%}%>
    <%_if (api.includes("R") && schm.assoRoutes.length > 0 ) {%><%-schm.SchemaName%>AssoComponent,<%}%><%_ }%>
  <%_ referenceSchemas.forEach(function(reference){ let Ref = reference.Ref, api = reference.api; %>
    <% if (api.includes("L")) {%><%-Ref%>SelectComponent,<%}%>
    <% if (api.includes("R")) {%><%-Ref%>DetailPopComponent,<%}%>
    <% if (api.includes("R")) {%><%-Ref%>DetailSelComponent,<%}%><%_ }); %>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; if (schm.schemaHasRef) { %>
    <% if (api.includes("L")) {%><%-schm.SchemaName%>ListSubComponent,<%if (schm.associationFor.length > 0) {%>
    <%-schm.SchemaName%>ListAssoComponent,<%}%><%}%>
    <% if (api.includes("R")) {%><%-schm.SchemaName%>DetailSubComponent,<%}%><%_ }}%>
  ],
  providers: [
    { provide: <%-ModuleName%>_SERVER_ROOT_URI, useValue: <%-moduleName%>_server_root_uri },
  <%_ if (hasDate) {%>
    {provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService},<%}%>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>Service,<%}%>
  ],
  entryComponents: [<%_
  if (hasRef) {%><%_ referenceSchemas.forEach(function(reference){ let Ref = reference.Ref; let api = reference.api; %><% 
    if (api.includes("L")) {%><%-Ref%>SelectComponent,<%}%><% 
    if (api.includes("R")) {%><%-Ref%>DetailPopComponent,<%}%><% 
    if (api.includes("R")) {%><%-Ref%>DetailSelComponent,<%}%><%_ }); %><%_}
  %><%for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api;%><% 
    if (api.includes("L") && schm.actionViews.includes('S')) {%><%-schm.SchemaName%>ListActSelComponent,<%}%><%
    if (api.includes("R") && schm.detailType === 'term') {%><%-schm.SchemaName%>DetailComponent,<%}%><%
    if (api.includes("C") ) {%><%-schm.SchemaName%>EditComponent,<%}%><%}%>
  ]
})
export class <%-ModuleName%>Module { }
