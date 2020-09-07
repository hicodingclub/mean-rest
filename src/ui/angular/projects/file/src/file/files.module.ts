import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MddsCoreModule } from '@hicoder/angular-core';

import { MddsFileUploadService } from './file-upload.service';
import { FilesUploadComponent } from './files-upload.component';
import { FilesDisplayComponent } from './files-display.component';
import { PictureDisplayComponent } from './picture-display.component';
import { PictureSelectComponent } from './picture-select.component';

import { MpictureListComponent } from './mpicture/mpicture-list/mpicture-list.component';
import { MpictureListViewComponent } from './mpicture/mpicture-list/mpicture-list-view.component';
import { MpictureListViewWidgetGalleryBottomTitleComponent } from './mpicture/mpicture-list/mpicture-list-view-widget-gallery-bottom-title.component';
import { MpictureComponent } from './mpicture/mpicture.component';
import { MpictureListCustComponent } from '../file-cust/base/mpicture/mpicture-list.cust.component';

import { MpicturegroupListComponent } from './mpicturegroup/mpicturegroup-list/mpicturegroup-list.component';
import { MpicturegroupEditComponent } from './mpicturegroup/mpicturegroup-edit/mpicturegroup-edit.component';
import { MpicturegroupListSelectComponent } from './mpicturegroup/mpicturegroup-list/mpicturegroup-list-select.component';
import { MpicturegroupListViewComponent } from './mpicturegroup/mpicturegroup-list/mpicturegroup-list-view.component';
import { MpicturegroupListViewWidgetIndexComponent } from './mpicturegroup/mpicturegroup-list/mpicturegroup-list-view-widget-index.component';
import { MpicturegroupComponent } from './mpicturegroup/mpicturegroup.component';
import { MpicturegroupEditCustComponent } from '../file-cust/base/mpicturegroup/mpicturegroup-edit.cust.component';
import { MpicturegroupListCustComponent } from '../file-cust/base/mpicturegroup/mpicturegroup-list.cust.component';

import { MpicturegroupService } from './mpicturegroup/mpicturegroup.service';
import { MpictureService } from './mpicture/mpicture.service';

import { FileRefSelectDirective } from './file.select.directive';

import { MpictureListWidgetGalleryComponent } from './cust/mpicture-list-widget-gallery.component';

import { MddsCropperComponent } from '../cropper/mdds-cropper.component';

import { SafeUrlPipe } from './pipes';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,

        NgbModule,
        MddsCoreModule,
    ],
    declarations: [
        MpictureListComponent,
        MpictureListViewComponent,
        MpictureListViewWidgetGalleryBottomTitleComponent,
        MpictureComponent,
        MpictureListCustComponent,

        MpicturegroupListSelectComponent,
        MpicturegroupListViewComponent,
        MpicturegroupListViewWidgetIndexComponent,
        MpicturegroupEditComponent,
        MpicturegroupListComponent,
        MpicturegroupComponent,
        MpicturegroupEditCustComponent,
        MpicturegroupListCustComponent,

        SafeUrlPipe,

        MpictureListWidgetGalleryComponent,

        FilesUploadComponent,
        FilesDisplayComponent,
        PictureSelectComponent,
        PictureDisplayComponent,

        FileRefSelectDirective,

        MddsCropperComponent,
    ],
    exports: [
        FilesUploadComponent,
        FilesDisplayComponent,
        PictureDisplayComponent,
        PictureSelectComponent,
        SafeUrlPipe,
    ],
    providers: [
        MddsFileUploadService,
        MpictureService,
        MpicturegroupService,
    ],
    entryComponents: [
        MpictureListWidgetGalleryComponent,
    ]
})
export class FilesModule { }
