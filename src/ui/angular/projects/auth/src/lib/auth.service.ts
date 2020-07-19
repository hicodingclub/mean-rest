import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, filter, retry } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { Router, NavigationEnd  } from '@angular/router';

import { AUTHENTICATION_SERVER_ROOT_URI } from './tokens';

export interface temporayTokenIntf {
  expiresIn: number;
  token: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {

  private interruptedUrl: string;
  private routedFromUrl: string;

  private previousUrl: string;
  private currentUrl: string;
  private navigateEndTime: number;

  private adminInterface = false;

  private temporayToken: temporayTokenIntf;
  private temporayTokenAllowed: boolean = false;

  private authRecord: any = undefined;

  private authChangeSub: Subject<boolean> = new Subject<boolean>();

  constructor(
            @Inject(AUTHENTICATION_SERVER_ROOT_URI) private authServerRootUri: string,
            private router: Router,
            private http: HttpClient) {
    this.navigateEndTime = Date.now();

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = this.currentUrl;
        this.navigateEndTime = Date.now();
        if (event.urlAfterRedirects) {
          this.currentUrl = event.urlAfterRedirects;
        } else {
          this.currentUrl = event.url;
        }
      }
    });

    this.adminInterface = JSON.parse(localStorage.getItem('adminInterface'));
  }

  emptyAuthRecord() {
    return {
      userName: '',
      accessToken: '',
      refreshToken: '',
      displayName: '',
      rolep: {},
      expiresIn: 0,
    };
  }

  isAuthorized(): boolean {
    const authRecord = this.getAuthRecord();
    if (authRecord && authRecord.accessToken && Date.now() < authRecord.expiresIn) {
      return true;
    }
    return false;
  }

  authChange(): Subject<boolean> {
    return this.authChangeSub;
  }

  private getLogoutTime(): number {
    const authRecord = this.getAuthRecord();
    if ('logoutTs' in authRecord) {
        return authRecord.logoutTs;
    }
    return 0;
  }

  public getAccessToken(): string {
    const authRecord = this.getAuthRecord();
    if (authRecord.accessToken) {
      return authRecord.accessToken;
    }
    return null;
  }

  public refreshToken(): Observable<any> {
    let authRecord: any = this.getAuthRecord();
    const refreshToken: string = authRecord.refreshToken;
    const userName: string = authRecord.userName;

    return this.http.post<any>(
        this.authServerRootUri + '/refresh',
        {refreshToken, userName}
      ).pipe(
        map(this.loggedIn.bind(this)),
        catchError(error => {
          this.logout();
          return error;
        }
      )
    );
  }

  public refreshShouldHappen(response: HttpErrorResponse): boolean {
    return response.status === 401;
  }

  public verifyTokenRequest(url: string): boolean {
    if ( url.endsWith(this.authServerRootUri + '/refresh') ||
        url.endsWith(this.authServerRootUri + '/login')) {
      return true;
    }
    return false;
  }

  public getInterruptedUrl(): string {
    return this.interruptedUrl || '/';
  }

  public getRoutedFromUrl() {
    return this.routedFromUrl || '/';
  }

  public setInterruptedUrl(url: string): void {
    this.interruptedUrl = url;
    const currentTime = Date.now();

    if ( currentTime - this.navigateEndTime > 1000) {
      // Happend > 1 sec. assume it is triggered from current page.
      this.routedFromUrl = this.currentUrl;
    } else {
      // page transitioned
      this.routedFromUrl = this.previousUrl;
    }
  }

  private getAuthRecord(): any {
    if (typeof this.authRecord !== 'undefined') {
      return this.authRecord;
    }
    let authRecord: any = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (!authRecord) {
      this.authRecord  = this.emptyAuthRecord();
    } else {
      this.authRecord = authRecord;
    }
    return this.authRecord;
  }
  private setAuthRecord(authRecord: any): void {
    this.authRecord = authRecord;
    localStorage.setItem('mdds-auth-record', JSON.stringify(authRecord));
    this.authChangeSub.next(true);
  }

  public getUserName(): string {
    return this.getAuthRecord().userName;
  }

  public getRolePermissions(): any {
    return this.getAuthRecord().rolep;
  }

  login(userId: any, password: string) {
    const authRecord: any = this.emptyAuthRecord();
    this.setAuthRecord(authRecord);

    const options = this.adminInterface ?
       { params: new HttpParams().set('type', 'admin') } : {};

    const requestObj: any = { password };
    if (userId.id === 'username') {
      requestObj.username = userId.value;
    } else if (userId.id === 'email') {
      requestObj.email = userId.value;
    }

    return this.http.post<any>(this.authServerRootUri + '/login',
      requestObj, options
    ).pipe(map(this.loggedIn.bind(this)));
  }

  register(userInfo: any) {
    const authRecord: any = this.emptyAuthRecord();
    authRecord.displayName = userInfo.displayName;
    this.setAuthRecord(authRecord);

    const options = this.adminInterface ?
       { params: new HttpParams().set('type', 'admin') } : {};

    return this.http.post<any>(this.authServerRootUri + '/register', userInfo, options);
  }

  public getProfile(): Observable<any> {
    let authRecord: any = this.getAuthRecord();
    const refreshToken: string = authRecord.refreshToken;
    const userName: string = authRecord.userName;

    // use post with refresh token
    return this.http.post<any>(
      this.authServerRootUri + '/getprofile',
      {refreshToken, userName}
    );
  }

  public updateProfile(userInfo: any) {
    let authRecord: any = this.getAuthRecord();
    userInfo.refreshToken = authRecord.refreshToken;

    // use post with refresh token
    return this.http.post<any>(
      this.authServerRootUri + '/updateprofile',
      userInfo,
    );
  }

  regVerification(tokenInfo: any) {
    const options = this.adminInterface ?
    { params: new HttpParams().set('type', 'admin') } : {};

    return this.http.post<any>(this.authServerRootUri + '/regverification', tokenInfo, options);
  }
  changePass(passInfo: any) {
    const options = this.adminInterface ?
    { params: new HttpParams().set('type', 'admin') } : {};

    return this.http.post<any>(this.authServerRootUri + '/changepass', passInfo, options);
  }
  findPass(emailInfo: any) {
    const options = this.adminInterface ?
    { params: new HttpParams().set('type', 'admin') } : {};

    return this.http.post<any>(this.authServerRootUri + '/findpass', emailInfo, options);
  }
  loggedIn(user) {
    const authRecord: any = this.emptyAuthRecord();
    if (user && user.accessToken) {
      authRecord.accessToken = user.accessToken;
    }
    if (user && user.refreshToken) {
      authRecord.refreshToken = user.refreshToken;
    }
    if (user && user.displayName) {
      authRecord.displayName = user.displayName;
    }
    if (user && user.userName) {
      authRecord.userName = user.userName;
    }
    if (user && user.expiresIn) {
      authRecord.expiresIn = user.expiresIn * 1000 + Date.now();
    }
    if (user && user.rolep) {
      // change module and resources to lower case
      let rolep = {};
      for (let p in user.rolep) {
        let lp = p.toLowerCase();
        let v = user.rolep[p];

        let mr = {};
        for (let mrp in v.mr) {
          let lmrp = mrp.toLowerCase();
          mr[lmrp] = v.mr[mrp];
        }

        v.mr = mr;

        rolep[lp] = v;
      }
      authRecord.rolep = rolep;
    }
    this.setAuthRecord(authRecord);
    return user;
  }

  logout() {
    // remove user from local storage to log user out
    let authRecord = this.getAuthRecord();
    authRecord.logoutTs = Date.now();
    authRecord.accessToken = '';
    authRecord.refreshToken = '';
    authRecord.rolep = {};
    this.setAuthRecord(authRecord);
  }


  setAdminInterface(isAdminInterface: boolean): void {
    this.adminInterface = isAdminInterface;
    localStorage.setItem('adminInterface', JSON.stringify(isAdminInterface));
  }

  isAdminInterface(): boolean {
    return this.adminInterface;
  }

  setTemporaryToken(token: temporayTokenIntf) {
    this.temporayToken = token;
    this.temporayToken.expiresIn = token.expiresIn * 1000 + Date.now();
  }
  getTemporaryToken(): string {
    if (!this.temporayTokenAllowed) {
      return null;
    }
    if (!this.temporayToken) {
      return null;
    }
    if ( Date.now() > this.temporayToken.expiresIn) {
      return null;
    }
    this.temporayTokenAllowed = false; // only allow once
    return this.temporayToken.token;
  }
  allowTemporayToken() {
    this.temporayTokenAllowed = true;
  }
}
