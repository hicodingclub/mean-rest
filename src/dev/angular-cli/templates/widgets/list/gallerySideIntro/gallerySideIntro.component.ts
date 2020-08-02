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
  // @Input() public options: any = {}; // { clickItemAction, largePicture, notShowTitle, notShowSubTitle}
  // @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  public title: string;
  public intro: string;
  public pictureLink: string;

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%if (sFeatures.hasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);
        this.majorUi = false;
  }

  ngOnInit() {
    super.ngOnInit();
  }
}
