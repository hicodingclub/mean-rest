import { InjectionToken } from '@angular/core';

export const AUTHENTICATION_SERVER_ROOT_URI = new InjectionToken<string>(
  'AUTHENTICATION_SERVER_ROOT_URI',
  {
    providedIn: 'root',
    factory: () => {
      return '/api/auth';
    },
  },
);
export const AUTHENTICATION_AUTH_PAGE_ROOT_URI = new InjectionToken<string>(
  'AUTHENTICATION_AUTH_PAGE_ROOT_URI',
  {
    providedIn: 'root',
    factory: () => {
      return '/auth';
    },
  },
);
export const AUTHENTICATION_INTERFACES = new InjectionToken(
  'AUTHENTICATION_INTERFACES'
);
export const AUTHENTICATION_DROPDOWN_ITEMS = new InjectionToken<any[]>(
  'AUTHENTICATION_DROPDOWN_ITEMS',
  {
    providedIn: 'root',
    factory: () => {
      return [];
    },
  },
);
export const AUTHENTICATION_LOGIN_PIPELINE = new InjectionToken<string>(
  'AUTHENTICATION_LOGIN_PIPELINE',
  {
    providedIn: 'root',
    factory: () => {
      return undefined;
    },
  },
);
export const AUTHENTICATION_REGISTRATION_PIPELINE = new InjectionToken<string>(
  'AUTHENTICATION_REGISTRATION_PIPELINE',
  {
    providedIn: 'root',
    factory: () => {
      return undefined;
    },
  },
);
export const AUTHENTICATION_REGISTRATION_REQUIRED = new InjectionToken<any>(
  'AUTHENTICATION_REGISTRATION_REQUIRED',
  {
    providedIn: 'root',
    factory: () => {
      return {
        firstName: false,
        lastName: false,
        phone: false,
      };
    },
  },
);
export const AUTHENTICATION_REGISTRATION_DISABLE = new InjectionToken<boolean>(
  'AUTHENTICATION_REGISTRATION_PIPELINE',
  {
    providedIn: 'root',
    factory: () => {
      return false;
    },
  },
);