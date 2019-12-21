/*
 * Public API Surface of auth
 */

export {
    AUTHENTICATION_SERVER_ROOT_URI,
    AUTHENTICATION_AUTH_PAGE_ROOT_URI,
    AUTHENTICATION_INTERFACES,
    AUTHENTICATION_DROPDOWN_ITEMS,
    AUTHENTICATION_LOGIN_PIPELINE,
 } from './lib/tokens';

export { AuthGuard } from './lib/auth.guard';
export { AuthenticationService } from './lib/auth.service';
export { AuthenticationModule } from './lib/auth.module';
export { DropdownItem } from './lib/auth-icon/dropdown-item';
