import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MddsCoreModule } from '@hicoder/angular-core';

import { MddsFileUploadService } from './file-upload.service';
import { FileUploadComponent } from './file-upload.component';
import { FileDisplayComponent } from './file-display.component';
import { FileSelectComponent, MddsFileSelectDirective } from './file-select.component';

import { MfileListComponent } from './mfile/mfile-list/mfile-list.component'
import { MfileListWidgetGalleryComponent } from './mfile/mfile-list/mfile-list-widget-gallery.component'

import { MfilegroupListComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list.component';
import { MfilegroupEditComponent } from './mfilegroup/mfilegroup-edit/mfilegroup-edit.component';
import { MfilegroupService } from './mfilegroup/mfilegroup.service';
import { MfilegroupListSelectComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list-select.component';
import { MfilegroupListSelectIndexComponent } from './mfilegroup/mfilegroup-list/mfilegroup-list-select-index.component';

import { MfileService } from './mfile/mfile.service';

import { MddsCropperComponent } from '../cropper/mdds-cropper.component'

import { SafeUrlPipe } from './pipes';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        HttpClientModule,

        NgbModule,
        MddsCoreModule,
    ],
    declarations: [
        MfileListComponent,
        MfileListWidgetGalleryComponent,
        SafeUrlPipe,

        FileUploadComponent,
        FileDisplayComponent,
        FileSelectComponent,
        MddsFileSelectDirective,

        MfilegroupListSelectComponent,
        MfilegroupListSelectIndexComponent,
        MfilegroupEditComponent,
        MfilegroupListComponent,

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
