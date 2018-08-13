import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';
import { BaseComponent, ViewType } from 'mean-rest-angular';

import { <%-SchemaName%>Service } from './<%-schemaName%>.service';

var itemName = "<%-schemaName%>";

export { ViewType };

export class <%-SchemaName%>Component extends BaseComponent {
    constructor(
      protected <%-schemaName%>Service: <%-SchemaName%>Service,
      protected router: Router,
      protected route: ActivatedRoute,
      protected view: ViewType ) {
        super(<%-schemaName%>Service, router, route, view, itemName);
    }
}
