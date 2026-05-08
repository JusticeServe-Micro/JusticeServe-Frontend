// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-register',
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
//               <p class="text-white-50 small">Legal Case & Court Management System</p>
//             </div>
//             <div class="card">
//               <div class="card-body p-4">
//                 <h5 class="fw-bold mb-1">Create Account</h5>
//                 <p class="text-muted small mb-4">
//                   You will be registered as a <strong>Citizen</strong> by default.
//                   The administrator can assign you a different role if required.
//                 </p>

//                 <div *ngIf="error"   class="alert alert-danger py-2">{{ error }}</div>
//                 <div *ngIf="success" class="alert alert-success py-2">{{ success }}</div>

//                 <form (ngSubmit)="onSubmit()">
//                   <div class="row g-3">

//                     <div class="col-12">
//                       <label class="form-label">Full Name <span class="text-danger">*</span></label>
//                       <input type="text" class="form-control" [(ngModel)]="form.name"
//                              name="name" required placeholder="e.g. Rahul Sharma">
//                     </div>

//                     <div class="col-12">
//                       <label class="form-label">Email Address <span class="text-danger">*</span></label>
//                       <input type="email" class="form-control" [(ngModel)]="form.email"
//                              name="email" required placeholder="email@example.com">
//                     </div>

//                     <div class="col-md-6">
//                       <label class="form-label">Password <span class="text-danger">*</span></label>
//                       <input type="password" class="form-control" [(ngModel)]="form.password"
//                              name="password" required placeholder="Min 6 characters">
//                     </div>

//                     <div class="col-md-6">
//                       <label class="form-label">Phone</label>
//                       <input type="text" class="form-control" [(ngModel)]="form.phone"
//                              name="phone" placeholder="+91 9999999999">
//                     </div>

//                     <!-- Role info notice -->
//                     <div class="col-12">
//                       <div class="alert alert-info d-flex align-items-center gap-2 py-2 mb-0">
//                         <i class="bi bi-info-circle-fill"></i>
//                         <div class="small">
//                           Your account will start as <strong>Citizen</strong>.
//                           If you are a Lawyer, Judge, or Clerk — contact the administrator
//                           to get your role assigned after registration.
//                         </div>
//                       </div>
//                     </div>

//                     <div class="col-12">
//                       <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
//                         <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
//                         {{ loading ? 'Creating Account...' : 'Create Account' }}
//                       </button>
//                     </div>

//                   </div>
//                 </form>

//                 <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
//                   Already have an account? <a routerLink="/auth/login">Sign In</a>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class RegisterComponent {
//   form = { name: '', email: '', password: '', phone: '' };
//   loading = false;
//   error = '';
//   success = '';

//   constructor(private auth: AuthService, private router: Router) {}

//   onSubmit(): void {
//     if (!this.form.name.trim())     { this.error = 'Full name is required.'; return; }
//     if (!this.form.email.trim())    { this.error = 'Email is required.'; return; }
//     if (!this.form.password.trim()) { this.error = 'Password is required.'; return; }
//     if (this.form.password.length < 6) { this.error = 'Password must be at least 6 characters.'; return; }

