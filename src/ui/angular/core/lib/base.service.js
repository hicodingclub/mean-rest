"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var http_1 = require("@angular/common/http");
var ServiceError = /** @class */ (function () {
    function ServiceError() {
    }
    return ServiceError;
}());
exports.ServiceError = ServiceError;
var BaseService = /** @class */ (function () {
    function BaseService(http, serviceUrl) {
        this.http = http;
        this.serviceUrl = serviceUrl;
        this.storage = {};
    }
    BaseService.prototype.getFromStorage = function (name) {
        return this.storage[name];
    };
    BaseService.prototype.putToStorage = function (name, value) {
        this.storage[name] = value;
    };
    BaseService.prototype.errorResponseHandler = function (error) {
        var err = new ServiceError();
        ;
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            err.status = 0;
            err.clientErrorMsg = error.error.message;
        }
        else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            err.status = error.status;
            err.serverError = error.error;
        }
        // return an observable with a user-facing error message
        return rxjs_1.throwError(err);
    };
    BaseService.prototype.formatDetail = function (detail) {
        return detail;
    };
    BaseService.prototype.formatList = function (list) {
        return list;
    };
    BaseService.prototype.getList = function (page, per_page, searchContext) {
        var httpOptions = {
            params: new http_1.HttpParams().set('__page', page.toString())
                .set('__per_page', per_page.toString()),
            headers: new http_1.HttpHeaders({ 'Accept': 'application/json' }),
        };
        if (!searchContext) {
            return this.http.get(this.serviceUrl, httpOptions)
                .pipe(operators_1.map(this.formatList), operators_1.catchError(this.errorResponseHandler));
        }
        httpOptions.params = httpOptions.params.set('action', "Search");
        return this.http.post(this.serviceUrl + "mddsaction/get", searchContext, httpOptions)
            .pipe(operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.getListWithCondition = function (page, per_page) {
        var httpOptions = {
            params: new http_1.HttpParams().set('__page', page.toString())
                .set('__per_page', per_page.toString()),
            headers: new http_1.HttpHeaders({ 'Accept': 'application/json' }),
        };
        return this.http.get(this.serviceUrl, httpOptions)
            .pipe(operators_1.map(this.formatList), operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.getDetailForAction = function (id, action) {
        var httpOptions = {
            headers: new http_1.HttpHeaders({ 'Accept': 'application/json' }),
        };
        var serviceUrl = this.serviceUrl;
        if (action) {
            httpOptions['params'] = new http_1.HttpParams().set('action', action);
            if (action == "edit")
                action = "post";
            serviceUrl = serviceUrl + "mddsaction/" + action + "/";
        }
        return this.http.get(serviceUrl + id, httpOptions)
            .pipe(operators_1.map(this.formatDetail), operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.getDetail = function (id) {
        return this.getDetailForAction(id, null);
    };
    BaseService.prototype.deleteOne = function (id) {
        return this.http.delete(this.serviceUrl + id)
            .pipe(operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.deleteManyByIds = function (ids) {
        var httpOptions = {
            headers: new http_1.HttpHeaders({ 'Content-Type': 'application/json' }),
            params: new http_1.HttpParams().set('action', "DeleteManyByIds"),
        };
        return this.http.post(this.serviceUrl + "mddsaction/delete", ids, httpOptions)
            .pipe(operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.createOne = function (item) {
        var httpOptions = {
            headers: new http_1.HttpHeaders({ 'Content-Type': 'application/json' })
        };
        return this.http.put(this.serviceUrl, item, httpOptions)
            .pipe(operators_1.map(this.formatDetail), operators_1.catchError(this.errorResponseHandler));
    };
    BaseService.prototype.updateOne = function (id, item) {
        var httpOptions = {
            headers: new http_1.HttpHeaders({ 'Content-Type': 'application/json' })
        };
        return this.http.post(this.serviceUrl + id, item, httpOptions)
            .pipe(operators_1.catchError(this.errorResponseHandler));
    };
    return BaseService;
}());
exports.BaseService = BaseService;
