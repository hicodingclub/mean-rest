import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  MpictureListViewComponent
} from './mpicture-list-view.component';
@Component({
  selector: 'app-mpicture-list-view-widget-gallery-bottom-title',
  templateUrl: './mpicture-list-view-widget-gallery-bottom-title.component.html',
  styleUrls: ['./mpicture-list-view-widget-gallery-bottom-title.component.css'],
})
export class MpictureListViewWidgetGalleryBottomTitleComponent extends MpictureListViewComponent implements OnInit {
  constructor() {
    super();
  }
  ngOnInit() {
    super.ngOnInit();
  }
}