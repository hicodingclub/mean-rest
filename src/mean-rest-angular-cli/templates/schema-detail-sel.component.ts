import { Component, OnInit, Input, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { MraCommonService } from 'mean-rest-angular';

import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-detail-sel',
  templateUrl: './<%-schemaName%>-detail-sel.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailSelComponent extends <%-SchemaName%>DetailComponent 
        implements OnInit {
    @Input() inputData;
    @Output() outputData;
    done = new EventEmitter<boolean>();
    
    constructor(
        protected <%-schemaName%>Service: <%-SchemaName%>Service,
        protected commonService: MraCommonService,
        protected router: Router,
        protected route: ActivatedRoute,
       protected location: Location) {
            super(<%if (schemaHasRef) {%>null, <%}%><%-schemaName%>Service, commonService, router, route, location);
            this.majorUi = false;
    }

    ngOnInit() {
      if (!this.id) this.id = this.inputData;
      if (this.id) this.populateDetail(this.id);
      else console.error("Routing error for detail view... no id...");
    }
}