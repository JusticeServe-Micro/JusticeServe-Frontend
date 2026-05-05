import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationApiService } from '../../core/services/api.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar d-flex flex-column">
        <a routerLink="/dashboard" class="brand text-decoration-none">
                  <img src="assets/logo.png" alt="JusticeServe Logo" class="me-2" style="height: 32px; width: auto;">

          <i class="bi bi-balance-scale me-2"></i>JusticeServe
        </a>
        <div class="mt-2 flex-grow-1 overflow-auto">

          <div class="nav-section">Main</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <i class="bi bi-grid"></i> Dashboard
          </a>

          <!-- CITIZEN: only My Profile + My Cases + Notifications -->
          <ng-container *ngIf="isCitizen">
            <div class="nav-section">My Account</div>
            <a routerLink="/citizens/my-profile" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-circle"></i> My Profile
            </a>
            <a routerLink="/cases" routerLinkActive="active" class="nav-link">
              <i class="bi bi-folder2-open"></i> My Cases
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- LAWYER -->
          <ng-container *ngIf="isLawyer">
            <div class="nav-section">Case Management</div>
            <a routerLink="/cases" routerLinkActive="active" class="nav-link">
              <i class="bi bi-folder2-open"></i> Cases
            </a>
            <a routerLink="/hearings" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-event"></i> Hearings
            </a>
            <a routerLink="/citizens" routerLinkActive="active" class="nav-link">
              <i class="bi bi-people"></i> Citizens
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- JUDGE -->
          <ng-container *ngIf="isJudge">
            <div class="nav-section">Court Work</div>
            <a routerLink="/cases" routerLinkActive="active" class="nav-link">
              <i class="bi bi-folder2-open"></i> Cases
            </a>
            <a routerLink="/hearings" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-event"></i> Hearings
            </a>
            <a routerLink="/judgments" routerLinkActive="active" class="nav-link">
              <i class="bi bi-hammer"></i> Judgments & Orders
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- CLERK -->
          <ng-container *ngIf="isClerk">
            <div class="nav-section">Case Management</div>
            <a routerLink="/citizens" routerLinkActive="active" class="nav-link">
              <i class="bi bi-people"></i> Citizens
            </a>
            <a routerLink="/cases" routerLinkActive="active" class="nav-link">
              <i class="bi bi-folder2-open"></i> Cases
            </a>
            <a routerLink="/hearings" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-event"></i> Hearings
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- COMPLIANCE OFFICER -->
          <ng-container *ngIf="isCompliance">
            <div class="nav-section">Compliance</div>
            <a routerLink="/compliance" routerLinkActive="active" class="nav-link">
              <i class="bi bi-shield-check"></i> Compliance & Audits
            </a>
            <a routerLink="/reports" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bar-chart"></i> Reports
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- AUDITOR -->
          <ng-container *ngIf="isAuditor">
            <div class="nav-section">Audit</div>
            <a routerLink="/compliance" routerLinkActive="active" class="nav-link">
              <i class="bi bi-shield-check"></i> Compliance & Audits
            </a>
            <a routerLink="/reports" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bar-chart"></i> Reports
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

          <!-- ADMIN: sees everything -->
          <ng-container *ngIf="isAdmin">
            <div class="nav-section">Case Management</div>
            <a routerLink="/citizens" routerLinkActive="active" class="nav-link">
              <i class="bi bi-people"></i> Citizens
            </a>
            <a routerLink="/cases" routerLinkActive="active" class="nav-link">
              <i class="bi bi-folder2-open"></i> Cases
            </a>
            <a routerLink="/hearings" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-event"></i> Hearings
            </a>
            <a routerLink="/judgments" routerLinkActive="active" class="nav-link">
              <i class="bi bi-hammer"></i> Judgments & Orders
            </a>
            <div class="nav-section">Compliance</div>
            <a routerLink="/compliance" routerLinkActive="active" class="nav-link">
              <i class="bi bi-shield-check"></i> Compliance & Audits
            </a>
            <a routerLink="/reports" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bar-chart"></i> Reports
            </a>
            <div class="nav-section">Admin</div>
            <a routerLink="/users" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-gear"></i> User Management
            </a>
            <a routerLink="/audit-logs" routerLinkActive="active" class="nav-link">
              <i class="bi bi-file-text"></i> System Logs
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bell"></i> Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-danger ms-auto">{{ unreadCount }}</span>
            </a>
          </ng-container>

        </div>

        <!-- User info at bottom -->
        <div class="p-3 border-top border-secondary">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                 style="width:36px;height:36px;font-weight:700;color:#333">
              {{ initials }}
            </div>
            <div class="flex-grow-1 overflow-hidden">
              <div class="text-white text-truncate" style="font-size:0.85rem;font-weight:600">{{ userName }}</div>
              <div class="text-white-50" style="font-size:0.75rem">{{ userRole }}</div>
            </div>
            <button class="btn btn-sm text-white-50" (click)="logout()" title="Logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="main-content flex-grow-1">
        <!-- Topbar -->
        <div class="topbar d-flex align-items-center justify-content-between">
          <div class="text-muted" style="font-size:0.85rem">
            <i class="bi bi-clock me-1"></i>{{ currentTime | date:'EEEE, MMM d, y · h:mm a' }}
          </div>
          <div class="d-flex align-items-center gap-3">
            <a routerLink="/notifications" class="position-relative text-decoration-none text-dark">
              <i class="bi bi-bell fs-5"></i>
              <span *ngIf="unreadCount > 0"
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style="font-size:0.65rem">{{ unreadCount }}</span>
            </a>
            <span class="badge bg-primary">{{ userRole }}</span>
            <strong style="font-size:0.9rem">{{ userName }}</strong>
          </div>
        </div>

        <!-- Page Content -->
        <router-outlet />
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  currentTime = new Date();
  private timerSub?: Subscription;
  private notifSub?: Subscription;

  constructor(private auth: AuthService, private notifApi: NotificationApiService) {}

  get userName(): string { return this.auth.currentUser?.name ?? ''; }
  get userRole(): string { return this.auth.currentUser?.role ?? ''; }
  get initials(): string { return this.userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); }

  get isAdmin(): boolean { return this.auth.hasRole('ADMIN'); }
  get isJudge(): boolean { return this.auth.hasRole('JUDGE'); }
  get isClerk(): boolean { return this.auth.hasRole('CLERK'); }
  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }
  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }
  get isCompliance(): boolean { return this.auth.hasRole('COMPLIANCE'); }
  get isAuditor(): boolean { return this.auth.hasRole('AUDITOR'); }

  ngOnInit(): void {
    this.timerSub = interval(1000).subscribe(() => this.currentTime = new Date());
    const userId = this.auth.currentUser?.userId;
    if (userId) {
      this.pollNotifications(userId);
      this.notifSub = interval(30000).pipe(
        switchMap(() => this.notifApi.countUnread(userId))
      ).subscribe(c => this.unreadCount = c);
    }
  }

  pollNotifications(userId: number): void {
    this.notifApi.countUnread(userId).subscribe(c => this.unreadCount = c, () => {});
  }

  logout(): void { this.auth.logout(); }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }
}
