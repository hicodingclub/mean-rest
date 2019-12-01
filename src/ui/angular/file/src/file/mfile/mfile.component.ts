import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent, ViewType } from '@hicoder/angular-core';
import { Injector } from '@angular/core';
import { MfileService } from './mfile.service';

const itemCamelName = 'picture';

export { ViewType };

import { ComponentFactoryResolver } from '@angular/core';

export class MfileComponent extends BaseComponent {

    constructor(
      public componentFactoryResolver: ComponentFactoryResolver,
      public mfileService: MfileService,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location,
      public view: ViewType ) {

        super(mfileService, injector, router, route, location, view, itemCamelName);

        
        this.briefFieldsInfo = [];
        this.briefFieldsInfo.push(['name', 'Name']);this.briefFieldsInfo.push(['type', 'Type']);this.briefFieldsInfo.push(['group', 'Group']);this.briefFieldsInfo.push(['labels', 'Labels']);this.briefFieldsInfo.push(['size', 'Size']);this.briefFieldsInfo.push(['link', 'Link']);this.briefFieldsInfo.push(['createdAt', 'Created at']);this.briefFieldsInfo.push(['hasThumbnail', 'Has Thumbnail']);



        this.referenceFieldsMap = {'group': 'mfilegroup',};
        this.referenceFieldsReverseMap = {'mfilegroup': 'group',};


        this.schemaName = 'mfile';
        this.dateFormat = 'MM/DD/YYYY';
        this.timeFormat = 'hh:mm:ss';
        this.modulePath = 'files';
        this.indexFields = ['name', ];
    }
}
