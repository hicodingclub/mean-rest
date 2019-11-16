"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var COMPONENT_CACHE_DURATION = 30 * 1000;
var MraRouteReuseStrategy = /** @class */ (function () {
    function MraRouteReuseStrategy() {
        this.detachedRouteHandles = {}; //key is url, and value is at [handle, timestamp] format
        this.pageYOffset = {};
        this.editItems = {};
        this.isAuth = false;
    }
    /* Start: The following should use the authService. But let's decouple dependency now */
    MraRouteReuseStrategy.prototype.isAuthorized = function () {
        //Refer to AuthenticationService for this function.
        var authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
        if (authRecord && authRecord.accessToken) {
            return true;
        }
        return false;
    };
    MraRouteReuseStrategy.prototype.getLogoutTime = function () {
        var authRecord = JSON.parse(localStorage.getItem('mdds-auth-record'));
        if (authRecord) {
            return authRecord.logoutTs;
        }
        return 0;
    };
    /* End */
    MraRouteReuseStrategy.prototype.isLogoutReload = function () {
        if (this.isAuthorized()) {
            return false;
        }
        var currentTs = Date.now();
        var logoutTs = this.getLogoutTime();
        if (currentTs - logoutTs < 1000) {
            return true;
        }
        return false;
    };
    MraRouteReuseStrategy.prototype.checkAuthentication = function () {
        var auth = this.isAuth;
        this.isAuth = this.isAuthorized();
        if (this.isAuth != auth) {
            // authentication status changed. Not attach;
            this.detachedRouteHandles = {}; // empty the map
        }
    };
    /** Determines if this route (and its subtree) should be detached to be reused later */
    MraRouteReuseStrategy.prototype.shouldDetach = function (route) {
        if (route.routeConfig && route.routeConfig.path === 'list') {
            //save current scroll position
            var key = route['_routerState'].url;
            this.pageYOffset[key] = window.pageYOffset;
        }
        return route.routeConfig.path === 'list';
    };
    /** Stores the detached route */
    MraRouteReuseStrategy.prototype.store = function (route, handle) {
        var date = new Date();
        var key = route['_routerState'].url;
        if (!handle)
            return;
        this.detachedRouteHandles[key] = [handle, date.getTime()];
    };
    /** Determines if this route (and its subtree) should be reattached */
    MraRouteReuseStrategy.prototype.shouldAttach = function (route) {
        this.checkAuthentication();
        var date = new Date();
        var key = route['_routerState'].url;
        if (route.routeConfig && (route.routeConfig.path === 'new' || route.routeConfig.path === 'edit/:id')) {
            if (route.data && route.data.item) {
                this.editItems[route.data.item] = true;
            }
        }
        if (!route.routeConfig || route.routeConfig.path !== 'list') {
            return false;
        }
        if (!this.detachedRouteHandles[key]) {
            return false;
        }
        if (date.getTime() - this.detachedRouteHandles[key][1] > COMPONENT_CACHE_DURATION)
            return false;
        return true;
    };
    /** Retrieves the previously stored route */
    MraRouteReuseStrategy.prototype.retrieve = function (route) {
        var date = new Date();
        var key = route['_routerState'].url;
        if (!route.routeConfig || route.routeConfig.path !== 'list')
            return null;
        if (route.data.item && (route.data.item in this.editItems)) {
            delete this.editItems[route.data.item];
            delete this.detachedRouteHandles[key];
            return null;
        }
        if (!this.detachedRouteHandles[key])
            return null;
        if (date.getTime() - this.detachedRouteHandles[key][1] > COMPONENT_CACHE_DURATION)
            return null;
        var yOffset = this.pageYOffset[key];
        setTimeout(function () {
            console.log("==retrieve: ", key, yOffset);
            window.scrollTo(0, yOffset);
        }, 20); //scroll to saved position
        return this.detachedRouteHandles[key][0];
    };
    /** Determines if a route should be reused */
    MraRouteReuseStrategy.prototype.shouldReuseRoute = function (future, curr) {
        // Below is the default implementation;
        if (this.isLogoutReload()) {
            return false; // authentication status changed. Don't reuse.
        }
        return future.routeConfig === curr.routeConfig;
    };
    return MraRouteReuseStrategy;
}());
exports.MraRouteReuseStrategy = MraRouteReuseStrategy;
