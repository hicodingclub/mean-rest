import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FileUploadModule } from '@hicoder/angular-file';
import { MddsCoreModule } from '@hicoder/angular-core';

import { ShoppingCartRoutingModule } from './shopping-cart-routing.module';

import { AddToCartComponent } from './add-to-cart.component';
import { CartListComponent } from './cart-list.component';
import { CartIconComponent } from './cart-icon.component';
import { CartViewComponent } from './cart-view.component';

import { ClickElsewhereDirective } from './click-elsewhere.directive';


@NgModule({
  declarations: [
    AddToCartComponent,
    CartListComponent,
    CartIconComponent,
    CartViewComponent,

    ClickElsewhereDirective,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MddsCoreModule,
    FileUploadModule,

    ShoppingCartRoutingModule,
  ],
  exports: [
    AddToCartComponent,
    CartIconComponent,
    CartListComponent,
  ]
})
export class ShoppingCartModule { }
