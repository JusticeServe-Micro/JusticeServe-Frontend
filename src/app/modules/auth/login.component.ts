import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: "./login.scss"
})
export class LoginComponent {
  isLogin = true;
  loading = false;
  error = '';
  success = '';

  loginFormData = { email: '', password: '' };
  registerFormData = { name: '', email: '', password: '', phone: '', role: 'CITIZEN' };

  constructor(private auth: AuthService, private router: Router) {}

  onLoginSubmit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.loginFormData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error = e.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }

  onRegisterSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    this.auth.register(this.registerFormData).subscribe({
      next: (res) => {
        this.success = 'Account created successfully! Please sign in.';
        this.loading = false;
        this.isLogin = true;
        this.registerFormData = { name: '', email: '', password: '', phone: '', role: 'CITIZEN' };
      },
      error: (e) => {
        this.error = e.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}