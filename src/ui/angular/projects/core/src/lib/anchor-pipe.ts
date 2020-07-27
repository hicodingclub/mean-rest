
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'mddsAnchor'})
export class MddsAnchorPipe implements PipeTransform {
  transform(
    value: string | boolean | number,
    urlTemplate: string,
    displayTemplate: string,
  ) {
    const url  = urlTemplate.replace('[REPLACEME]', `${value}`);
    const display = displayTemplate.replace('[REPLACEME]', `${value}`);
    return `<a href="${url}">${display}</a>`;
  }
}