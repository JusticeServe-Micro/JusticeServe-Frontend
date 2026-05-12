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

  // Field-specific errors for registration
  registerErrors = {
    name: '',
    email: '',
    password: '',
    phone: ''
  };

  loginFormData = { email: '', password: '' };
  registerFormData = { name: '', email: '', password: '', phone: '', role: 'CITIZEN' };

  constructor(private auth: AuthService, private router: Router) {}

  onInputChange(): void {
    // Clear error and success messages when user starts typing
    if (this.error) {
      this.error = '';
    }
    if (this.success) {
      this.success = '';
    }
    // Clear field-specific registration errors
    this.registerErrors = { name: '', email: '', password: '', phone: '' };
  }

  onPhoneInput(): void {
    this.registerFormData.phone = this.registerFormData.phone.replace(/[^0-9]/g, '');
    this.onInputChange();
  }

  onLoginSubmit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.loginFormData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error = e.error?.message || 'Invalid credentials';
        this.loading = false;
        // Auto-clear error after 3 seconds
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    });
  }

  onRegisterSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    // Clear field-specific errors
    this.registerErrors = { name: '', email: '', password: '', phone: '' };

    this.auth.register(this.registerFormData).subscribe({
      next: (res) => {
        this.success = 'Account created successfully! Please sign in.';
        this.loading = false;
        this.isLogin = true;
        this.registerFormData = { name: '', email: '', password: '', phone: '', role: 'CITIZEN' };
      },
      error: (e) => {
        this.loading = false;
        const errorMessage = (e.error?.message || 'Registration failed').toString();
        const lowerMessage = errorMessage.toLowerCase();

        // Handle specific error messages
        if (lowerMessage.includes('already') || lowerMessage.includes('exists')) {
          this.registerErrors.email = 'Email already registered';
        } else if (lowerMessage.includes('invalid') || lowerMessage.includes('format') || lowerMessage.includes('email')) {
          this.registerErrors.email = 'Enter valid email address';
        } else if (lowerMessage.includes('name')) {
          this.registerErrors.name = errorMessage;
        } else if (lowerMessage.includes('password')) {
          this.registerErrors.password = errorMessage;
        } else if (lowerMessage.includes('phone')) {
          this.registerErrors.phone = errorMessage;
        } else {
          this.error = errorMessage;
        }

        // Auto-clear field errors after 3 seconds
        setTimeout(() => {
          this.registerErrors = { name: '', email: '', password: '', phone: '' };
          this.error = '';
        }, 3000);
      }
    });
  }
}