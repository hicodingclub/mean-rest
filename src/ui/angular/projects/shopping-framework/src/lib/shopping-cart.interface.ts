export interface ShoppingItem {
  picture?: string; // url
  name: string;
  description: string;
  quantity: number;
  price: number;
  stockNumber: number;
  url: string;
  pageUrl: string;
  skuID: string;
  type: string;
}

export interface ShoppingItems {
  items: ShoppingItem[];
  quantity: number;
  price: number;
  ready: boolean;
}

import { Pipe, PipeTransform } from '@angular/core';
import { JsonToYamlConverterService } from './yaml/yaml.service';
@Pipe({name: 'shoppingItemsPre'})
export class ShoppingItemsPre implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const shoppingItems: ShoppingItems = JSON.parse(decodeURI(value));
    const obj: any = shoppingItems;
    obj.items = obj.items.map(x => {
      delete x.url;
      delete x.stockNumber;
      delete x.picture;
      x.id = `<a href="${x.pageUrl}">${x.skuID}</a>`;
      delete x.pageUrl;
      delete x.skuID;
      return x;
    })
    delete obj.ready;
    const cvt = new JsonToYamlConverterService(
      new Map<string, string>(),
      2,
      new Map<string, number>([["quantity", 0]])
    );
    const yaml = cvt.json2yaml(obj);
    return `<pre style="white-space: pre-wrap;">${decodeURI(yaml)}</pre>`;
  }
}