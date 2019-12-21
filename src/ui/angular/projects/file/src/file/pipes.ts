import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({ name: 'SafeUrlPipe'})
export class SafeUrlPipe implements PipeTransform  {
  constructor(private sanitized: DomSanitizer) {}
  transform(value: string) {
    if (value && value.startsWith('data:')) {
      return this.sanitized.bypassSecurityTrustResourceUrl(value);
    }
    return value;
  }
}