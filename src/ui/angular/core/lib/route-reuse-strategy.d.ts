import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
export declare class MraRouteReuseStrategy implements RouteReuseStrategy {
    detachedRouteHandles: {
        [key: string]: any[];
    };
    pageYOffset: {};
    editItems: {};
    isAuth: boolean;
    private isAuthorized;
    private getLogoutTime;
    private isLogoutReload;
    private checkAuthentication;
    /** Determines if this route (and its subtree) should be detached to be reused later */
    shouldDetach(route: ActivatedRouteSnapshot): boolean;
    /** Stores the detached route */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void;
    /** Determines if this route (and its subtree) should be reattached */
    shouldAttach(route: ActivatedRouteSnapshot): boolean;
    /** Retrieves the previously stored route */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle;
    /** Determines if a route should be reused */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean;
}
