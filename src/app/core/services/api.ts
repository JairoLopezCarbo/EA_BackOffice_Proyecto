import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:1337';

  private getAuthOptions(params?: HttpParams) {
    const rawSession = localStorage.getItem('ea_backoffice_auth');
    let token: string | null = null;

    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        token = session?.token ?? null;
      } catch {
        token = null;
      }
    }

    const options: {
      params?: HttpParams;
      headers?: HttpHeaders;
      withCredentials: boolean;
    } = {
      withCredentials: true
    };

    if (params) {
      options.params = params;
    }

    if (token) {
      options.headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
    }

    return options;
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, this.getAuthOptions(params));
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, this.getAuthOptions());
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, this.getAuthOptions());
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, this.getAuthOptions());
  }
}
