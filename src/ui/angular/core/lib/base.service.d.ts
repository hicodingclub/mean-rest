import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
export declare class ServiceError {
    status: number;
    clientErrorMsg: string;
    serverError: any;
}
export declare class BaseService {
    protected http: HttpClient;
    protected serviceUrl: string;
    protected storage: any;
    constructor(http: HttpClient, serviceUrl: string);
    getFromStorage(name: string): any;
    putToStorage(name: string, value: any): void;
    protected errorResponseHandler(error: HttpErrorResponse): Observable<never>;
    protected formatDetail(detail: any): any;
    protected formatList(list: any): any;
    getList(page: number, per_page: number, searchContext: any): Observable<any>;
    getListWithCondition(page: number, per_page: number): Observable<any>;
    getDetailForAction(id: string, action: string): Observable<any>;
    getDetail(id: string): Observable<any>;
    deleteOne(id: string): Observable<any>;
    deleteManyByIds(ids: string[]): Observable<any>;
    createOne(item: any): Observable<any>;
    updateOne(id: string, item: any): Observable<any>;
}
