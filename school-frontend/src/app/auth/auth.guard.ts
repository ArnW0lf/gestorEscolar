import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if user is logged in using the synchronous method first for immediate feedback
    if (this.authService.isLoggedIn()) {
        // Optionally, check for roles if route.data.expectedRole is provided
        const expectedRole = route.data && route.data['expectedRole'];
        if (expectedRole) {
            const userRole = this.authService.getUserRole();
            if (userRole === expectedRole) {
                return true;
            } else {
                // Role not authorized, redirect to an unauthorized page or home
                console.warn(`User role '${userRole}' not authorized for route requiring '${expectedRole}'`);
                this.router.navigate(['/home']); // Or an '/unauthorized' page
                return false;
            }
        }
        return true; // No specific role required, just authentication
    }

    // If not logged in synchronously, check the observable (might be redundant if isLoggedIn is comprehensive)
    // For robustness, you might rely more on the observable if there are async checks in isLoggedIn
    // However, for typical token-based auth, isLoggedIn should be sufficient.

    // If not logged in, redirect to login page
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
