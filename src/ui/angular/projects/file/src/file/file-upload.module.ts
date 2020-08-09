import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MddsCoreModule } from '@hicoder/angular-core';

import { MddsFileUploadService } from './file-upload.service';
import { FileUploadComponent } from './file-upload.component';
import { FileDisplayComponent } from './file-display.component';
import { FileSelectComponent } from './file-select.component';

import { MfileListComponent } from './mfile/mfile-list/mfile-list.component';
import { MfileListWidgetGalleryComponent } from './mfile/mfile-list/mfile-list-widget-gallery.component';
import { MfileListWidgetGalleryBottomTitleComponent } from './mfile/mfile-list/mfile-list-widget-galleryBottomTitle.component';
import { MfileComponent } from './mfile/mfile.component';
import { FileRefSelectDirective } from './file.select.directive';
import { MfileListCustComponent } from '../file-cust/base/mfile/mfile-list.cust.component';

import { MfilegroupListComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list.component';
import { MfilegroupEditComponent } from './mfilegroup/mfilegroup-edit/mfilegroup-edit.component';
import { MfilegroupService } from './mfilegroup/mfilegroup.service';
import { MfilegroupListSelectComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list-select.component';
import { MfilegroupListSelectIndexComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list-select-index.component';
import { MfilegroupComponent } from './mfilegroup/mfilegroup.component';
import { MfilegroupEditCustComponent } from '../file-cust/base/mfilegroup/mfilegroup-edit.cust.component';
import { MfilegroupListCustComponent } from '../file-cust/base/mfilegroup/mfilegroup-list.cust.component';

import { MfileService } from './mfile/mfile.service';

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
        MfileListComponent,
        MfileListWidgetGalleryComponent,
        MfileListWidgetGalleryBottomTitleComponent,
        SafeUrlPipe,

        FileUploadComponent,
        FileDisplayComponent,
        FileSelectComponent,
        MfileComponent,
        FileRefSelectDirective,
        MfileListCustComponent,

        MfilegroupListSelectComponent,
        MfilegroupListSelectIndexComponent,
        MfilegroupEditComponent,
        MfilegroupListComponent,
        MfilegroupComponent,
        MfilegroupEditCustComponent,
        MfilegroupListCustComponent,

        MddsCropperComponent,
    ],
    exports: [
        FileUploadComponent,
        FileDisplayComponent,
        FileSelectComponent,
        SafeUrlPipe,
    ],
    providers: [
        MddsFileUploadService,
        MfileService,
        MfilegroupService,
    ],
    entryComponents: [
        MfileListWidgetGalleryComponent,
    ]
})
export class FileUploadModule { }
