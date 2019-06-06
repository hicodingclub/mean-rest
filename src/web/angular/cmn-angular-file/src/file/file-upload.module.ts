import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MddsFileUploadService } from './file-upload.service';
import { FileUploadComponent, SafeUrlPipe } from './file-upload.component';
import { FileDisplayComponent } from './file-display.component';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
    ],
    declarations: [
        FileUploadComponent,
        SafeUrlPipe,

        FileDisplayComponent,
    ],
    exports: [
        FileUploadComponent,
        FileDisplayComponent,
    ],
    providers: [
        MddsFileUploadService,
    ]
})
export class FileUploadModule { }
