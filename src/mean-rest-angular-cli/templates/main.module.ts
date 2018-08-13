import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { <%-ModuleName%>RoutingModule } from './<%-moduleName%>-routing.module';
import { <%-ModuleName%>Component } from './<%-moduleName%>.component';

//Import components for each schema
<%_ schemaArray.forEach(function(schm){ %>
import { <%-schm.SchemaName%>ListComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-list/<%-schm.schemaName%>-list.component';
import { <%-schm.SchemaName%>DetailComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-detail/<%-schm.schemaName%>-detail.component';
import { <%-schm.SchemaName%>EditComponent } from './<%-schm.schemaName%>/<%-schm.schemaName%>-edit/<%-schm.schemaName%>-edit.component';
import { <%-schm.SchemaName%>Service } from './<%-schm.schemaName%>/<%-schm.schemaName%>.service';
<%_ }); %>

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    
    <%-ModuleName%>RoutingModule
  ],
  declarations: [
    <%-ModuleName%>Component,
      
 <%_ schemaArray.forEach(function(schm){ %>     
    <%-schm.SchemaName%>ListComponent, 
    <%-schm.SchemaName%>DetailComponent, 
    <%-schm.SchemaName%>EditComponent,
<%_ }); %>
  ],
  exports: [
    <%-ModuleName%>Component,
 <%_ schemaArray.forEach(function(schm){ %>     
    <%-schm.SchemaName%>ListComponent,
    <%-schm.SchemaName%>DetailComponent,
    <%-schm.SchemaName%>EditComponent,
<%_ }); %>
  ],
  providers: [
<%_ schemaArray.forEach(function(schm){ %>
   <%-schm.SchemaName%>Service,<%_ }); %>
  ]
})
export class <%-ModuleName%>Module { }
