import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { MDDSAddressDisplayComponent } from "./addr-display.component";
import { MDDSAddressEditComponent } from "./addr-edit.component";
@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [MDDSAddressDisplayComponent, MDDSAddressEditComponent],
  exports: [MDDSAddressDisplayComponent, MDDSAddressEditComponent],
  providers: [],
  entryComponents: [],
})
export class MDDSAddressModule {}
