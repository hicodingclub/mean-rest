import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListSelectComponent } from './<%-schemaName%>-list-select.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-select-index',
  templateUrl: './<%-schemaName%>-list-select-index.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-select-index.component.css']
})
export class <%-SchemaName%>ListSelectIndexComponent extends <%-SchemaName%>ListSelectComponent
        implements OnInit {

    constructor(
        public <%-schemaName%>Service: <%-SchemaName%>Service,
        public injector: Injector,
        public router: Router,
        public route: ActivatedRoute,
        public location: Location
        ) {
            super(<%-schemaName%>Service, injector, router, route, location);
    }

    ngOnInit() {
        super.ngOnInit();
    }
}
