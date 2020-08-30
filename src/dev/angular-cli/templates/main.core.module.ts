import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
<%for (let imp in mImports.imports) {
  let components = mImports.imports[imp];%>
import { <% for (let c of components) {%><%-c%>,<%}%> } from '<%-imp%>';
<%}%>
import { <%-ModuleName%>RoutingCoreModule } from './<%-moduleName%>-routing.core.module';
import { <%-ModuleName%>Component } from './<%-moduleName%>.component';<%
if (mFeatures.hasRef) {%>
import { <%-ModuleName%>RefSelectDirective } from './<%-moduleName%>.component';<%}%>

// Import components for each schema
<%_
for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api;%>
import { <%-schm.SchemaName%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>.component';<%_
  if (api.includes("L")) {%>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>ListViewComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list-view.component';
import { <%-schm.SchemaName%>ListCustComponent } from '../<%-moduleName%>-cust/base/<%-schm.schemaName%>/<%-schm.schemaName%>-list.cust.component';<%_ } %><%_
  if (api.includes('L')) { for (const [fileName, CompName] of schm.knownListWidgets) {%>
import { <%-schm.SchemaName%><%-CompName%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-<%-fileName%>.component';<%}
      for (const [fileName, CompName] of schm.knownListViewWidgets) {%>
import { <%-schm.SchemaName%><%-CompName%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-<%-fileName%>.component';<%}
  }%><%_
  if (api.includes("R")) {%>
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>DetailCustComponent } from '../<%-moduleName%>-cust/base/<%-schm.schemaName%>/<%-schm.schemaName%>-detail.cust.component';<%_ } %><%_
    if (api.includes('R')) { for (const widget of schm.detailWidgets) {%>
import { <%-schm.SchemaName%>DetailWidget<%-widget[1]%>Component } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-widget-<%-widget[0]%>.component';<%} }%><%_
  if (api.includes("R") || api.includes('L')) {%>
import { <%-schm.SchemaName%>DetailFieldComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-field.component';<%_ } %><%_
  if (api.includes("U") || api.includes("C")) {%>
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
import { <%-schm.SchemaName%>EditCustComponent } from '../<%-moduleName%>-cust/base/<%-schm.schemaName%>/<%-schm.schemaName%>-edit.cust.component';<%_ } %><%_
  if (api.includes("R") && schm.assoRoutes.length > 0 ) {%>
import { <%-schm.SchemaName%>AssoComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail-asso.component';<%}%><%_
} %><%_
referenceSchemas.forEach(function(schObj){ let ref = schObj.ref, Ref = schObj.Ref, api = schObj.api;%><%_
  if (api.includes("R")) {%>
import { <%-Ref%>DetailPopComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-pop.component';<%_ } %><%_
  if (api.includes("R")) {%>
import { <%-Ref%>DetailSelComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-sel.component';<%_ } %><%_ }); %><%_
for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let sn = schm.schemaName, api = schm.api; 
  if (schm.api.includes('L') && schm.listViewObj.includeSubDetail) {%>
import { <%-schm.SchemaName%>DetailSubComponent } from './<%-sn%>/<%-sn%>-detail/<%-sn%>-detail-sub.component';<%_ } %><%_
}%><%_
validatorFields.forEach(function(element){ %>
import { <%-element.Directive%> } from './<%-element.schemaName%>/<%-element.schemaName%>-edit/<%-element.schemaName%>-edit.component';<%_ }); %>

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
  <%for (let mod of mImports.modules) {%>
    <%-mod%>,
  <%}%>
    <%-ModuleName%>RoutingCoreModule,
  ],
  declarations: [
    <%-ModuleName%>Component,<%
    if (mFeatures.hasRef) {%>
    <%-ModuleName%>RefSelectDirective,<%}%><%_
  for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %>
    <%-schm.SchemaName%>Component,<%
    if (api.includes("L")) {%>
    <%-schm.SchemaName%>ListComponent,
    <%-schm.SchemaName%>ListViewComponent,
    <%-schm.SchemaName%>ListCustComponent,<%}%><%_
    if (api.includes('L')) { for (const [fileName, CompName] of schm.knownListWidgets) {%>
    <%-schm.SchemaName%><%-CompName%>Component,<%}
      for (const [fileName, CompName] of schm.knownListViewWidgets) {%>
    <%-schm.SchemaName%><%-CompName%>Component,<%}
    }%><%
    if (api.includes("R")) {%>
    <%-schm.SchemaName%>DetailCustComponent,
    <%-schm.SchemaName%>DetailComponent,<%}%><%_
    if (api.includes('R')) { for (const widget of schm.detailWidgets) {%>
    <%-schm.SchemaName%>DetailWidget<%-widget[1]%>Component,<%} }%><%
    if (api.includes("R") || api.includes('L')) {%>
    <%-schm.SchemaName%>DetailFieldComponent,<%_ } %><%
    if (api.includes("U") || api.includes("C")) {%>
    <%-schm.SchemaName%>EditComponent,
    <%-schm.SchemaName%>EditCustComponent,<%}%><%_
    if (api.includes("R") && schm.assoRoutes.length > 0 ) {%>
    <%-schm.SchemaName%>AssoComponent,<%}%><%}%><%_
  referenceSchemas.forEach(function(reference){ let Ref = reference.Ref, api = reference.api; %><%
    if (api.includes("R")) {%>
    <%-Ref%>DetailPopComponent,<%}%><%
    if (api.includes("R")) {%>
    <%-Ref%>DetailSelComponent,<%}%><%_ }); %><%_
  for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; 
    if (schm.api.includes('L') && schm.listViewObj.includeSubDetail) {%>
    <%-schm.SchemaName%>DetailSubComponent,<%}%><%_ }%><%_
  validatorFields.forEach(function(element){ %>
    <%-element.Directive%>,<%_ }); %>
  ],
  exports: [
    <%-ModuleName%>Component,<%_
  for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; %><%_
    if (api.includes('L')) { for (const [fileName, CompName] of schm.knownListWidgets) {%>
    <%-schm.SchemaName%><%-CompName%>Component,<%} }%><%
    if (api.includes("R")) {%>
    <%-schm.SchemaName%>DetailComponent,<%}%><%_
    if (api.includes('R')) { for (const widget of schm.detailWidgets) {%>
    <%-schm.SchemaName%>DetailWidget<%-widget[1]%>Component,<%} }%><%
    if (api.includes("R") || api.includes('L')) {%>
    <%-schm.SchemaName%>DetailFieldComponent,<%_ } %><%
    if (api.includes("U") || api.includes("C")) {%>
    <%-schm.SchemaName%>EditComponent,<%}%><%_
    if (api.includes("R") && schm.assoRoutes.length > 0 ) {%>
    <%-schm.SchemaName%>AssoComponent,<%}%><%_ }%><%_
  referenceSchemas.forEach(function(reference){ let Ref = reference.Ref, api = reference.api; %><%
    if (api.includes("R")) {%>
    <%-Ref%>DetailPopComponent,<%}%><%
    if (api.includes("R")) {%>
    <%-Ref%>DetailSelComponent,<%}%><%_ }); %><%_
  for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api; 
    if (schm.api.includes('L') && schm.listViewObj.includeSubDetail) {%>
    <%-schm.SchemaName%>DetailSubComponent,<%}%><%_ }%><%_
    validatorFields.forEach(function(element){ %>
    <%-element.Directive%>,<%_ }); %>
  ],
  providers: [<%- 
    include(`/ui/${uiFramework}/${uiDesign}/main.core.module.include.ts`, {part: 'module_provider'});
    %>
  ],
  entryComponents: [<%_
  if (mFeatures.hasRef) {
    referenceSchemas.forEach(function(reference){ let Ref = reference.Ref; let api = reference.api; 
    %><% 
    if (api.includes("L")) {%>
    <%-Ref%>ListSelectComponent,<%}%><%
    if (api.includes("R")) {%>
    <%-Ref%>DetailPopComponent,<%}%><% 
    if (api.includes("R")) {%>
    <%-Ref%>DetailSelComponent,<%}%><%_ }); %><%_}%><%
  for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let api = schm.api;%><%
    if (api.includes("R")) { for (const widget of schm.detailWidgets) {%>
    <%-schm.SchemaName%>DetailWidget<%-widget[1]%>Component,<%} }%><%
    if (api.includes("C") ) {%>
    <%-schm.SchemaName%>EditComponent,<%}%><%}%>
  ]
})
export class <%-ModuleName%>CoreModule { }
