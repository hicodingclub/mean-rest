import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  Location
} from '@angular/common';
import {
  Router,
  ActivatedRoute
} from '@angular/router';
import {
  Injector
} from '@angular/core';
import {
  MfileListComponent
} from './mfile-list.component';
import {
  MfileService
} from '../mfile.service';
@Component({
  selector: 'app-mfile-list-general',
  templateUrl: './mfile-list-general.component.html',
  styleUrls: ['./mfile-list.component.css', './mfile-list-general.component.css']
})
export class MfileListGeneralComponent extends MfileListComponent implements OnInit {
  public clickItemAction: string = '';
  public cardHasLink: boolean = false;
  public cardHasSelect: boolean = false;
  public includeSubDetail: boolean = false;
  public canUpdate: boolean = false;
  public canDelete: boolean = false;
  public canArchive: boolean = false;
  public canCheck: boolean = false;
  public itemMultiSelect: boolean = true;
  public majorUi: boolean = true;
  constructor(public mfileService: MfileService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(mfileService, injector, router, route, location);
    this.listViews = ['gallery-bottom-title', ];
    this.listViewFilter = 'gallery-bottom-title';
  }
  ngOnInit() {
    super.ngOnInit();
  }
}