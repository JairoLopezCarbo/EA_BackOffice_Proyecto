import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';

    const email = this.email.trim();
    const password = this.password.trim();

    if (!email || !password) {
      this.loading = false;
      this.errorMessage = 'Please enter email and password';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService
      .login(email, password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (isAdmin) => {
          if (!isAdmin) {
            this.errorMessage = 'Only administrators can access the backoffice';
            this.cdr.detectChanges();
            return;
          }

          this.router.navigateByUrl('/');
        },
        error: (error) => {
          console.error('LOGIN ERROR', error);
          this.errorMessage = 'Invalid credentials or connection error';
          this.cdr.detectChanges();
        }
      });
  }
}