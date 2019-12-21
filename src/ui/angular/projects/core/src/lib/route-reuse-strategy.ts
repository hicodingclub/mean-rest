import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router'

const COMPONENT_CACHE_DURATION = 30 * 1000;

function getResolvedUrl(route: ActivatedRouteSnapshot): string {
    return route.pathFromRoot
        .map(v => v.url.map(segment => segment.toString()).join('/'))
        .join('/');
}

export class MddsRouteReuseStrategy implements RouteReuseStrategy {

    detachedRouteHandles: { [key: string]: any[] } = {}; // key is url, and value is at [handle, timestamp] format
    pageYOffset = {};
    editItems = {};
    isAuth = false;

    /* Start: The following should use the authService. But let's decouple dependency now */
    private isAuthorized(): boolean {
        // Refer to AuthenticationService for this function.
        const authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
        if (authRecord && authRecord.accessToken ) {return true;}
        return false;
    }
    private getLogoutTime(): number {
        const authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
        if (authRecord) {
            return authRecord.logoutTs;
        }
        return 0;
    }
    /* End */

    private isLogoutReload(): boolean {
        if (this.isAuthorized()) {
            return false;
        }
        const currentTs = Date.now();
        const logoutTs = this.getLogoutTime();
        if (currentTs - logoutTs < 1000) {
            return true;
        }
        return false;
    }

    private checkAuthentication() {
        const auth = this.isAuth;
        this.isAuth = this.isAuthorized();
        if (this.isAuth !== auth) {
            // authentication status changed. Not attach;
            this.detachedRouteHandles = {}; // empty the map
        }
    }

    /** Determines if this route (and its subtree) should be detached to be reused later */
    public shouldDetach(route: ActivatedRouteSnapshot): boolean {
        if (route.routeConfig && route.routeConfig.path === 'list') {
            // save current scroll position
            const key = getResolvedUrl(route);
            this.pageYOffset[key] = window.pageYOffset;
        }
        return route.routeConfig.path === 'list';
    }

    /** Stores the detached route */
    public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        const date = new Date();
        const key = getResolvedUrl(route);
        if (!handle) { return; }
        this.detachedRouteHandles[key] = [handle, date.getTime()]
    }

    /** Determines if this route (and its subtree) should be reattached */
    public shouldAttach(route: ActivatedRouteSnapshot): boolean {
        this.checkAuthentication();
        const date = new Date();
        const key = getResolvedUrl(route);
        if (route.routeConfig && (route.routeConfig.path === 'new' || route.routeConfig.path === 'edit/:id')) {
            if (route.data && route.data.item) {
                this.editItems[route.data.item] = true;
            }
        }
        if (!route.routeConfig || route.routeConfig.path !== 'list') {  return false; }
        if (!this.detachedRouteHandles[key]) { return false; }
        if (date.getTime() - this.detachedRouteHandles[key][1]  > COMPONENT_CACHE_DURATION) {
            return false; 
        }
        return true;
    }

    /** Retrieves the previously stored route */
    public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        const date = new Date();
        const key = getResolvedUrl(route);
        if (!route.routeConfig || route.routeConfig.path !== 'list') {
            return null;
        }
        if (route.data.item && (route.data.item in this.editItems)) {
            delete this.editItems[route.data.item];
            delete this.detachedRouteHandles[key];
            return null;
        }
        if (!this.detachedRouteHandles[key]) { return null; }
        if (date.getTime() - this.detachedRouteHandles[key][1]  > COMPONENT_CACHE_DURATION) { return null; }

        const yOffset = this.pageYOffset[key];
        setTimeout(() => {
                window.scrollTo(0, yOffset);
            }, 20); // scroll to saved position

        return this.detachedRouteHandles[key][0];
    }

    /** Determines if a route should be reused */
    public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // Below is the default implementation;
        if (this.isLogoutReload()) {
            return false; // authentication status changed. Don't reuse.
        }
        return future.routeConfig === curr.routeConfig;
    }
}
