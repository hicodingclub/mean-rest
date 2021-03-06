import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';

@Component({
  selector: 'app-<%-schemaName%>-detail-widget-galleryBottomTitle',
  templateUrl: './<%-schemaName%>-detail-widget-galleryBottomTitle.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css', './<%-schemaName%>-detail-widget-galleryBottomTitle.component.css']
})
export class <%-SchemaName%>DetailWidgetGalleryBottomTitleComponent extends <%-SchemaName%>DetailComponent implements OnInit, AfterViewInit {
  // @Input() public options: any = {}; // {largePicture: true, notShowTitle: true};
  // @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%-schemaName%>Service, injector, router, route, location);
  }

  ngOnInit() {
    if (!this.options) {
      this.options = {
        largePicture: true,
      };
    }
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
