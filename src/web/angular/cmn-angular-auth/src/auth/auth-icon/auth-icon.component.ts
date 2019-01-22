import { Component, OnInit, Inject  } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../auth.service';

import { AUTHTICATION_LOGIN_PAGE_URI } from '../tokens';

@Component({
    selector: 'app-auth-icon',
    templateUrl: 'auth-icon.component.html',
    styleUrls: ['auth-icon.component.css']
})
export class AuthIconComponent implements OnInit {
  public popup = false;
  public popupStyle: any = {};
  public userName = 'Please login';
  public userNameShort = 'Please login';

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    @Inject(AUTHTICATION_LOGIN_PAGE_URI) private loginPageUri: string) { }

  ngOnInit() {
    this.isAuthorized();
  }

  public toggle(event) {
    if (!this.popup) {
      const right = (window.innerWidth - event.x) - 2;
      const top = event.y + 15;

      this.popupStyle = {
        'right': right.toString() + 'px',
        'top': top.toString() + 'px',
      };
    }
    this.popup = !this.popup;
  }

  public closePopup() {
    this.popup = false;
  }

  public isAuthorized() {
    const name = this.authService.getUserName();
    const isAuth = this.authService.isAuthorized();
    if (name) {
        this.userName = name;
        if (isAuth) {
          if (name.length > 12) {
            this.userNameShort = name.substring(0, 10) + '...';
          } else {
            this.userNameShort = name.substring(0, 13);
          }
        } else {
          this.userNameShort = 'Please login';
        }
    }
    return isAuth;
  }

  public login() {
    // not logged in so redirect to login page with the return url
    const state: RouterStateSnapshot = this.router.routerState.snapshot;
    this.authService.setInterruptedUrl(state.url);
    this.popup = false;
    this.router.navigate([this.loginPageUri]);
  }

  public logout() {
    // not logged in so redirect to login page with the return url
    this.authService.logout();
    this.popup = false;
    this.router.navigated = false; // refresh current page;
    this.router.navigate(['/']); // home page
  }
}
