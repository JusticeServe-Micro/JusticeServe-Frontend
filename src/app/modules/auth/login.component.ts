// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   template: `
//     <div class="min-vh-100 d-flex align-items-center justify-content-center"
//          style="background: linear-gradient(135deg, #1a3a5c 0%, #2e6da4 100%)">
//       <div class="container">
//         <div class="row justify-content-center">
//           <div class="col-md-5">
//             <div class="text-center mb-4">
//               <i class="bi bi-balance-scale text-warning" style="font-size:3rem"></i>
//               <h2 class="text-white mt-2 fw-bold">JusticeServe</h2>
//               <p class="text-white-50">Legal Case Management System</p>
//             </div>
//             <div class="card">
//               <div class="card-body p-4">
//                 <h5 class="fw-bold mb-4">Sign In</h5>
//                 <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
//                 <form (ngSubmit)="onSubmit()" #f="ngForm">
//                   <div class="mb-3">
//                     <label class="form-label">Email Address</label>
//                     <input type="email" class="form-control" [(ngModel)]="email" name="email" required
//                            placeholder="admin@justiceserve.com">
//                   </div>
//                   <div class="mb-4">
//                     <label class="form-label">Password</label>
//                     <input type="password" class="form-control" [(ngModel)]="password" name="password" required
//                            placeholder="••••••••">
//                   </div>
//                   <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
//                     <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
//                     {{ loading ? 'Signing in...' : 'Sign In' }}
//                   </button>
//                 </form>
//                 <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
//                   Don't have an account? <a routerLink="/auth/register">Register</a>
//                 </p>
//               </div>
//             </div>
//             <p class="text-center text-white-50 mt-3" style="font-size:0.8rem">
//               Demo: admin&#64;justiceserve.com / admin123
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class LoginComponent {
//   email = '';
//   password = '';
//   loading = false;
//   error = '';

//   constructor(private auth: AuthService, private router: Router) {}

//   onSubmit(): void {
//     this.loading = true;
//     this.error = '';
//     this.auth.login({ email: this.email, password: this.password }).subscribe({
//       next: () => this.router.navigate(['/dashboard']),
//       error: (e) => { this.error = e.error?.message || 'Invalid credentials'; this.loading = false; }
//     });
//   }
// }
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper vh-100">
      <div class="row h-100 g-0">
        <!-- Left Side: Logo and Branding -->
        <div class="col-lg-5 d-flex flex-column justify-content-center align-items-center text-white position-relative left-panel">
          <div class="court-animations">
            <div class="bg-blob"></div>
            <div class="bg-blob-2"></div>
            <i class="bi bi-balance-scale pos-1"></i>
            <div class="pos-2">⚖️</div>
            <i class="bi bi-gavel pos-3"></i>
            <div class="pos-4">👨‍⚖️</div>
            <i class="bi bi-building pos-5"></i>
            <i class="bi bi-shield-lock pos-6"></i>
            <div class="pos-7">👮‍♂️</div>
            <i class="bi bi-handcuffs pos-8"></i>
            <i class="bi bi-journal-text pos-9"></i>
            <div class="pos-10">📜</div>
            <i class="bi bi-people pos-11"></i>
            <div class="pos-12">👩‍💼</div>
            <i class="bi bi-clipboard-check pos-13"></i>
            <div class="pos-14">🔍</div>
            <div class="pos-15">📝</div>
          </div>
          
          <div class="text-center header-fade">
            <img src="assets/logo.png" alt="JusticeServe Logo" class="login-logo mb-3">
            <h1 class="display-5 fw-bold mt-3 shine-text">JusticeServe</h1>
            <p class="lead text-white-50 typing-text">Legal Court Management System</p>
          </div>
        </div>
        
        <!-- Right Side: Auth Forms -->
        <div class="col-lg-7 d-flex flex-column justify-content-center align-items-center right-panel">
          <div class="auth-container p-4">
            <!-- Login Form -->
            <div *ngIf="isLogin" class="card auth-card shadow-lg">
              <div class="card-body p-4">
                <h4 class="fw-bold mb-4 text-center">Welcome Back</h4>
                <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
                
                <form (ngSubmit)="onLoginSubmit()" #loginForm="ngForm">
                  <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" [(ngModel)]="loginFormData.email" name="email" required
                           placeholder="admin@justiceserve.com">
                  </div>
                  <div class="mb-4">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" [(ngModel)]="loginFormData.password" name="password" required
                           placeholder="••••••••">
                  </div>
                  <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Signing in...' : 'Sign In' }}
                  </button>
                </form>
                
                <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
                  Don't have an account? <a href="#" class="text-primary fw-bold" (click)="isLogin = false; $event.preventDefault()">Register</a>
                </p>
                <!-- <p class="text-center text-muted mt-2" style="font-size:0.88rem">
                  Demo: admin&#64;justiceserve.com / admin123
                </p> -->
              </div>
            </div>
            
            <!-- Register Form -->
            <div *ngIf="!isLogin" class="card auth-card shadow-lg">
              <div class="card-body p-4">
                <h4 class="fw-bold mb-1 text-center">Create Account</h4>
                <p class="text-muted small mb-4 text-center">
                  You will be registered as a <strong>Citizen</strong> by default.
                </p>

                <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
                <div *ngIf="success" class="alert alert-success py-2">{{ success }}</div>

                <form (ngSubmit)="onRegisterSubmit()" #registerForm="ngForm">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Full Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="registerFormData.name"
                             name="name" required placeholder="e.g. Rahul Sharma">
                    </div>

                    <div class="col-12">
                      <label class="form-label">Email Address <span class="text-danger">*</span></label>
                      <input type="email" class="form-control" [(ngModel)]="registerFormData.email"
                             name="email" required placeholder="email@example.com">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Password <span class="text-danger">*</span></label>
                      <input type="password" class="form-control" [(ngModel)]="registerFormData.password"
                             name="password" required placeholder="Min 6 characters">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Phone</label>
                      <input type="text" class="form-control" [(ngModel)]="registerFormData.phone"
                             name="phone" placeholder="+91 9999999999">
                    </div>

                    <div class="col-12">
                      <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
                        <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ loading ? 'Creating Account...' : 'Create Account' }}
                      </button>
                    </div>
                  </div>
                </form>
                
                <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
                  Already have an account? <a href="#" class="text-primary fw-bold" (click)="isLogin = true; $event.preventDefault()">Sign In</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      position: relative;
      overflow: hidden;
    }

    .left-panel {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border-right: 1px solid rgba(255,255,255,0.1);
      min-height: 100vh;
    }

    .right-panel {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px);
      min-height: 100vh;
    }

    .court-animations {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 1;
      pointer-events: none;
    }

    .bg-blob {
      position: absolute;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(46, 109, 164, 0.2) 0%, transparent 70%);
      top: -100px; left: -100px;
      animation: drift 15s infinite alternate;
    }

    .bg-blob-2 {
      position: absolute;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(200, 168, 75, 0.1) 0%, transparent 70%);
      bottom: -50px; right: -50px;
      animation: drift 12s infinite alternate-reverse;
    }

    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to { transform: translate(50px, 50px) scale(1.1); }
    }

    .court-animations i, .court-animations div {
      position: absolute;
      font-size: 2rem;
      color: rgba(255,255,255,0.1);
      animation: floatIcons 12s infinite ease-in-out;
      user-select: none;
    }

    /* Random Distribution */
    .pos-1  { top: 5%;  left: 5%;   animation-delay: 0s; }
    .pos-2  { top: 20%; left: 10%;  animation-delay: -2s; font-size: 3rem; }
    .pos-3  { top: 8%;  left: 25%;  animation-delay: -4s; }
    .pos-4  { top: 10%; left: 75%;  animation-delay: -1s; }
    .pos-5  { top: 5%;  left: 90%;  animation-delay: -3s; }
    .pos-6  { top: 25%; left: 85%;  animation-delay: -5s; }
    .pos-7  { top: 80%; left: 5%;   animation-delay: -2.5s; }
    .pos-8  { top: 90%; left: 20%;  animation-delay: -4.5s; }
    .pos-9  { top: 70%; left: 15%;  animation-delay: -0.5s; }
    .pos-10 { top: 75%; left: 75%;  animation-delay: -6s; }
    .pos-11 { top: 90%; left: 90%;  animation-delay: -2s; }
    .pos-12 { top: 65%; left: 88%;  animation-delay: -1.5s; }
    .pos-13 { top: 45%; left: 3%;   animation-delay: -7s; }
    .pos-14 { top: 50%; left: 92%;  animation-delay: -3.5s; }
    .pos-15 { top: 30%; left: 2%;   animation-delay: -9s; }

    @keyframes floatIcons {
      0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
      50% { transform: translate(20px, -40px) rotate(15deg); opacity: 0.3; }
    }

    .login-logo {
      height: 100px;
      width: auto;
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
      animation: logoFloat 4s infinite ease-in-out;
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); }
      50% { transform: translateY(-10px); filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)); }
    }

    .auth-container {
      width: 100%;
      max-width: 450px;
    }

    .auth-card {
      border: none;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
    }

    .header-fade {
      animation: fadeInUp 1.2s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .typing-text {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 300;
      white-space: nowrap;
      overflow: hidden;
      width: 0;
      animation: typing 3s steps(30, end) forwards;
      color: rgba(254, 251, 251, 0.8);
    }

    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }
  `]
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