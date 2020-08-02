import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import {
  MddsMinNumberDirective,
  MddsMaxNumberDirective,
  MddsDirectiveArrayRequired,
  MddsDirectiveMapRequired,
  MddsDirectiveMultiSelectionRequired,
} from "./mdds-common.directives";
import { MddsAnchorPipe } from "./anchor.pipe";
@NgModule({
  imports: [RouterModule],
  declarations: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsAnchorPipe,
    MddsDirectiveArrayRequired,
    MddsDirectiveMapRequired,
    MddsDirectiveMultiSelectionRequired,
  ],
  exports: [
    MddsMinNumberDirective,
    MddsMaxNumberDirective,
    MddsAnchorPipe,
    MddsDirectiveArrayRequired,
    MddsDirectiveMapRequired,
    MddsDirectiveMultiSelectionRequired,
  ],
  providers: [],
})
export class MddsCoreModule {}
