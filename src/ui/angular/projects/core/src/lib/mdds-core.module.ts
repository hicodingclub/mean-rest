import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MddsMinNumberDirective, MddsMaxNumberDirective } from './mdds-common.directives';
import { MddsAnchorPipe } from './anchor-pipe';
@NgModule({
  imports: [
    RouterModule,
  ],
  declarations: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsAnchorPipe,
  ],
  exports: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsAnchorPipe,
 ],
  providers: [
  ],
})
export class MddsCoreModule { }
