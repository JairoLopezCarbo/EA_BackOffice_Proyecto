import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { resolveApiBaseUrl } from '../config/api-url';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = resolveApiBaseUrl();

  private getAuthOptions(params?: HttpParams) {
    const token = this.authService.getToken();

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