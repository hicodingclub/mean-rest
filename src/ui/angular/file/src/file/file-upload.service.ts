import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';

import { FILE_UPLOAD_URI } from './tokens';

export interface uploadStatus {
  [key: string]: {
    progress: Observable<number>,
    result: {success: boolean, value: any}
  }
}
@Injectable()
export class MddsFileUploadService {
  constructor(
    @Inject(FILE_UPLOAD_URI) private fileUploadUrl: string,
    private http: HttpClient) {}

  public upload(files: Set<File>, groupName): uploadStatus {    
    // this will be the our resulting map
    const status: uploadStatus = {};
    files.forEach(file => {
      const nameStructure = {
        group: groupName,
        name: file.name,
      };
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', file, JSON.stringify(nameStructure));

      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST', this.fileUploadUrl, formData, {
        reportProgress: true
      });

      // create a new progress-subject for every file
      const progress = new Subject<number>();
      const result = {success: false, value: null};
      // send the http-request and subscribe for progress-updates
      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {

          // calculate the progress percentage
          const percentDone = Math.round(100 * event.loaded / event.total);

          // pass the percentage into the progress-stream
          progress.next(percentDone);
        } else if (event instanceof HttpResponse) {

          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          result.success = true;
          result.value = event.body;
          progress.complete();
        } else {
          // other events
        }
      }, err => {
        result.success = false;
        if (event instanceof HttpErrorResponse) {
          result.value = event.error;
        }
        progress.complete();
      }, () => {
        // complete
      });

      // Save every progress-observable in a map of all observables
      status[file.name] = {
        progress: progress.asObservable(),
        result: result,
      };
    });

    // return the map of progress.observables
    return status;    
  }
}