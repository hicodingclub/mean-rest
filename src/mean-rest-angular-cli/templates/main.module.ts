import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
<% if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MraNgbDateFormatterService } from './<%-moduleName%>.directive';
<%}%>
import { MraModule } from 'mean-rest-angular';

import { <%-ModuleName%>RoutingModule } from './<%-moduleName%>-routing.module';
import { <%-ModuleName%>Component } from './<%-moduleName%>.component';
<% if (hasRef) {%>import { <%-ModuleName%>RefSelectDirective } from './<%-moduleName%>.component';<%}%>

import { <%-ModuleName%>_SERVER_ROOT_URI } from './<%-moduleName%>.tokens';
import { <%-moduleName%>_server_root_uri } from '../<%-moduleName%>.conf';

// Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
import { <%-schm.SchemaName%>Service } from './<%-schm.schemaName%>/<%-schm.schemaName%>.service';
<%_ } %>
<%_ referenceFields.forEach(function(reference){ let ref = reference.ref, Ref = reference.Ref; %>
import { <%-Ref%>SelectComponent } from './<%-ref%>/<%-ref%>-list/<%-ref%>-select.component';
import { <%-Ref%>DetailPopComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-pop.component';
import { <%-Ref%>DetailSelComponent } from './<%-ref%>/<%-ref%>-detail/<%-ref%>-detail-sel.component';<%_ }); %>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; let sn = schm.schemaName; if (schm.schemaHasRef) {%>
import { <%-schm.SchemaName%>ListSubComponent } from './<%-sn%>/<%-sn%>-list/<%-sn%>-list-sub.component';
import { <%-schm.SchemaName%>DetailSubComponent } from './<%-sn%>/<%-sn%>-detail/<%-sn%>-detail-sub.component';<%_ }}%>
<%_ validatorFields.forEach(function(validator){ %>
import { <%-validator.Directive%> } from './<%-validator.schemaName%>/<%-validator.schemaName%>-edit/<%-validator.schemaName%>-edit.component';<%_ }); %>

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    <%_ if (hasDate) {%>
    NgbModule,<%}%>
    MraModule,

    <%-ModuleName%>RoutingModule
  ],
  declarations: [
    <%-ModuleName%>Component,
    <% if (hasRef) {%><%-ModuleName%>RefSelectDirective,<%}%>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>ListComponent,
    <%-schm.SchemaName%>DetailComponent,
    <%-schm.SchemaName%>EditComponent,<%}%>
  <%_ referenceFields.forEach(function(reference){ let Ref = reference.Ref; %>
    <%-Ref%>SelectComponent,
    <%-Ref%>DetailPopComponent,
    <%-Ref%>DetailSelComponent,<%_ }); %>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; if (schm.schemaHasRef) { %>
    <%-schm.SchemaName%>ListSubComponent,
    <%-schm.SchemaName%>DetailSubComponent,<%_ }}%>
  <%_ validatorFields.forEach(function(validator){ %>
    <%-validator.Directive%>,<%_ }); %>
  ],
  exports: [
    <%-ModuleName%>Component,
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>ListComponent,
    <%-schm.SchemaName%>DetailComponent,
    <%-schm.SchemaName%>EditComponent,<%_ }%>
  <%_ referenceFields.forEach(function(reference){ let Ref = reference.Ref; %>
    <%-Ref%>SelectComponent,
    <%-Ref%>DetailPopComponent,
    <%-Ref%>DetailSelComponent,<%_ }); %>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name]; if (schm.schemaHasRef) { %>
    <%-schm.SchemaName%>ListSubComponent,
    <%-schm.SchemaName%>DetailSubComponent,<%_ }}%>
  ],
  providers: [
    { provide: <%-ModuleName%>_SERVER_ROOT_URI, useValue: <%-moduleName%>_server_root_uri },
  <%_ if (hasDate) {%>
    {provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService},<%}%>
  <%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>Service,<%}%>
  ],
<%_ if (hasRef) {%>
  entryComponents: [
    <%_ referenceFields.forEach(function(reference){ let Ref = reference.Ref; %>
    <%-Ref%>SelectComponent,
    <%-Ref%>DetailPopComponent,
    <%-Ref%>DetailSelComponent,<%_ }); %>
  ]<%}%>
})
export class <%-ModuleName%>Module { }
