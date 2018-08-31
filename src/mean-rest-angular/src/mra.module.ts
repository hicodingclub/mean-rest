import { NgModule } from '@angular/core';

import { MinNumber, MaxNumber } from './common.directives';
import { MraRichTextSelectDirective, MraRichTextShowDirective } from './summernote.directive';
@NgModule({
  imports: [
  ],
  declarations: [
    MinNumber,
    MaxNumber,
    MraRichTextSelectDirective,
    MraRichTextShowDirective
  ],
  exports: [
    MinNumber,
    MaxNumber,
    MraRichTextSelectDirective,
    MraRichTextShowDirective
 ],
  providers: [
  ],
})
export class MraModule { }