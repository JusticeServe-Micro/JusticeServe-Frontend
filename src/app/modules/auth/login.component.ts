import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./login.html",
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a3a5c 0%, #2e6da4 100%);
      position: relative;
      overflow: hidden;
    }

    .court-animations {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 1;
      pointer-events: none;
    }

    /* Base style for all background icons/emojis */
    .court-animations i, .court-animations div {
      position: absolute;
      font-size: 2.2rem;
      color: rgba(255,255,255,0.15);
      animation: floatIcons 10s infinite ease-in-out;
      user-select: none;
    }

    /* Random Distribution - Avoiding the center (40% to 60% area) */
    /* Top Left Area */
    .pos-1  { top: 5%;  left: 5%;   animation-delay: 0s; }
    .pos-2  { top: 20%; left: 10%;  animation-delay: -2s; font-size: 3rem; }
    .pos-3  { top: 8%;  left: 25%;  animation-delay: -4s; }

    /* Top Right Area */
    .pos-4  { top: 10%; left: 75%;  animation-delay: -1s; }
    .pos-5  { top: 5%;  left: 90%;  animation-delay: -3s; }
    .pos-6  { top: 25%; left: 85%;  animation-delay: -5s; }

    /* Bottom Left Area */
    .pos-7  { top: 80%; left: 5%;   animation-delay: -2.5s; }
    .pos-8  { top: 90%; left: 20%;  animation-delay: -4.5s; }
    .pos-9  { top: 70%; left: 15%;  animation-delay: -0.5s; }

    /* Bottom Right Area */
    .pos-10 { top: 75%; left: 75%;  animation-delay: -6s; }
    .pos-11 { top: 90%; left: 90%;  animation-delay: -2s; }
    .pos-12 { top: 65%; left: 88%;  animation-delay: -1.5s; }

    /* Side Fillers (Middle edges) */
    .pos-13 { top: 45%; left: 3%;   animation-delay: -7s; }
    .pos-14 { top: 50%; left: 92%;  animation-delay: -3.5s; }
    .pos-15 { top: 30%; left: 2%;   animation-delay: -9s; }

    @keyframes floatIcons {
      0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
      50% { transform: translate(15px, -25px) rotate(10deg); opacity: 0.4; }
    }

    .login-container {
      position: relative;
      z-index: 5; /* Sit above the icons */
    }

    .login-card {
      border: none;
      border-radius: 15px;
      backdrop-filter: blur(2px); /* Makes background icons feel "further away" */
      background: rgba(255, 255, 255, 0.95);
    }

    .logo-glow {
      font-size: 3.5rem;
      animation: logoPulse 4s infinite ease-in-out;
      display: inline-block;
    }

    @keyframes logoPulse {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255,193,7,0.2)); }
      50% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(255,193,7,0.6)); }
    }

    .demo-hint { opacity: 0.7; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error = e.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}