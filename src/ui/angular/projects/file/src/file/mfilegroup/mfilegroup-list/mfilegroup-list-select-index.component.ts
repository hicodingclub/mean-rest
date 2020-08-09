import {
  Component,
  OnInit
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
  MfilegroupListSelectComponent
} from './mfilegroup-list-select.component';
import {
  MfilegroupService
} from '../mfilegroup.service';
@Component({
  selector: 'app-mfilegroup-list-select-index',
  templateUrl: './mfilegroup-list-select-index.component.html',
  styleUrls: ['./mfilegroup-list.component.css', './mfilegroup-list-select-index.component.css']
})
export class MfilegroupListSelectIndexComponent extends MfilegroupListSelectComponent
implements OnInit {
  constructor(public mfilegroupService: MfilegroupService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(mfilegroupService, injector, router, route, location);
  }
  ngOnInit() {
    super.ngOnInit();
  }
}