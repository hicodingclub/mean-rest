import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-widget-galleryBottomTitle',
  templateUrl: './<%-schemaName%>-list-widget-galleryBottomTitle.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-widget-galleryBottomTitle.component.css'],
})
export class <%-SchemaName%>ListWidgetGalleryBottomTitleComponent extends <%-SchemaName%>ListComponent implements OnInit {
  @Input() public fieldsMap: any = {}; // { title: 'title', subTitle: 'subTitle', picturelink: 'link'};
  @Input() public options: any = {}; // { canSelect: true, largePicture: true, showTitle: true}; // {canSelect: true, largePicture: true, showTitle: true};

  public title: string;
  public subTitle: string;
  public pictureLink: string;

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
    <%_
    let field0 = detailView[0]; let fn0 = field0.fieldName; let ft0 = field0.type;
    let field1 = detailView[1]; let fn1 = field1.fieldName; let ft1 = field1.type;
    let field2 = detailView[2]; let fn2 = field2.fieldName; let ft2 = field2.type;%>
    if (this.fieldsMap) {
      this.pictureLink = this.fieldsMap.pictureLink;
      this.title = this.fieldsMap.title;
      this.subTitle = this.fieldsMap.subTitle;
    }

    if (!this.pictureLink) {
      this.pictureLink = '<%-fn0%>';
    }
    if (!this.title) {
      this.title = '<%-fn1%>';
    }
    if (!this.subTitle) {
      this.subTitle = '<%-fn2%>';
    }

    if (!this.options) {
      this.options = {};
    }
    if (typeof this.options.canSelect === 'undefined') {
      this.options.canSelect = true;
    }
    if (typeof this.options.largePicture === 'undefined') {
      this.options.largePicture = false;
    }
    if (typeof this.options.showTitle === 'undefined') {
      this.options.showTitle = true;
    }

    super.ngOnInit();
  }
}