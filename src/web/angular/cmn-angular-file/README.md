Augular Authentication and Authorization Module

Usage:
1. Add 'mdds-angular-file" package as dependency in your project in file package.json:

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
    "mdds-angular-file": "<version>"
  },

2. Create a file-upload.config.ts to add the following two configuration variables required by 'mdds-angular-file' logic:

export const file_upload_uri: string = '/api/files/upload';
export const file_download_uri: string = '/api/files/download';


3. Declare two providers in your app.module.ts:

  import { FILE_UPLOAD_URI, FILE_DOWNLOAD_URI } from 'mdds-angular-file';
  import { file_upload_uri, file_download_uri } from './file-upload.config';
  ...
  @NgModule(
  ...
  providers: [
    ...
    { provide: FILE_UPLOAD_URI, useValue: file_upload_uri },
    { provide: FILE_DOWNLOAD_URI, useValue: file_download_uri }

  ]
  ...

4. Import 'FileUploadModule' in app.module.ts:

  import { FileUploadModule } from 'mdds-angular-file';
  ...

  @NgModule(
  ...
  imports: [
    ...
    FileUploadModule
  ],
  ...

5. Use the file upload cmoponent in your HTML:

  app.component.html

  <div>
    ...
    <div style="display: inline-block; width: 80%;" >
        <file-upload [(downloadUrl)]="fileUrl"></file-upload>
    </div>
  </div>
