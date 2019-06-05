import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MddsFileUploadService } from './file-upload.service';
import { FileUploadComponent, SafeUrlPipe } from './file-upload.component';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
    ],
    declarations: [
        FileUploadComponent,
        SafeUrlPipe,
    ],
    exports: [
        FileUploadComponent
    ],
    providers: [
        MddsFileUploadService,
    ]
})
export class FileUploadModule { }
