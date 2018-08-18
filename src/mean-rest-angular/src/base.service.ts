import { Observable, throwError } from 'rxjs';
import { catchError, map, filter, retry } from 'rxjs/operators';
import { HttpClient, HttpHeaders,HttpParams, HttpErrorResponse } from '@angular/common/http';

export class ServiceError {
    status:number;
    clientErrorMsg:string;
    serverError:any;
}

export class BaseService {
    protected storage:any = {};

    constructor(protected http: HttpClient, protected serviceUrl: string) {}
    
    public getFromStorage(name:string) {
        return this.storage[name];
    }
    public putToStorage(name:string, value:any) {
        this.storage[name] = value;
    }
    
    protected errorResponseHandler(error: HttpErrorResponse) {
      let err:ServiceError = new ServiceError();;
      if (error.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          err.status = 0;
          err.clientErrorMsg = error.error.message
      } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          err.status = error.status;
          err.serverError = error.error;
      }
      // return an observable with a user-facing error message
      return throwError(
        err
      );
    }
    
    protected formatDetail(detail:any): any {
        return detail;
    }
    
    protected formatList(list:any): any {
        return list;
    }

    getList(page:number, per_page:number) {
        let httpOptions = {
            params: new HttpParams().set('__page', page.toString())
                                    .set('__per_page', per_page.toString()),
        };

        return this.http.get<any>(this.serviceUrl, httpOptions)
            .pipe(
                map(this.formatList),
                catchError(this.errorResponseHandler)
            );
    }

    getListWithCondition(page:number, per_page:number) {
        let httpOptions = {
            params: new HttpParams().set('__page', page.toString())
                                    .set('__per_page', per_page.toString()),
        };

        return this.http.get<any>(this.serviceUrl, httpOptions)
            .pipe(
                map(this.formatList),
                catchError(this.errorResponseHandler)
            );
    }

    getDetail(id:string) {
        return this.http.get<any>(this.serviceUrl + id)
            .pipe(
                map(this.formatDetail),
                catchError(this.errorResponseHandler)
            );
    }
    deleteOne(id:string) {
        return this.http.delete<any>(this.serviceUrl + id)
            .pipe(
                catchError(this.errorResponseHandler)
            );
    }
    deleteManyByIds(ids:string[]) {
        let httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            params: new HttpParams().set('action', "DeleteManyByIds"),
        };
        return this.http.post<any>(this.serviceUrl, ids, httpOptions)
            .pipe(
                catchError(this.errorResponseHandler)
            );
    }
    createOne(item:any) {
        let httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };
        return this.http.put<any>(this.serviceUrl, item, httpOptions)
            .pipe(
                map(this.formatDetail),
                catchError(this.errorResponseHandler)
            );
    }
    updateOne(id:string, item:any) {
        let httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };
        return this.http.post<any>(this.serviceUrl + id, item, httpOptions)
            .pipe(
                catchError(this.errorResponseHandler)
            );
    }
}
