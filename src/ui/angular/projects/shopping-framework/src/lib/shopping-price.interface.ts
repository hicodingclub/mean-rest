export interface PriceInfo {
  itemsPrice: number;
  shippingPrice: number;
  totalBeforeTax: number,
  tax: number;
  totalPrice: number,
  ready: boolean,
}

const PriceInfoPresentation: Map<string, string> = new Map<string, string> ([
  ['itemsPrice', 'items price'],
  ['shippingPrice', 'shipping price'],
  ['totalBeforeTax', 'total before tax'],
  ['tax', 'tax'],
  ['totalPrice', 'total price'],
])

import { Pipe, PipeTransform } from '@angular/core';
import { JsonToYamlConverterService } from './yaml/yaml.service';
@Pipe({name: 'priceInfoPre'})
export class PriceInfoPre implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const priceInfo: PriceInfo = JSON.parse(decodeURI(value));
    const obj: any = priceInfo;
    delete obj.ready;
    const cvt = new JsonToYamlConverterService(PriceInfoPresentation, 2, new Map<string, number>())
    const yaml = cvt.json2yaml(obj);
    return `<pre style="white-space: pre-wrap;">${decodeURI(yaml)}</pre>`;
  }
}