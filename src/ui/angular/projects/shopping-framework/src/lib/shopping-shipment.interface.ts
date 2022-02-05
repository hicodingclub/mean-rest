import { Address, AddressToString } from './addr.interface'
export interface ShippingInfo {
  method: string;
  price: number;
  address?: Address;
  notes?: string;
  ready: boolean;
}


import { Pipe, PipeTransform } from '@angular/core';
import { JsonToYamlConverterService } from './yaml/yaml.service';
@Pipe({name: 'shippingInfoPre'})
export class ShippingInfoPre implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const shippingInfo: ShippingInfo = JSON.parse(decodeURI(value));
    const obj: any = {
      method: shippingInfo.method,
      price: shippingInfo.price,
    };
    if (shippingInfo.address) {
      obj.address = AddressToString(shippingInfo.address);
    }
    if (shippingInfo.notes) {
      obj.notes = shippingInfo.notes;
    }
     
    const cvt = new JsonToYamlConverterService(new Map<string, string>(), 2, new Map<string, number>())
    const yaml = cvt.json2yaml(obj);
    return `<pre style="white-space: pre-wrap;">${decodeURI(yaml)}</pre>`;
  }
}
