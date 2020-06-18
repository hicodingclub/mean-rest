import { NgModule } from "@angular/core";

import { ShoppingItemsPre } from './shopping-cart.interface';
import { PriceInfoPre } from './shopping-price.interface';
import { ShippingInfoPre } from './shopping-shipment.interface'
import { ContactInfoPre } from './contact.interface'
@NgModule({
  imports: [],
  declarations: [ShoppingItemsPre, PriceInfoPre, ShippingInfoPre, ContactInfoPre],
  exports: [ShoppingItemsPre, PriceInfoPre, ShippingInfoPre, ContactInfoPre],
  providers: [],
  entryComponents: [],
})
export class MDDSShoppingModule {}
