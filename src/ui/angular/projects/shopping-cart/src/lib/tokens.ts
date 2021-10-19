import { InjectionToken } from '@angular/core';

export const SHOPPING_CART_CONTINUE_PATH = new InjectionToken<string>('SHOPPING_CART_CONTINUE_PATH');
export const SHOPPING_CART_CHECKOUT_PATH = new InjectionToken<string>('SHOPPING_CART_CHECKOUT_PATH');
export const SHOPPING_CART_OUTOFSTOCK_TEXT = new InjectionToken<string>('SHOPPING_CART_OUTOFSTOCK_TEXT', {factory: () => "Out of stock",});
