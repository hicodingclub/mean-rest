import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';

export class MddsServiceError {
  status: number;
  clientErrorMsg: string;
  serverError: any;
}

export class MddsBaseService {
  protected storage: any = {};

  constructor(protected http: HttpClient, protected serviceUrl: string) {}

  public getFromStorage(name: string) {
    return this.storage[name];
  }
  public putToStorage(name: string, value: any) {
    this.storage[name] = value;
  }

  protected errorResponseHandler(error: HttpErrorResponse) {
    const err: MddsServiceError = new MddsServiceError();
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      err.status = 0;
      err.clientErrorMsg = error.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      err.status = error.status;
      err.serverError = error.error;
    }
    // return an observable with a user-facing error message
    return throwError(err);
  }

  protected formatDetail(detail: any): any {
    return detail;
  }

  protected formatList(res: any): any {
    let list = res;
    if (res instanceof HttpResponse) {
      const cd = res.headers.get('Content-Disposition');
      if (cd && cd.startsWith('attachment;')) {
        let filename;
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(cd);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
        list = {
          gotFileNameFromContentDisposition: true,
          filename,
          attachment: res.body,
        };
      } else {
        list = res.body;
      }
    }
    return list;
  }

  getListSimple(
    page: number,
    perPage: number,
    searchContext: any,
  ) {
    return this.getList(page, perPage, searchContext,
        undefined, undefined,
        undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined,
      );
  }
  getList(
    page: number,
    perPage: number,
    searchContext: any,
    sort: string,
    order: string,
    categoryBy: string,
    listCategoryShowMore: boolean,
    categoryProvided: boolean,
    categoryCandidate: string,
    categoryBy2: string,
    listCategoryShowMore2: boolean,
    categoryProvided2: boolean,
    categoryCandidate2: string,
    associationField: string,
    actionType: string,
    actionData: any,
    ignoreField: string
  ) {
    let params = new HttpParams()
      .set('__page', page.toString())
      .set('__per_page', perPage.toString());
    if (sort && order) {
      params = params.set('__sort', sort).set('__order', order);
    }
    if (categoryBy) {
      params = params.set('__categoryBy', categoryBy);
    }
    if (categoryProvided) {
      params = params.set('__categoryProvided', 'y');
    }
    if (listCategoryShowMore) {
      params = params.set('__listCategoryShowMore', 'y');
    }
    if (categoryCandidate) {
      params = params.set('__categoryCand', categoryCandidate);
    }
    if (categoryBy2) {
      params = params.set('__categoryBy2', categoryBy2);
    }
    if (categoryProvided2) {
      params = params.set('__categoryProvided2', 'y');
    }
    if (listCategoryShowMore2) {
      params = params.set('__listCategoryShowMore2', 'y');
    }
    if (categoryCandidate2) {
      params = params.set('__categoryCand2', categoryCandidate2);
    }
    if (associationField) {
      params = params.set('__asso', associationField);
    }

    if (ignoreField) {
      params = params.set('__ignore', ignoreField);
    }

    let httpOptions;
    if (actionType === 'export') {
      httpOptions = {
        params,
        headers: new HttpHeaders({
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        responseType: 'blob' as 'blob',
        observe: 'response', // need to get response header
      };
    } else {
      httpOptions = {
        params,
        headers: new HttpHeaders({ Accept: 'application/json' }),
        responseType: 'json' as 'json',
      };
    }

    if (!searchContext && !actionData) {
      return this.http
        .get(this.serviceUrl, httpOptions)
        .pipe(map(this.formatList), catchError(this.errorResponseHandler));
    }
    httpOptions.params = httpOptions.params.set('action', 'Search');

    const at = actionType ? actionType : 'get';
    const url = `mddsaction/${at}`;
    const data = {
      search: searchContext,
      actionData,
    };
    return this.http
      .post(this.serviceUrl + url, data, httpOptions)
      .pipe(map(this.formatList), catchError(this.errorResponseHandler));
  }

  getListWithCondition(page: number, perPage: number) {
    const httpOptions = {
      params: new HttpParams()
        .set('__page', page.toString())
        .set('__per_page', perPage.toString()),
      headers: new HttpHeaders({ Accept: 'application/json' }),
    };

    return this.http
      .get<any>(this.serviceUrl, httpOptions)
      .pipe(map(this.formatList), catchError(this.errorResponseHandler));
  }

  getDetailForAction(id: string, action: string) {
    const httpOptions: any = {
      headers: new HttpHeaders({ Accept: 'application/json' }),
    };
    let serviceUrl = this.serviceUrl;
    if (action) {
      httpOptions.params = new HttpParams().set('action', action);
      if (action === 'edit') {
        action = 'post';
      }
      serviceUrl = serviceUrl + 'mddsaction/' + action + '/';
    }
    return this.http
      .get<any>(serviceUrl + id, httpOptions)
      .pipe(map(this.formatDetail), catchError(this.errorResponseHandler));
  }
  getDetail(id: string) {
    return this.getDetailForAction(id, null);
  }
  deleteOne(id: string) {
    return this.http
      .delete<any>(this.serviceUrl + id)
      .pipe(catchError(this.errorResponseHandler));
  }
  archiveOne(id: string, archived) {
    return this.archiveManyByIds([id], archived);
  }
  deleteManyByIds(ids: string[]) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      params: new HttpParams().set('action', 'DeleteManyByIds'),
    };
    return this.http
      .post<any>(this.serviceUrl + 'mddsaction/delete', ids, httpOptions)
      .pipe(catchError(this.errorResponseHandler));
  }
  archiveManyByIds(ids: string[], archived: boolean) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      params: new HttpParams().set('action', 'ArchiveManyByIds'),
    };
    const url =
      this.serviceUrl + 'mddsaction/' + (archived ? 'unarchive' : 'archive');
    return this.http
      .post<any>(url, ids, httpOptions)
      .pipe(catchError(this.errorResponseHandler));
  }

  createOne(item: any) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .put<any>(this.serviceUrl, item, httpOptions)
      .pipe(map(this.formatDetail), catchError(this.errorResponseHandler));
  }
  updateOne(id: string, item: any) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .post<any>(this.serviceUrl + id, item, httpOptions)
      .pipe(catchError(this.errorResponseHandler));
  }
  getFieldValues(
    field: string,
    field_value: string,
    sort: string,
    limit: number
  ) {
    let params = new HttpParams()
      .set('__field', field)
      .set('__sort', sort)
      .set('__limit', limit.toString());
    if (field_value) {
      params.set('__field_value', field_value);
    }
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      params,
    };
    let serviceUrl = this.serviceUrl + 'mddsaction/getfieldvalues';
    return this.http
      .post<any>(serviceUrl, {}, httpOptions)
      .pipe(catchError(this.errorResponseHandler));
  }

  callZInterface(action: string, interfaceName: string, content: any) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .post<any>(this.serviceUrl + `mddsaction/${action}-z/${interfaceName}`, content, httpOptions)
      .pipe(catchError(this.errorResponseHandler));
  }
}
