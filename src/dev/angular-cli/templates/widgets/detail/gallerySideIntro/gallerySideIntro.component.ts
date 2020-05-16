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
  @Input() public options: any = {
    largePicture: true,
  }; // { disableSelect: true, largePicture: true, notShowTitle: true}; // {disableSelect: true, largePicture: true, notShowTitle: true};
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
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
