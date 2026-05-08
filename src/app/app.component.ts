import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div *ngIf="loading" class="loading-screen">
      <div class="logo-container">
        <img src="assets/logo.png" alt="JusticeServe" class="logo">
        <h1 class="brand-text">JusticeServe</h1>
      </div>
    </div>
    <router-outlet *ngIf="!loading" />
  `,
  styles: [`
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--js-primary), var(--js-secondary));
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.5s ease-in;
    }

    .logo-container {
      text-align: center;
      animation: slideUp 1s ease-out 0.5s both;
    }

    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 1rem;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    }

    .brand-text {
      color: var(--js-accent);
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      animation: glow 2s ease-in-out infinite alternate;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes glow {
      from { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
      to { text-shadow: 0 2px 4px rgba(200, 168, 75, 0.8), 0 0 20px rgba(200, 168, 75, 0.4); }
    }
  `]
})
export class AppComponent implements OnInit {
  loading = true;

  ngOnInit() {
    setTimeout(() => {
      this.loading = false;
    }, 0);
  }
}
