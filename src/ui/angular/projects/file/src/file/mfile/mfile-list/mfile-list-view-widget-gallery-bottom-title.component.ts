import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  MfileListViewComponent
} from './mfile-list-view.component';
@Component({
  selector: 'app-mfile-list-view-widget-gallery-bottom-title',
  templateUrl: './mfile-list-view-widget-gallery-bottom-title.component.html',
  styleUrls: ['./mfile-list-view-widget-gallery-bottom-title.component.css'],
})
export class MfileListViewWidgetGalleryBottomTitleComponent extends MfileListViewComponent implements OnInit {
  constructor() {
    super();
  }
  ngOnInit() {
    super.ngOnInit();
  }
}