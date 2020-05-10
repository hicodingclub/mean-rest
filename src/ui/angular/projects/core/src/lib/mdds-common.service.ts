import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MddsCommonService {

  private storage: any = {};

  constructor() {}

  public getFromStorage(name: string): any {
      return this.storage[name];
  }
  public putToStorage(name: string, value: any) {
      this.storage[name] = value;
  }
}
