import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

interface AuthResponse {
  access: string;
  refresh: string;
  user?: any;
}

interface DecodedToken {
  exp: number;
  user_id: number;
  role: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/token/';
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(this.checkToken());
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // Método público para verificar autenticación
  public isLoggedIn(): boolean {
    return this.checkToken();
  }

  // Método privado para verificar token
  private checkToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp > (Date.now() / 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl, credentials).pipe(
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

  public getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.role || null;
    } catch (error) {
      console.error('Error decoding token for role:', error);
      return null;
    }
  }

  // Método para depuración
  public debugToken(): void {
    const token = this.getToken();
    if (!token) {
      console.log('No token found');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('Decoded Token:', decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
}