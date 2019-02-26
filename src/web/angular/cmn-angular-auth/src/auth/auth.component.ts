import { Component, Inject } from '@angular/core';
import { AuthenticationService } from './auth.service';
import { AUTHTICATION_INTERFACES } from './tokens';

@Component({
    selector: 'app-auth',
    templateUrl: 'auth.component.html'
})

export class AuthenticationComponent {
    adminInterface: boolean = false;
    userIntEnabled: boolean = false;
    adminIntEnabled: boolean = false;

    constructor(
        private authenticationService: AuthenticationService,
        @Inject(AUTHTICATION_INTERFACES) private authenticationInterfaces: string
        ) {
      
      let str = authenticationInterfaces.toLowerCase();
      if (str.includes("user") && str.includes("admin") ) {//both interface. Check cached.
        this.adminInterface = authenticationService.isAdminInterface();
        this.userIntEnabled = true;
        this.adminIntEnabled = true;
      } else if (str.includes("administrator")) { //administrator only
        this.authenticationService.setAdminInterface(true);
        this.adminIntEnabled = true;
      } else { //users only
        this.authenticationService.setAdminInterface(false);
        this.userIntEnabled = true;
      }
    }
  
    setAdminInterface(adminInterface: boolean): void {
      this.adminInterface = adminInterface;
      this.authenticationService.setAdminInterface(this.adminInterface);
    }
}