//     this.loading = true;
//     this.error = '';
//     this.auth.register(this.form as any).subscribe({
//       next: () => {
//         this.success = 'Account created successfully! Redirecting to your portal...';
//         setTimeout(() => this.router.navigate(['/dashboard']), 1200);
//       },
//       error: (e) => {
//         this.error = e.error?.message || 'Registration failed. Please try again.';
//         this.loading = false;
//       }
//     });
//   }
// }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper vh-100">
      <div class="row g-0">
        <!-- Left Side -->
        <div class="col-lg-5 d-flex flex-column justify-content-center align-items-center text-white position-relative left-panel">
          <div class="court-animations">
            <div class="bg-blob"></div>
            <div class="bg-blob-2"></div>
            <i class="bi bi-balance-scale pos-1"></i>
            <div class="pos-2">⚖️</div>
            <i class="bi bi-gavel pos-3"></i>
            <div class="pos-4">👨‍⚖️</div>
            <i class="bi bi-building pos-5"></i>
            <div class="pos-12">👩‍💼</div>
            <i class="bi bi-journal-text pos-9"></i>
          </div>
          
          <div class="text-center header-fade">
            <img src="assets/logo.png" alt="JusticeServe Logo" class="login-logo mb-3">
            <h1 class="display-5 fw-bold mt-3">JusticeServe</h1>
            <p class="lead text-white-50">Join our modern legal network</p>
          </div>
        </div>

        <!-- Right Side -->
        <div class="col-lg-7 d-flex flex-column justify-content-center align-items-center right-panel">
          <div class="auth-container p-4">
            <div class="card auth-card shadow-lg">
              <div class="card-body p-4">
                <h4 class="fw-bold mb-1 text-center">Create Account</h4>
                <p class="text-muted small mb-4 text-center">
                  Default role: <strong>Citizen</strong>.
                </p>

                <div *ngIf="error" class="alert alert-danger py-2 small">{{ error }}</div>
                <div *ngIf="success" class="alert alert-success py-2 small">{{ success }}</div>

                <form (ngSubmit)="onSubmit()">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Full Name</label>
                      <input type="text" class="form-control" [(ngModel)]="form.name"
                             name="name" required placeholder="e.g. Rahul Sharma">
                    </div>

                    <div class="col-12">
                      <label class="form-label">Email Address</label>
                      <input type="email" class="form-control" [(ngModel)]="form.email"
                             name="email" required placeholder="email@example.com">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Password</label>
                      <input type="password" class="form-control" [(ngModel)]="form.password"
                             name="password" required placeholder="Min 6 chars">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Phone</label>
                      <input type="text" class="form-control" [(ngModel)]="form.phone"
                             name="phone" placeholder="+91 999..">
                    </div>

                    <div class="col-12">
                      <div class="alert alert-info d-flex align-items-center gap-2 py-2 mb-0 border-0 shadow-sm" style="background: rgba(13, 202, 240, 0.1);">
                        <i class="bi bi-info-circle-fill text-info"></i>
                        <small>Lawyers or Judges must contact Admin for upgrades after signup.</small>
                      </div>
                    </div>

                    <div class="col-12">
                      <button type="submit" class="btn btn-primary w-100 shadow-sm" [disabled]="loading">
                        <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ loading ? 'Creating Account...' : 'Create Account' }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
              Already have an account? <a routerLink="/auth/login" class="text-primary fw-bold">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); position: relative; overflow: hidden; }
    .left-panel { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-right: 1px solid rgba(255,255,255,0.1); min-height: 100vh; }
    .right-panel { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(20px); min-height: 100vh; }
    
    .court-animations {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
      pointer-events: none;
    }

    .bg-blob {
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(46, 109, 164, 0.15) 0%, transparent 70%);
      top: -100px; left: -100px; animation: drift 15s infinite alternate;
    }
    .bg-blob-2 {
      position: absolute; width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(200, 168, 75, 0.08) 0%, transparent 70%);
      bottom: -50px; right: -50px; animation: drift 12s infinite alternate-reverse;
    }
    @keyframes drift { from { transform: translate(0,0); } to { transform: translate(40px, 40px); } }

    .court-animations i, .court-animations div {
      position: absolute;
      font-size: 2rem;
      color: rgba(255,255,255,0.1);
      animation: floatIcons 12s infinite ease-in-out;
      user-select: none;
    }

    /* Positioning logic preserved from Login */
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
      0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
      50% { transform: translate(20px, -30px) rotate(10deg); opacity: 0.3; }
    }

    .login-logo { height: 90px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); animation: logoFloat 4s infinite ease-in-out; }
    @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

    .auth-container { width: 100%; max-width: 450px; z-index: 5; }
    .auth-card { border: none; border-radius: 15px; background: rgba(255, 255, 255, 0.98); box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important; }
    .logo-glow {
      font-size: 3.5rem;
      animation: logoPulse 4s infinite ease-in-out;
      display: inline-block;
    }

    @keyframes logoPulse {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255,193,7,0.2)); }
      50% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(255,193,7,0.6)); }
    }
    
    .form-control {
      border-radius: 8px;
      padding: 0.6rem 0.8rem;
    }

    .form-control:focus {
      box-shadow: 0 0 0 0.25rem rgba(46, 109, 164, 0.25);
      border-color: #2e6da4;
    }
    @media (max-width: 991.98px) { /* For screens smaller than lg */
      .login-wrapper {
        overflow-y: auto; /* Allow vertical scrolling on mobile */
        padding: 20px 0; /* Add some vertical padding */
      }
      .left-panel {
        min-height: 250px; /* Fixed height for the branding panel on mobile */
        padding: 20px;
      }
      .right-panel {
        min-height: auto; /* Let the form panel's height be determined by its content */
        padding: 20px; /* Add padding to the form panel on mobile */
      }
      .auth-container {
        max-width: 90%; /* Allow the form container to take more width on small screens */
      }
      /* Adjust font sizes for better mobile readability */
      .auth-card h5 { font-size: 1.25rem; }
      .auth-card .form-label { font-size: 0.8rem; }
    }
  `]
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