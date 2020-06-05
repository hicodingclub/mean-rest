import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { CartViewComponent } from './cart-view.component';

const routes: Routes = [
  {
    path: "shopping-cart",
    children: [
      { path: "view", component: CartViewComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShoppingCartRoutingModule {}
