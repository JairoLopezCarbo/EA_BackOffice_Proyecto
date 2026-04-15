import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  private readonly baseUrl = 'http://localhost:1337';
  private readonly storageKey = 'ea_backoffice_auth';

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/auth/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      map((response) => {
        const isAdmin = response?.user?.role === 'admin';

        if (isAdmin) {
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
        }

        return isAdmin;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getUser(): AuthUser | null {
    return this.getSession()?.user ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }
}