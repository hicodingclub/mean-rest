import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MddsCommonService {

  private storage: any = {};
  private subject: Subject<string> = new Subject<string>();

  constructor() {}

  public getFromStorage(name: string): any {
    return this.storage[name];
  }
  public putToStorage(name: string, value: any) {
    this.storage[name] = value;
    this.subject.next(name);
  }
  public notifier() {
    return this.subject;
  }
}
