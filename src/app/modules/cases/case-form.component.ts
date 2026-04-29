import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CaseApiService, CitizenApiService, UserApiService, NotificationApiService
} from '../../core/services/api.service';
import { CitizenResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-folder-plus me-2"></i>File New Case</h4>
    </div>
    <div class="p-4">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <div class="card">
            <div class="card-body p-4">

              <div *ngIf="error"   class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>{{ error }}</div>
              <div *ngIf="success" class="alert alert-success"><i class="bi bi-check-circle me-2"></i>{{ success }}</div>

              <form (ngSubmit)="onSubmit()">

                <!-- Case Title -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Case Title <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="form.title" name="title" required
                         placeholder="e.g. Property Dispute – John vs State">
                </div>

                <!-- Description -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Description</label>
                  <textarea class="form-control" rows="4" [(ngModel)]="form.description" name="description"
                            placeholder="Briefly describe the nature of your case..."></textarea>
                </div>

                <!-- Citizen (self for CITIZEN role) -->
                <div class="mb-3" *ngIf="isCitizen">
                  <label class="form-label fw-semibold">Filing As</label>
                  <div class="alert alert-info py-2 mb-0 d-flex align-items-center gap-2">
                    <i class="bi bi-person-circle fs-5"></i>
                    <div>
                      <strong>{{ auth.currentUser?.name }}</strong>
                      <div class="small text-muted">Your citizen profile will be linked automatically</div>
                    </div>
                  </div>
                </div>

                <!-- Clerk / Admin: select citizen -->
                <div class="mb-3" *ngIf="!isCitizen">
                  <label class="form-label fw-semibold">Citizen <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.citizenId" name="citizenId" required>
                    <option [value]="0">Select citizen...</option>
                    <option *ngFor="let c of citizens" [value]="c.citizenId">
                      {{ c.name }} (ID: {{ c.citizenId }})
                    </option>
                  </select>
                </div>

                <!-- ── Lawyer Section ─────────────────────────────────── -->
                <div class="mb-4">
                  <label class="form-label fw-semibold">Lawyer (Optional)</label>

                  <div class="card border-0 bg-light p-3 mb-2">
                    <div class="form-check form-switch mb-0">
                      <input class="form-check-input" type="checkbox" role="switch"
                             id="hasLawyerSwitch" [(ngModel)]="hasLawyer" name="hasLawyer"
                             (change)="onLawyerToggle()">
                      <label class="form-check-label fw-semibold" for="hasLawyerSwitch">
                        I already know a lawyer and want to add them now
                      </label>
                    </div>
                    <div class="small text-muted mt-1 ms-4">
                      If you have a personal lawyer registered on JusticeServe, search and select them here.
                      Otherwise leave this off — the clerk will assign one for you.
                    </div>
                  </div>

                  <!-- Lawyer search & select -->
                  <div *ngIf="hasLawyer" class="mt-2">

                    <!-- Loading state -->
                    <div *ngIf="loadingLawyers" class="text-center py-3">
                      <span class="spinner-border spinner-border-sm text-primary me-2"></span>
                      <small class="text-muted">Loading lawyers from server...</small>
                    </div>

                    <!-- Error loading lawyers -->
                    <div *ngIf="lawyerLoadError" class="alert alert-warning py-2 small">
                      <i class="bi bi-exclamation-triangle me-1"></i>{{ lawyerLoadError }}
                    </div>

                    <div *ngIf="!loadingLawyers && allLawyers.length === 0 && !lawyerLoadError"
                         class="alert alert-info py-2 small">
                      <i class="bi bi-info-circle me-1"></i>No lawyers registered in the system yet.
                    </div>

                    <div *ngIf="!loadingLawyers && allLawyers.length > 0">
                      <!-- Search box -->
                      <div class="input-group mb-2">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" [(ngModel)]="lawyerSearch"
                               name="lawyerSearch" placeholder="Search by name or email..."
                               (input)="filterLawyers()">
                        <button *ngIf="lawyerSearch" type="button" class="btn btn-outline-secondary"
                                (click)="clearSearch()">
                          <i class="bi bi-x"></i>
                        </button>
                      </div>

                      <!-- Lawyer list — always visible when lawyers loaded -->
                      <div class="border rounded" style="max-height:240px;overflow-y:auto">
                        <div *ngFor="let l of filteredLawyers"
                             class="d-flex align-items-center gap-3 px-3 py-2 lawyer-option"
                             [class.selected-lawyer]="selectedLawyerId === l.userId"
                             (click)="selectLawyer(l)"
                             style="cursor:pointer;border-bottom:1px solid #f0f0f0">
                          <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                               style="width:36px;height:36px;font-size:13px;font-weight:700;background:#e8f0fe;color:#1d4ed8">
                            {{ l.name[0]?.toUpperCase() }}
                          </div>
                          <div class="flex-grow-1">
                            <div class="fw-semibold small">{{ l.name }}</div>
                            <div class="text-muted" style="font-size:11px">{{ l.email }}</div>
                            <div class="text-muted" style="font-size:11px" *ngIf="l.phone">
                              <i class="bi bi-telephone me-1"></i>{{ l.phone }}
                            </div>
                          </div>
                          <i *ngIf="selectedLawyerId === l.userId"
                             class="bi bi-check-circle-fill text-success fs-5"></i>
                        </div>
                        <div *ngIf="filteredLawyers.length === 0 && lawyerSearch"
                             class="text-muted small text-center py-3">
                          <i class="bi bi-search me-1"></i>No lawyer found for "{{ lawyerSearch }}"
                        </div>
                      </div>

                      <div class="text-muted small mt-1">
                        {{ allLawyers.length }} lawyer(s) available · {{ filteredLawyers.length }} shown
                      </div>
                    </div>

                    <!-- Selected chip -->
                    <div *ngIf="selectedLawyerId" class="alert alert-success d-flex align-items-center gap-2 mt-2 py-2">
                      <i class="bi bi-briefcase-fill"></i>
                      <div>
                        <strong>{{ selectedLawyerName }}</strong> selected as your lawyer.
                        <div class="small">They will be notified when you file this case.</div>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger ms-auto"
                              (click)="clearLawyer()">
                        <i class="bi bi-x"></i> Deselect
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Info -->
                <div class="alert border py-2 small"
                     [ngClass]="hasLawyer && selectedLawyerId ? 'alert-success' : 'alert-light'">
                  <i class="bi me-1"
                     [ngClass]="hasLawyer && selectedLawyerId ? 'bi-check-circle text-success' : 'bi-info-circle text-primary'"></i>
                  <span *ngIf="hasLawyer && selectedLawyerId">
                    Lawyer <strong>{{ selectedLawyerName }}</strong> will be notified when you submit.
                  </span>
                  <span *ngIf="!(hasLawyer && selectedLawyerId)">
                    After filing, the court clerk will review your case and assign a lawyer.
                    You will be notified once it is accepted.
                  </span>
                </div>

                <div class="d-flex gap-2 mt-3">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!loading" class="bi bi-send me-1"></i>
                    File Case
                  </button>
                  <a routerLink="/cases" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .lawyer-option:hover { background: #f8f9fa; }
      .lawyer-option.selected-lawyer { background: #f0fdf4; border-left: 3px solid #22c55e; }
    </style>
  `
})
export class CaseFormComponent implements OnInit {
  form = { title: '', description: '', citizenId: 0, lawyerId: null as number | null };

  citizens: CitizenResponse[] = [];
  clerks: UserResponse[] = [];
  allLawyers: UserResponse[] = [];
  filteredLawyers: UserResponse[] = [];

  hasLawyer = false;
  lawyerSearch = '';
  selectedLawyerId: number | null = null;
  selectedLawyerName = '';
  loadingLawyers = false;
  lawyerLoadError = '';

  loading = false;
  error = '';
  success = '';

  constructor(
    private api: CaseApiService,
    private citizenApi: CitizenApiService,
    private userApi: UserApiService,
    private notifApi: NotificationApiService,
    public auth: AuthService,
    private router: Router
  ) {}

  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }

  ngOnInit(): void {
    if (this.isCitizen) {
      this.citizenApi.getByUserId(this.auth.currentUser!.userId).subscribe({
        next: c => this.form.citizenId = c.citizenId,
        error: () => this.error = 'Please complete your citizen profile before filing a case.'
      });
    } else {
      this.citizenApi.getAll().subscribe({ next: d => this.citizens = d, error: () => {} });
    }
    this.userApi.getByRole('CLERK').subscribe({ next: d => this.clerks = d, error: () => {} });
  }

  onLawyerToggle(): void {
    if (this.hasLawyer) {
      this.loadLawyers();
    } else {
      this.clearLawyer();
    }
  }

  loadLawyers(): void {
    this.loadingLawyers = true;
    this.lawyerLoadError = '';
    this.allLawyers = [];
    this.filteredLawyers = [];

    this.userApi.getByRole('LAWYER').subscribe({
      next: data => {
        this.allLawyers = data;
        this.filteredLawyers = [...data]; // ← KEY FIX: always populate filteredLawyers on load
        this.loadingLawyers = false;
      },
      error: err => {
        this.lawyerLoadError = `Could not load lawyers (${err.status || 'network error'}). Check that the API gateway is running on port 9090.`;
        this.loadingLawyers = false;
      }
    });
  }

  filterLawyers(): void {
    const q = this.lawyerSearch.toLowerCase().trim();
    this.filteredLawyers = !q
      ? [...this.allLawyers]
      : this.allLawyers.filter(l =>
          l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
        );
  }

  clearSearch(): void {
    this.lawyerSearch = '';
    this.filteredLawyers = [...this.allLawyers];
  }

  selectLawyer(l: UserResponse): void {
    this.selectedLawyerId = l.userId;
    this.selectedLawyerName = l.name;
    this.form.lawyerId = l.userId;
  }

  clearLawyer(): void {
    this.selectedLawyerId = null;
    this.selectedLawyerName = '';
    this.form.lawyerId = null;
    this.lawyerSearch = '';
    this.filteredLawyers = [...this.allLawyers];
  }

  onSubmit(): void {
    if (!this.form.citizenId) {
      this.error = 'Citizen profile not found. Please complete your profile first.';
      return;
    }
    if (!this.form.title.trim()) {
      this.error = 'Case title is required.';
      return;
    }
    if (this.hasLawyer && !this.selectedLawyerId) {
      this.error = 'You enabled "I have a lawyer" but did not select one. Please select a lawyer or disable the option.';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload: any = {
      citizenId: this.form.citizenId,
      title: this.form.title,
      description: this.form.description
    };
    if (this.form.lawyerId) payload.lawyerId = this.form.lawyerId;

    this.api.file(payload).subscribe({
      next: c => {
        if (!this.form.lawyerId) {
          this.clerks.forEach(clerk => {
            this.notifApi.create({
              userId: clerk.userId,
              entityId: c.caseId,
              category: 'CASE',
              message: `New case filed: "${c.title}" (Case #${c.caseId}) by ${c.citizenName}. Please assign a lawyer.`
            }).subscribe();
          });
          this.success = `Case #${c.caseId} filed! The clerk will assign a lawyer and notify you.`;
        } else {
          this.success = `Case #${c.caseId} filed! Lawyer ${this.selectedLawyerName} has been notified.`;
        }
        this.loading = false;
        setTimeout(() => this.router.navigate(['/cases', c.caseId]), 1800);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to file case. Please try again.';
        this.loading = false;
      }
    });
  }
}
