import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CitizenApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-person-plus me-2"></i>Complete Your Citizen Profile</h4>
    </div>
    <div class="p-4">
      <div class="row justify-content-center">
        <div class="col-lg-7">

          <!-- Logged-in user info banner -->
          <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-person-circle fs-5"></i>
            <div>
              Registering profile for <strong>{{ currentUserName }}</strong>
              ({{ currentUserEmail }})
            </div>
          </div>

          <div class="card">
            <div class="card-body p-4">
              <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
              <div *ngIf="success" class="alert alert-success">{{ success }}</div>
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Full Name <span class="text-danger">*</span></label>
                  <input class="form-control" [(ngModel)]="form.name" name="name" required
                         placeholder="John Doe">
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-control" [(ngModel)]="form.dob" name="dob">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Gender</label>
                    <select class="form-select" [(ngModel)]="form.gender" name="gender">
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Address</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="form.address" name="address"
                              placeholder="123 Main St, City, State"></textarea>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Contact Info</label>
                    <input class="form-control" [(ngModel)]="form.contactInfo" name="contactInfo"
                           placeholder="+91 9999999999">
                  </div>
                </div>
                <div class="d-flex gap-2 mt-4">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Save Profile
                  </button>
                  <a routerLink="/dashboard" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class CitizenFormComponent implements OnInit {
  form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private api: CitizenApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  get currentUserName(): string { return this.auth.currentUser?.name ?? ''; }
  get currentUserEmail(): string { return this.auth.currentUser?.email ?? ''; }

  ngOnInit(): void {
    // Auto-fill userId from logged-in session — no dropdown needed
    this.form.userId = this.auth.currentUser?.userId ?? 0;
    this.form.name = this.auth.currentUser?.name ?? '';
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.api.create(this.form as any).subscribe({
      next: c => {
        this.success = 'Profile registered successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/citizens', c.citizenId]), 1200);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to register profile';
        this.loading = false;
      }
    });
  }
}
