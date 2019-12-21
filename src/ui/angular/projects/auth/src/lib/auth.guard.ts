import { Injectable, Inject } from '@angular/core';
import { Router, CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './auth.service';
import { AUTHENTICATION_AUTH_PAGE_ROOT_URI } from './tokens';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private authService: AuthenticationService,
    @Inject(AUTHENTICATION_AUTH_PAGE_ROOT_URI) private authPageRootUri: string) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isAuthorized()) {
      // logged in so return true
      return true;
    }

    this.authPageRootUri = this.authPageRootUri.replace(/\/$/, ''); // remove trailing slash
    const loginPageUri = this.authPageRootUri + '/login';

    // not logged in so redirect to login page with the return url
    this.authService.setInterruptedUrl(state.url);
    this.router.navigate([loginPageUri]);
    return false;
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
