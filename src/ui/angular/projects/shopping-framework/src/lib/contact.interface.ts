export interface ContactPerson {
  person: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface ContactInfo {
  person: ContactPerson;
  ready: boolean;
}

import { Pipe, PipeTransform } from '@angular/core';
import { JsonToYamlConverterService } from './yaml/yaml.service';
@Pipe({name: 'contactInfoPre'})
export class ContactInfoPre implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    const contacInfo: ContactInfo = JSON.parse(decodeURI(value));
    const obj: any = {
      contact: contacInfo.person,
    };
    
    const cvt = new JsonToYamlConverterService(new Map<string, string>(), 2, new Map<string, number>())
    const yaml = cvt.json2yaml(obj);
    return `<pre style="white-space: pre-wrap;">${decodeURI(yaml)}</pre>`;
  }
}