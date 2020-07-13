import { NgModule } from '@angular/core';
import { MddsMinNumberDirective, MddsMaxNumberDirective } from './mdds-common.directives';
@NgModule({
  imports: [
  ],
  declarations: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
  ],
  exports: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
 ],
  providers: [
  ],
})
export class MddsCoreModule { }
