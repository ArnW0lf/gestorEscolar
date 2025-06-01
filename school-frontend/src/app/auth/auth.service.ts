import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; // Corrected import

interface AuthResponse {
  access: string;
  refresh: string;
  user?: any; // Adjust based on your backend response
}

interface DecodedToken {
  exp: number;
  user_id: number;
  role: string; // Assuming role is part of the token
  // Add other properties your token might have
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/token/'; // Replace with your actual backend token URL
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this._isAuthenticated.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
          this._isAuthenticated.next(true);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          this._isAuthenticated.next(false);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResponse.access);
    if (authResponse.refresh) {
      localStorage.setItem(this.refreshTokenKey, authResponse.refresh);
    }
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      const isExpired = decodedToken.exp < (Date.now() / 1000);
      if(isExpired) {
        this.logout(); // Or attempt refresh token logic here
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error decoding token:", error);
      this.logout(); // Token is invalid or malformed
      return false;
    }
  }

  public getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        return decodedToken.role || null; // Assuming 'role' is a claim in your JWT
      } catch (error) {
        console.error("Error decoding token for role:", error);
        return null;
      }
    }
    return null;
  }
}
