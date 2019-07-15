import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { CompositeComponent, CompositeDirective, CompositeSubmitDirective } from './composite.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
    ],
    declarations: [
        CompositeComponent,

        CompositeDirective,
        CompositeSubmitDirective
    ],
    exports: [
        CompositeComponent
    ],
    providers: [
    ],
})
export class CompositeModule{}