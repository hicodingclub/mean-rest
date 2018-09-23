import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router'

export class MraRouteReuseStrategy implements RouteReuseStrategy {

    detachedRouteHandles: { [key: string]: DetachedRouteHandle } = {}

    /** Determines if this route (and its subtree) should be detached to be reused later */
    public shouldDetach(route: ActivatedRouteSnapshot): boolean {
        var date = new Date();
        console.log("==shouldDetach: ", date.getTime(), route, route['_routerState']);
        return route.routeConfig.path === 'list';
    }

    /** Stores the detached route */
    public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        var date = new Date();
        console.log("==store: ", date.getTime(), route, route['_routerState']);
        let key = route['_routerState'].url;
        if (!handle) return;
        this.detachedRouteHandles[key] = handle
    }

    /** Determines if this route (and its subtree) should be reattached */
    public shouldAttach(route: ActivatedRouteSnapshot): boolean {
        var date = new Date();
        console.log("==shouldAttach: ", date.getTime(), route, route['_routerState']);
        let key = route['_routerState'].url;
        return route.routeConfig.path === 'list' && !!this.detachedRouteHandles[key];
    }

    /** Retrieves the previously stored route */
    public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        var date = new Date();
        console.log("==retrieve: ", date.getTime(), route, route['_routerState']);
        if (!route.routeConfig || route.routeConfig.path !== 'list') {
            return null
        }
        let key = route['_routerState'].url;
        return this.detachedRouteHandles[key]
    }

    /** Determines if a route should be reused */
    //future: to be created page; curr: existing page.
    public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // Below is the default implementation;
        return future.routeConfig === curr.routeConfig
    }
}
