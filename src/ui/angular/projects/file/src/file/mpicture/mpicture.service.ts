import {
  Injectable,
  Inject,
  OnDestroy,
  SkipSelf
} from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';
import {
  MpictureBaseService
} from './mpicture.base.service';
import {
  FILE_MANAGE_ROOT_URI
} from '../tokens';
@Injectable({
  providedIn: 'root',
})
export class MpictureService extends MpictureBaseService implements OnDestroy {
  constructor(http: HttpClient, @Inject(FILE_MANAGE_ROOT_URI) private fileServerRootUri: string) {
    super(http, fileServerRootUri);
  }
  ngOnDestroy() {}
}
