import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router'

const COMPONENT_CACHE_DURATION = 30 * 1000;
export class MraRouteReuseStrategy implements RouteReuseStrategy {

    detachedRouteHandles: { [key: string]: any[] } = {}; //key is url, and value is at [handle, timestamp] format
    pageYOffset = {};
    editItems = {};

    /** Determines if this route (and its subtree) should be detached to be reused later */
    public shouldDetach(route: ActivatedRouteSnapshot): boolean {
        if (route.routeConfig && route.routeConfig.path === 'list') {
            //save current scroll position
            let key = route['_routerState'].url;
            this.pageYOffset[key] = window.pageYOffset;
        }
        return route.routeConfig.path === 'list';
    }

    /** Stores the detached route */
    public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let date = new Date();
        let key = route['_routerState'].url;
        if (!handle) return;
        this.detachedRouteHandles[key] = [handle, date.getTime()]
    }

    /** Determines if this route (and its subtree) should be reattached */
    public shouldAttach(route: ActivatedRouteSnapshot): boolean {
        let date = new Date();
        let key = route['_routerState'].url;
        if (route.routeConfig && (route.routeConfig.path === 'new' || route.routeConfig.path === 'edit/:id')) {
            if (route.data && route.data.item) this.editItems[route.data.item] = true;
        }
        if (!route.routeConfig || route.routeConfig.path !== 'list') return false;
        if (!this.detachedRouteHandles[key]) return false;
        if (date.getTime() - this.detachedRouteHandles[key][1]  > COMPONENT_CACHE_DURATION)  return false;
        return true;
    }

    /** Retrieves the previously stored route */
    public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        let date = new Date();
        let key = route['_routerState'].url;
        if (!route.routeConfig || route.routeConfig.path !== 'list') return null;
        if (route.data.item && (route.data.item in this.editItems)) {
            delete this.editItems[route.data.item];
            delete this.detachedRouteHandles[key];
            return null;
        }
        if (!this.detachedRouteHandles[key]) return null;
        if (date.getTime() - this.detachedRouteHandles[key][1]  > COMPONENT_CACHE_DURATION) return null;
        
        let yOffset = this.pageYOffset[key];
        setTimeout(function () {
                console.log("==retrieve: ", key, yOffset);
                window.scrollTo(0, yOffset);
            }, 20); //scroll to saved position
        
        return this.detachedRouteHandles[key][0];
    }

    /** Determines if a route should be reused */
    public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // Below is the default implementation;
        return future.routeConfig === curr.routeConfig
    }
}
