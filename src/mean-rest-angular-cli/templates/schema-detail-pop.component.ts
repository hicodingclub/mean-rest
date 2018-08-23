import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';
import { <%-SchemaName%>Service } from '../person.service';

@Component({
  selector: 'app-<%-schemaName%>-detail-pop',
  templateUrl: './<%-schemaName%>-detail-pop.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailPopComponent extends <%-SchemaName%>DetailComponent 
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
      if (!this.id) this.id = this.inputData;
      if (this.id) this.populateDetail(this.id);
      else console.error("Routing error for detail view... no id...");
    }
}