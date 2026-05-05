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
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      
      <div class="court-animations">
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

      <div class="container login-container">
        <div class="row justify-content-center">
          <div class="col-md-5">
            <div class="text-center mb-4 header-fade">
              <i class="bi bi-balance-scale text-warning logo-glow"></i>
              <h2 class="text-white mt-2 fw-bold">JusticeServe</h2>
              <p class="text-white-50">Legal Case Management System</p>
            </div>
            
            <div class="card login-card shadow-lg">
              <div class="card-body p-4">
                <h5 class="fw-bold mb-4">Sign In</h5>
                <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
                
                <form (ngSubmit)="onSubmit()">
                  <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" [(ngModel)]="email" name="email" required
                           placeholder="admin@justiceserve.com">
                  </div>
                  <div class="mb-4">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" [(ngModel)]="password" name="password" required
                           placeholder="••••••••">
                  </div>
                  <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Signing in...' : 'Sign In' }}
                  </button>
                </form>
                
                <p class="text-center mt-3 mb-0 text-muted" style="font-size:0.88rem">
                  Don't have an account? <a routerLink="/auth/register" class="text-primary fw-bold">Register</a>
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