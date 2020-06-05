import { NgModule } from '@angular/core';
import { MddsMinNumberDirective, MddsMaxNumberDirective } from './mdds-common.directives';
import { MddsCommonService } from './mdds-common.service';
import { MddsRichTextSelectDirective, MddsRichTextShowDirective } from './summernote.directive';

@NgModule({
  imports: [
  ],
  declarations: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsRichTextSelectDirective,
    MddsRichTextShowDirective,
  ],
  exports: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsRichTextSelectDirective,
    MddsRichTextShowDirective,
 ],
  providers: [
  ],
})
export class MddsCoreModule { }
