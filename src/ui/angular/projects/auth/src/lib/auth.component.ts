﻿import { Component, Inject } from '@angular/core';
import { AuthenticationService } from './auth.service';
import { AUTHENTICATION_INTERFACES } from './tokens';

@Component({
    selector: 'lib-auth',
    templateUrl: 'auth.component.html'
})

export class AuthenticationComponent {
    adminInterface = false;
    userIntEnabled = false;
    adminIntEnabled = false;

    constructor(
        private authenticationService: AuthenticationService,
        @Inject(AUTHENTICATION_INTERFACES) private authenticationInterfaces: string
        ) {

      const str = authenticationInterfaces.toLowerCase();
      if (str.includes('user') && str.includes('admin') ) {// both interface. Check cached.
        this.adminInterface = authenticationService.isAdminInterface();
        this.userIntEnabled = true;
        this.adminIntEnabled = true;
      } else if (str.includes('admin')) { // administrator only
        this.authenticationService.setAdminInterface(true);
        this.adminIntEnabled = true;
      } else { // users only
        this.authenticationService.setAdminInterface(false);
        this.userIntEnabled = true;
      }
    }

    setAdminInterface(adminInterface: boolean): void {
      this.adminInterface = adminInterface;
      this.authenticationService.setAdminInterface(this.adminInterface);
    }
}
