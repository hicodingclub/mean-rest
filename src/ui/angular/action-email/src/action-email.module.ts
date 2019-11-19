import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MddsRichtextEditorModule } from '@hicoder/angular-richtext';

import { ActionEmail } from './action-email.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        MddsRichtextEditorModule,
    ],
    declarations: [
        ActionEmail,
    ],
    exports: [
        ActionEmail
    ],
})
export class ActionEmailModule{}
