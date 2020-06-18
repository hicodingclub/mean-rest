import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { MDDSContactDisplayComponent } from './contact-display.component'
import { MDDSContactEditComponent } from './contact-edit.component'
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
  ],
  declarations: [
    MDDSContactDisplayComponent,
    MDDSContactEditComponent
  ],
  exports: [
    MDDSContactDisplayComponent,
    MDDSContactEditComponent
  ],
  providers: [],
  entryComponents: []
})
export class MDDSContactModule { }
