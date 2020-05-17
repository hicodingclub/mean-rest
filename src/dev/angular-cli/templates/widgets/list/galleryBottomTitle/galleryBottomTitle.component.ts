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
  // @Input() public options: any = {}; // { disableSelect, clickToDetail, largePicture, notShowTitle, notShowSubTitle}
  // @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, subtitle: {} }

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
    super.ngOnInit();
  }

  clickOneItem(i: number, id: string) {
    // this.selectItemCandidate(i);
    if (this.options.clickToDetail) {
      this.onDetailLinkClicked(id);
    }
  }
}
