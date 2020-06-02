import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FileUploadModule } from '@hicoder/angular-file';

import { AddToCartComponent } from './add-to-cart.component';
import { CartIconComponent } from './cart-icon.component';

import { ClickElsewhereDirective } from './click-elsewhere.directive';


@NgModule({
  declarations: [
    AddToCartComponent,
    CartIconComponent,
  
    ClickElsewhereDirective,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FileUploadModule,
  ],
  exports: [
    AddToCartComponent,
    CartIconComponent,
  ]
})
export class ShoppingCartModule { }
