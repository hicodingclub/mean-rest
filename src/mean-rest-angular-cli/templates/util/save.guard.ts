import { CanDeactivate } from '@angular/router';
import { CanDeactivateComponent } from './app/can-deactivate';

export class ConfirmDeactivateGuard implements CanDeactivate<CanDeactivateComponent> {

  canDeactivate(toBeDeactivated: CanDeactivateComponent) {
    if(toBeDeactivated.hasChanges()){
        return window.confirm('Do you really want to go?');
    }
    return true;
  }
}