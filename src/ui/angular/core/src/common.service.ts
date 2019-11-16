import { Injectable } from '@angular/core';
 
@Injectable(
)
export class MraCommonService {
    private storage:any = {};

    constructor() {}
    
    public getFromStorage(name:string) {
        return this.storage[name];
    }
    public putToStorage(name:string, value:any) {
        this.storage[name] = value;
    }
}
