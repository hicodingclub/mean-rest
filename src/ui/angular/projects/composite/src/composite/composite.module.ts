import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CompositeComponent, CompositeDirective, CompositeSubmitDirective } from './composite.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
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
