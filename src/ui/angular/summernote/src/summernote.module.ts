import { NgModule } from '@angular/core';

import { MraRichTextSelectDirective, MraRichTextShowDirective } from './summernote.directive';
@NgModule({
  imports: [
  ],
  declarations: [
    MraRichTextSelectDirective,
    MraRichTextShowDirective
  ],
  exports: [
    MraRichTextSelectDirective,
    MraRichTextShowDirective
 ],
  providers: [
  ],
})
export class MddsAngularSummernoteModule { }