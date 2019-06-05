Augular Authentication and Authorization Module

Usage:
1. Add 'mdds-angular-auth" package as dependency in your project in file package.json:

For example:

  "dependencies": {
    "@angular/common": "^6.0.3",
    "@angular/core": "^6.0.3",
    "@angular/forms": "^6.0.3",
    "@angular/http": "^6.0.3",
    "@angular/router": "^6.0.3",
    "rxjs": "^6.0.0",
    "zone.js": "^0.8.26",
    ...
    ...
    "mdds-angular-auth": "<version>"
  },

2. Create a auth.config.ts to add the following two configuration variables required by 'mdds-angular-auth' logic:

export const authentication_login_page_uri: string = '/auth/login';
export const authentication_server_root_uri: string = '/api/auth';


3. Declare two providers in your app.module.ts:

  import { AUTHTICATION_LOGIN_PAGE_URI, AUTHTICATION_SERVER_ROOT_URI } from 'mdds-angular-auth';
  import { authentication_login_page_uri, authentication_server_root_uri } from './auth.config';
  ...
  @NgModule(
  ...
  providers: [
    ...
    { provide: AUTHTICATION_LOGIN_PAGE_URI, useValue: authentication_login_page_uri },
    { provide: AUTHTICATION_SERVER_ROOT_URI, useValue: authentication_server_root_uri }

  ]
  ...

4. Import 'AuthenticationModule' in app.module.ts:

  import { AuthenticationModule } from 'mdds-angular-auth';
  ...

  @NgModule(
  ...
  imports: [
    ...
    AuthenticationModule
  ],
  ...

5. Use AuthGuard to application routers:

  import {AuthGuard} from 'mdds-angular-auth';
  ...
  routes: Routes = [
    {
      path: 'path/to/guard', 
      component: ComponentToGuard,
      canActivate: [AuthGuard],
    }
    ... 
  ]
  ...

6. Use the authenticaiton icon in your HTML:

  app.component.html

  <div class="header">
    ...
    <div style="display: inline-block; width: 6rem" align="center">
        <app-auth-icon></app-auth-icon>
    </div>
  </div>
