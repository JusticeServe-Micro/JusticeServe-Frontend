import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl:"./register.html",
  styleUrl: "./register.scss"
})
export class RegisterComponent {
  form = { name: '', email: '', password: '', phone: '' };
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.form.name.trim())      { this.error = 'Full name is required.'; return; }
    if (!this.form.email.trim())     { this.error = 'Email is required.'; return; }
    if (!this.form.password.trim())  { this.error = 'Password is required.'; return; }
    if (this.form.password.length < 6) { this.error = 'Password must be at least 6 characters.'; return; }

    this.loading = true;
    this.error = '';
    this.auth.register(this.form as any).subscribe({
      next: () => {
        this.success = 'Account created successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (e) => {
        this.error = e.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
