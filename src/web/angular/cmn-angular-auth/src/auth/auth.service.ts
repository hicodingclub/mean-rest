import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, filter, retry } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Router, NavigationEnd  } from '@angular/router';

import { AUTHTICATION_SERVER_ROOT_URI } from './tokens';

@Injectable()
export class AuthenticationService {

  private interruptedUrl: string;
  private routedFromUrl: string;

  private previousUrl: string;
  private currentUrl: string;
  private navigateEndTime: number;

  constructor(
            @Inject(AUTHTICATION_SERVER_ROOT_URI) private authServerRootUri: string,
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
  }

  isAuthorized(): boolean {
    const authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (authRecord && authRecord['accessToken']) {
      return true;
    }
    return false;
  }

  private getLogoutTime(): number {
    const authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (authRecord && 'logoutTs' in authRecord) {
        return authRecord.logoutTs;
    }
    return 0;
  }

  public getAccessToken(): string {
    const authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (authRecord) {
      return authRecord['accessToken'];
    }
    return null;
  }

  public refreshToken(): Observable<any> {
    let authRecord: any = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (!authRecord) {
      authRecord = {refreshToken: '', userName: ''};
    }
    const refreshToken: string = authRecord['refreshToken'];
    const userName: string = authRecord['userName'];

    return this.http.post<any>(
        this.authServerRootUri + '/refresh',
        {refreshToken: refreshToken, userName: userName}
      ).pipe(
        map(this.loggedIn),
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

  public getUserName(): string {
    let authRecord: any = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (!authRecord) {
      authRecord = {userName: ''};
    }
    return authRecord['userName'];
  }

  login(userName: string, password: string) {
    const authRecord: any = {
      userName: userName,
      accessToken: '',
      refreshToken: '',
      displayName: ''
    };
    localStorage.setItem('mdds-auth-record', JSON.stringify(authRecord));

    return this.http.post<any>(this.authServerRootUri + '/login',
        { username: userName, password: password }
      ).pipe(map(this.loggedIn));
  }

  register(userInfo: any) {
    localStorage.removeItem('mdds-auth-record');
    const authRecord: any = {
      userName: userInfo.userName,
      accessToken: '',
      refreshToken: '',
      displayName: userInfo.displayName
    };
    localStorage.setItem('mdds-auth-record', JSON.stringify(authRecord));
    return this.http.post<any>(this.authServerRootUri + '/register', userInfo);
  }

  loggedIn(user) {
    const authRecord: any = {
      userName: '',
      accessToken: '',
      refreshToken: '',
      displayName: ''
    };
    if (user && user.accessToken) {
      authRecord['accessToken'] = user.accessToken;
    }
    if (user && user.refreshToken) {
      authRecord['refreshToken'] = user.refreshToken;
    }
    if (user && user.displayName) {
      authRecord['displayName'] = user.displayName;
    }
    if (user && user.userName) {
      authRecord['userName'] = user.userName;
    }
    localStorage.setItem('mdds-auth-record', JSON.stringify(authRecord));
    return user;
  }

  logout() {
    // remove user from local storage to log user out
    let authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
    if (!authRecord) {
        authRecord = {};
    }
    authRecord.logoutTs = Date.now();
    authRecord.accessToken = '';
    authRecord.refreshToken = '';
    localStorage.setItem('mdds-auth-record', JSON.stringify(authRecord));
  }
}
