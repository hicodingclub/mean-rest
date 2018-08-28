import { NgModule } from '@angular/core';

import { MinNumber, MaxNumber } from './common.directives';
import { MraRichTextSelectDirective } from './quill.directive';
@NgModule({
  imports: [
  ],
  declarations: [
    MinNumber,
    MaxNumber,
    MraRichTextSelectDirective
  ],
  exports: [
    MinNumber,
    MaxNumber,
    MraRichTextSelectDirective
 ],
  providers: [
  ],
})
export class MraModule { }