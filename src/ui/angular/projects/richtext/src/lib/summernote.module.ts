import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MddsRichtextEditorComponent } from './richtext.editor.component';
import { MddsRichTextShowDirective } from './richtext.show.directive';
@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    MddsRichtextEditorComponent,
    MddsRichTextShowDirective,
  ],
  exports: [
    MddsRichtextEditorComponent,
    MddsRichTextShowDirective,
 ],
  providers: [
  ],
})
export class MddsRichtextEditorModule { }