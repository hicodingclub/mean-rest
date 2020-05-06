import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-widget-gallerySideIntro',
  templateUrl: './<%-schemaName%>-list-widget-gallerySideIntro.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-widget-gallerySideIntro.component.css'],
})
export class <%-SchemaName%>ListWidgetGallerySideIntroComponent extends <%-SchemaName%>ListComponent implements OnInit {
  // @Input() public fieldsMap: any = {}; // { title: 'title', intro: 'intro', picturelink: 'link' }
  @Input() public options: any = {}; // { canSelect: true, clickToDetail: false, largePicture: true, showTitle: true }
  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  public title: string;
  public intro: string;
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
    /*
    if (this.fieldsMap) {
      this.pictureLink = this.fieldsMap.pictureLink;
      this.title = this.fieldsMap.title;
      this.intro = this.fieldsMap.intro;
    }

    if (!this.pictureLink) {
      this.pictureLink = '<%-fn0%>';
    }
    if (!this.title) {
      this.title = '<%-fn1%>';
    }
    if (!this.intro) {
      this.intro = '<%-fn2%>';
    }
    */
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
    if (typeof this.options.clickToDetail === 'undefined') {
      this.options.clickToDetail = false;
    }
    if (this.options.disableCatetory) {
      this.listCategory1 = {}; // no do query based on category for home view;
      this.listCategory2 = {}; // no do query based on category for home view;
    }

    super.ngOnInit();
  }

  clickOneItem(i: number, id: string) {
    this.selectItemCandidate(i);
    if (this.options.clickToDetail) {
      this.onDetailLinkClicked(id);
    }
  }
}
