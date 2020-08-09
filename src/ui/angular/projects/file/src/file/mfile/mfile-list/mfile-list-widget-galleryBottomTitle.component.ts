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
  selector: 'app-mfile-list-widget-galleryBottomTitle',
  templateUrl: './mfile-list-widget-galleryBottomTitle.component.html',
  styleUrls: ['./mfile-list.component.css', './mfile-list-widget-galleryBottomTitle.component.css'],
})
export class MfileListWidgetGalleryBottomTitleComponent extends MfileListComponent implements OnInit {
  // @Input() public options: any = {}; // { clickItemAction, largePicture, notShowTitle, notShowSubTitle}
  // @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, subtitle: {} }
  public title: string;
  public subTitle: string;
  public pictureLink: string;
  constructor(public mfileService: MfileService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(null, mfileService, injector, router, route, location);
    this.majorUi = false;
  }
  ngOnInit() {
    super.ngOnInit();
  }
}