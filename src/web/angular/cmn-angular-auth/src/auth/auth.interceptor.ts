import { Injectable, Inject } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { tap, catchError, switchMap, filter, take } from 'rxjs/operators';

import { AuthenticationService } from './auth.service';
import { AUTHTICATION_LOGIN_PAGE_URI } from './tokens';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  // Refresh Token Subject tracks the current token, or is null if no token is currently
  // available (e.g. refresh pending).
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    @Inject(AUTHTICATION_LOGIN_PAGE_URI) private loginPageUri: string
    ) {}

  addAuthHeader(request) {
    if (this.authService.isAuthorized()) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`
        }
      });
    }
    return request;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addAuthHeader(request))
      .pipe(
        /*
        tap((event: HttpEvent<any>) => {
	        if (event instanceof HttpResponse) {
	          ;
	        }
	      }, (err: any) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status === 401) {
                this.authService.setInterruptedUrl(this.router.url);
                this.router.navigate([this.loginPageUri]);
              }
            }
        })
        */
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            if (this.refreshTokenInProgress && !this.authService.verifyTokenRequest(request.url)) {
                // If refreshTokenInProgress is true, we will wait until refreshTokenSubject has a non-null value
                // – which means the new token is ready and we can retry the request again
                return this.refreshTokenSubject.pipe(
                    filter(result => result !== null),
                    take(1),
                    switchMap(() => next.handle(this.addAuthHeader(request)))
                );

            } else {
                this.refreshTokenInProgress = true;
                // Set the refreshTokenSubject to null so that subsequent API calls will wait until the new token has been retrieved
                this.refreshTokenSubject.next(null);
                return this.authService.refreshToken().pipe(
                        switchMap((data) => {
                            this.refreshTokenInProgress = false;
                            this.refreshTokenSubject.next(data);
                            return next.handle(this.addAuthHeader(request));
                        }),
                        catchError((err) => {
                            // looks like this part will not hit
                            this.refreshTokenInProgress = false;
                            this.authService.setInterruptedUrl(this.router.url);
                            this.router.navigate([this.loginPageUri]);
                            return EMPTY;
                        })
                );
            }
          }
          if (this.authService.verifyTokenRequest(request.url)) {
            // refreshToken failed. Go to login page.
            this.refreshTokenInProgress = false;
            this.authService.setInterruptedUrl(this.router.url);
            this.router.navigate([this.loginPageUri]);
          }
          return throwError(error);
        })
    );
  }
}
