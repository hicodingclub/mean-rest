import { Input, Directive, ElementRef, OnChanges } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './auth.service'

@Directive({
  selector: '[libMddsUiRoleCheck]'
})
export class MddsUiRoleCheckDirective implements OnChanges {
  @Input() public libMddsUiRoleCheck: string[]; // [module, resource]
  @Input() public rolePermission: string;  // C, R, U, D
  @Input() public uiShow: boolean = true;
  @Input() public removeHiddenUi: boolean = true;

  constructor(
    private elementRef: ElementRef,
    private authService: AuthenticationService) {
      this.authService.authChange().subscribe((changed) => {
        this.roleCheck();
      });
    }

  roleCheck(): void {
    let expectedPermission = 'R';

    let RemoveElement = (element: any) => {
      if (this.removeHiddenUi) {
        // if inside router, this element can be re-initalized
        element.remove();
      } else {
        // if not inside router, can only set display
        element.style.display = 'none';
      }
    }
    let  DoNothing = (element: any) => {
      if (!this.removeHiddenUi) {
        element.style.display = '';
      }
    }
    let SETFUNCTION = DoNothing;
    let UNSETFUNCTION = RemoveElement;
    if (this.uiShow === false) {
      SETFUNCTION = RemoveElement;
      UNSETFUNCTION = DoNothing;
    }

    if (this.rolePermission) {
      expectedPermission = this.rolePermission.toUpperCase();
    }

    const rolep = this.authService.getRolePermissions();
    if (!Array.isArray(this.libMddsUiRoleCheck)) {
      //this.elementRef.nativeElement.style.display = UNSET_DISPLAY;
      UNSETFUNCTION(this.elementRef.nativeElement);
      return;
    }
    const module = (this.libMddsUiRoleCheck[0] || '').toLowerCase();
    const resource = (this.libMddsUiRoleCheck[1] || '').toLowerCase();

    if (!module || !rolep[module]) {
      UNSETFUNCTION(this.elementRef.nativeElement);
      return;
    }
    let resourcepermission = '';
    if (rolep[module].mr && resource && rolep[module].mr[resource]) {
      resourcepermission = rolep[module].mr[resource];
    }
    const givenPermission = resourcepermission || rolep[module].mp || '';
    if (givenPermission.toUpperCase().includes(expectedPermission)) {
      // this.elementRef.nativeElement.style.display = SET_DISPLAY;
      SETFUNCTION(this.elementRef.nativeElement);
      return;
    }
    UNSETFUNCTION(this.elementRef.nativeElement);
  }

  ngOnChanges() {
    this.roleCheck();
  }
}
