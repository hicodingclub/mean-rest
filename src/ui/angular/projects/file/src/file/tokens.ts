import { InjectionToken } from '@angular/core';

export const FILE_UPLOAD_URI = new InjectionToken<string>(
    'FILE_UPLOAD_URI',
    {
        providedIn: 'root',
        factory: () => {
            return '/api/files/upload';
        },
    },
);
export const FILE_DOWNLOAD_URI = new InjectionToken<string>(
    'FILE_DOWNLOAD_URI',
    {
        providedIn: 'root',
        factory: () => {
            return '/api/files/download';
        },
    },
);
export const FILE_MANAGE_ROOT_URI = new InjectionToken<string>(
    'FILE_MANAGE_ROOT_URI',
    {
        providedIn: 'root',
        factory: () => {
            return '/api/files';
        },
    },
);
