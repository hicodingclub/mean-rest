import { Input, Directive, ElementRef, OnChanges } from '@angular/core';
import { AuthenticationService } from './auth.service'

@Directive({
  selector: '[libMddsUiRoleCheck]'
})
export class MddsUiRoleCheckDirective implements OnChanges {
  @Input() public libMddsUiRoleCheck: string[];
  @Input() public libMddsUiRolePerm: string;

  constructor(
    private elementRef: ElementRef,
    private authService: AuthenticationService) {
      this.authService.authChange().subscribe((changed) => {
        this.roleCheck();
      });
    }

  roleCheck(): void {
    let expectedPermission = 'R';

    if (this.libMddsUiRolePerm) {
      expectedPermission = this.libMddsUiRolePerm.toUpperCase();
    }

    const rolep = this.authService.getRolePermissions();
    if (!Array.isArray(this.libMddsUiRoleCheck)) {
      this.elementRef.nativeElement.style.display = 'none';
      return;
    }
    const module = (this.libMddsUiRoleCheck[0] || '').toLowerCase();
    const resource = (this.libMddsUiRoleCheck[1] || '').toLowerCase();

    if (!module || !rolep[module]) {
      this.elementRef.nativeElement.style.display = 'none';
      return;
    }
    let resourcepermission = '';
    if (rolep[module].mr && resource && rolep[module].mr[resource]) {
      resourcepermission = rolep[module].mr[resource];
    }
    const givenPermission = resourcepermission || rolep[module].mp || '';
    if (givenPermission.toUpperCase().includes(expectedPermission)) {
      this.elementRef.nativeElement.style.display = '';
      return;
    }
    this.elementRef.nativeElement.style.display = 'none';
  }

  ngOnChanges() {
    this.roleCheck();
  }
}
