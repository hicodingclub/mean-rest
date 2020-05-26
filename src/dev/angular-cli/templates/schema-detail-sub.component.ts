import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-detail-sub',
  templateUrl: './<%-schemaName%>-detail-sub.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailSubComponent extends <%-SchemaName%>DetailComponent 
        implements OnInit {
    // @Input() inputData;
    
    constructor(
        public <%-schemaName%>Service: <%-SchemaName%>Service,
        public injector: Injector,
        public router: Router,
        public route: ActivatedRoute,
        public location: Location) {
            super(<%if (schemaHasRef) {%>null,<%}%><%-schemaName%>Service, injector, router, route, location);
    }

    ngOnInit() {
      if (!this.id) this.id = this.inputData;
      if (this.id) this.populateDetail(this.id);
      else console.error("Routing error for detail sub view... no id...");
    }

    ngAfterViewInit() {
    }
}
