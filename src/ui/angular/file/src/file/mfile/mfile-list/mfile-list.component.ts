import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';

import { MfileComponent, ViewType } from '../mfile.component';
import { MfileService } from '../mfile.service';


import { ComponentFactoryResolver } from '@angular/core';

  
@Component({
  selector: 'app-mfile-list',
  templateUrl: './mfile-list.component.html',
  styleUrls: ['./mfile-list.component.css']
})
export class MfileListComponent extends MfileComponent implements OnInit {

  public minDate = {year: (new Date()).getFullYear() - 100, month: 1, day: 1};

  @Input()
  public inputData:any;
  @Input()
  public searchObj:any;
  @Input()
  public categoryBy:string; //field name whose value is used as category
  @Output()
  public done = new EventEmitter<boolean>();


  constructor(
      public componentFactoryResolver: ComponentFactoryResolver,
      public mfileService: MfileService,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(componentFactoryResolver,
                mfileService, injector, router, route, location, ViewType.LIST);

          this.stringFields.push('name');
          this.stringFields.push('type');
          this.stringFields.push('link');
          this.referenceFields = ['group', ];
          this.dateFields = ['createdAt', ];
          this.arrayFields = [['labels', 'SchemaString'],];
          this.listViewFilter = 'list';

          const listCategories = [{"listCategoryField":"group","showCategoryCounts":true,"showEmptyCategory":true,"listCategoryRef":"mfilegroup"}];
          this.listCategory1 = listCategories[0] || {};
          this.listCategory2 = listCategories[1] || {};
  }

  ngOnInit() {
      this.adjustListViewForWindowSize();

      // this is to initialize the detail that will be used for search condition selection
      const detail = this.searchObj || {};
      this.detail = this.formatDetail(detail);
      this.populateList();
  }

  static getInstance() {
    //used by others to call some common functions
    return new MfileListComponent(null, null, null, null, null, null);
  }
}

