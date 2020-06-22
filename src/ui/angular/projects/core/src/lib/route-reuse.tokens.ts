import { InjectionToken, Inject } from '@angular/core';

export const MDDS_ROUTE_REUSE_RUIs = new InjectionToken<Array<string>>(
    'MDDS_ROUTE_REUSE_RUIs',
    {
        providedIn: 'root',
        factory: () => {
            return ['/'];
        },
    },
);