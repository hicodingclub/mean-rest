import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-widget-gallery',
  templateUrl: './<%-schemaName%>-list-widget-gallery.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-widget-gallery.component.css'],
})
export class <%-SchemaName%>ListWidgetGalleryComponent extends <%-SchemaName%>ListComponent implements OnInit {
  public titleFn: string;
  public picturelinkFn: string;
  @Input() options: any = {}; // {canSelect: true, largePicture: true, showTitle: true};

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%if (schemaHasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);
        this.majorUi = false;
  }

  ngOnInit() {
    // this.inputData == this.inputData|| [] // expect field name in array: ['subtitle', 'description', 'picture']
    if ( !Array.isArray(this.inputData) || this.inputData.length < 2) {
      console.error("inputData of array is expected for gallery view: titleFn, picturelinkFn");
      return;
    }

    this.titleFn = this.inputData[0];
    this.picturelinkFn = this.inputData[1];
    super.ngOnInit();
  }
}
