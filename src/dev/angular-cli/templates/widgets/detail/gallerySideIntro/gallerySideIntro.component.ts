import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>


@Component({
  selector: 'app-<%-schemaName%>-detail-widget-gallerySideIntro',
  templateUrl: './<%-schemaName%>-detail-widget-gallerySideIntro.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css', './<%-schemaName%>-detail-widget-gallerySideIntro.component.css']
})
export class <%-SchemaName%>DetailWidgetGallerySideIntroComponent extends <%-SchemaName%>DetailComponent implements OnInit, AfterViewInit {
  @Input() public options: any = {}; // { canSelect: true, largePicture: true, showTitle: true}; // {canSelect: true, largePicture: true, showTitle: true};
  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  constructor(
      <%if (schemaHasRef) {%>public componentFactoryResolver: ComponentFactoryResolver,<%}%>
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, injector, router, route, location);
  }

  ngOnInit() {
    if (!this.options) {
      this.options = {};
    }
    if (typeof this.options.canSelect === 'undefined') {
      this.options.canSelect = false;
    }
    if (typeof this.options.largePicture === 'undefined') {
      this.options.largePicture = true;
    }
    if (typeof this.options.showTitle === 'undefined') {
      this.options.showTitle = true;
    }

    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
