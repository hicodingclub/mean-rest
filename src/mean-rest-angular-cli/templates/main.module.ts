import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
<% if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap'; 
import { MraNgbDateFormatterService } from './<%-moduleName%>.directive';
<%}%>
import { MinNumber, MaxNumber } from 'mean-rest-angular';

import { <%-ModuleName%>RoutingModule } from './<%-moduleName%>-routing.module';
import { <%-ModuleName%>Component } from './<%-moduleName%>.component';

//Import components for each schema
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
import { <%-schm.SchemaName%>Service } from './<%-schm.schemaName%>/<%-schm.schemaName%>.service';
<%_ } %>
<%_ validatorFields.forEach(function(validator){ %>     
import { <%-validator.Directive%> } from './<%-validator.schemaName%>/<%-validator.schemaName%>-edit/<%-validator.schemaName%>-edit.component';
<%_ }); %>
    
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
<% if (hasDate) {%>    
    NgbModule,<%}%>
    
    <%-ModuleName%>RoutingModule
  ],
  declarations: [
    MinNumber,
    MaxNumber,
        
    <%-ModuleName%>Component,
    
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>ListComponent, 
    <%-schm.SchemaName%>DetailComponent, 
    <%-schm.SchemaName%>EditComponent,
<%_ }%>
<%_ validatorFields.forEach(function(validator){ %>     
    <%-validator.Directive%>,<%_ }); %>
  ],
  exports: [
    <%-ModuleName%>Component,
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>ListComponent,
    <%-schm.SchemaName%>DetailComponent,
    <%-schm.SchemaName%>EditComponent,
<%_ }%>
  ],
  providers: [
<% if (hasDate) {%>    
    {provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService},<%}%>
<%_ for (let sch_name in schemaMap) { let schm = schemaMap[sch_name] %>
    <%-schm.SchemaName%>Service,<%}%>
  ]
})
export class <%-ModuleName%>Module { }