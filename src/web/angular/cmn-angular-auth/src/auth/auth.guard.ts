import { Injectable, Inject } from '@angular/core';
import { Router, CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './auth.service';
import { AUTHTICATION_LOGIN_PAGE_URI } from './tokens';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private authService: AuthenticationService,
    @Inject(AUTHTICATION_LOGIN_PAGE_URI) private loginPageUri: string) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isAuthorized()) {
      // logged in so return true
      return true;
    }

    // not logged in so redirect to login page with the return url
    this.authService.setInterruptedUrl(state.url);
    this.router.navigate([this.loginPageUri]);
    return false;
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
