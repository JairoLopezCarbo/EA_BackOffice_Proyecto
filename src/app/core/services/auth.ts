import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { resolveApiBaseUrl } from '../config/api-url';

interface AuthUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  enabled: boolean;
  role: 'admin' | 'user';
}

interface AuthSession {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = resolveApiBaseUrl();
  private readonly storageKey = 'ea_backoffice_auth';

  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/auth/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      map((response) => {
        const isAdmin = response?.user?.role === 'admin';

        if (!isAdmin) {
          this.clearSession();
          return false;
        }

        const session: AuthSession = {
          token: response.accessToken,
          user: {
            id: response.user._id,
            name: response.user.name,
            surname: response.user.surname,
            username: response.user.username,
            email: response.user.email,
            enabled: response.user.enabled,
            role: response.user.role
          }
        };

        localStorage.setItem(this.storageKey, JSON.stringify(session));
        this.startTokenTimer();

        return true;
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession();
      })
    );
  }

  forceLogout(): void {
    this.clearSession();
  }

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      this.clearSession();
      return null;
    }
  }

  getToken(): string | null {
    const session = this.getSession();

    if (!session?.token) {
      return null;
    }

    if (this.isTokenExpired(session.token)) {
      this.clearSession();
      return null;
    }

    return session.token;
  }

  getUser(): AuthUser | null {
    const session = this.getSession();

    if (!session?.user) {
      return null;
    }

    if (!session.token || this.isTokenExpired(session.token)) {
      this.clearSession();
      return null;
    }

    return session.user;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload?.exp;

      if (!exp) {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return nowInSeconds >= exp;
    } catch {
      return true;
    }
  }

  startTokenTimer(): void {
    const token = this.getSession()?.token;

    if (!token) {
      return;
    }

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        this.forceLogout();
        window.location.href = '/login';
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload?.exp;

      if (!exp) {
        this.forceLogout();
        window.location.href = '/login';
        return;
      }

      const expiresAtMs = exp * 1000;
      const timeoutMs = expiresAtMs - Date.now();

      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
      }

      if (timeoutMs <= 0) {
        this.forceLogout();
        window.location.href = '/login';
        return;
      }

      this.logoutTimer = setTimeout(() => {
        this.forceLogout();
        window.location.href = '/login';
      }, timeoutMs);
    } catch {
      this.forceLogout();
      window.location.href = '/login';
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.storageKey);

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }
}