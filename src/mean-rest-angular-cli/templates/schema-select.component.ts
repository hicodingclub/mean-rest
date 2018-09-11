import { Component, OnInit, Input, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { MraCommonService } from 'mean-rest-angular';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-select',
  templateUrl: './<%-schemaName%>-select.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>SelectComponent extends <%-SchemaName%>ListComponent 
        implements OnInit {
    @Input() inputData;
    @Output() outputData;
    done = new EventEmitter<boolean>();
    
    constructor(
        protected <%-schemaName%>Service: <%-SchemaName%>Service,
        protected commonService: MraCommonService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected location: Location
        ) {
            super(<%if (schemaHasRef) {%>null,<%}%><%-schemaName%>Service, commonService, router, route, location);
            this.majorUi = false;
    }

    ngOnInit() {
        this.populateList();
    }
}
