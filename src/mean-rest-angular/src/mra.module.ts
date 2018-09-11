import { NgModule } from '@angular/core';

import { MinNumber, MaxNumber } from './common.directives';
import { MraRichTextSelectDirective, MraRichTextShowDirective } from './summernote.directive';
import { MraCommonService } from './common.service';
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
    MraCommonService
  ],
})
export class MraModule { }