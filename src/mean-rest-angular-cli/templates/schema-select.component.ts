import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../person.service';

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
        protected router: Router,
        protected route: ActivatedRoute,
        protected <%-schemaName%>Service: <%-SchemaName%>Service) {
            super(router, route, <%-schemaName%>Service);
            this.majorUi = false;
    }

    ngOnInit() {
        this.populateList();
    }
    
}