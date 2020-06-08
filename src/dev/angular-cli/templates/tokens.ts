import { InjectionToken } from '@angular/core';

import { <%-moduleName%>_server_root_uri } from '../<%-moduleName%>-cust/<%-moduleName%>.tokens.value';

export const <%-ModuleName%>_SERVER_ROOT_URI = new InjectionToken<string>(
    '<%-ModuleName%>_SERVER_ROOT_URI',
    {
        factory: (): string => <%-moduleName%>_server_root_uri,
        providedIn: 'root',
    },
);