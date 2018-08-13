import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list',
  templateUrl: './<%-schemaName%>-list.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListComponent extends <%-SchemaName%>Component implements OnInit {
  protected list:any[];
        
  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
              super(<%-schemaName%>Service, router, route, ViewType.LIST);
      }

    ngOnInit() {
      this.route.url.subscribe(url =>{this.populateList();});
    }
}
