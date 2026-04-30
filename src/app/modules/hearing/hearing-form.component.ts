import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HearingApiService, CaseApiService, UserApiService, NotificationApiService, CitizenApiService } from '../../core/services/api.service';
import { CaseResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hearing-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-calendar-plus me-2"></i>Schedule Hearing</h4>
    </div>
    <div class="p-4">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-body p-4">
              <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
              <div *ngIf="success" class="alert alert-success">{{ success }}</div>
              <form (ngSubmit)="onSubmit()">

                <!-- Case Selection -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Case <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.caseId" name="caseId" required
                          (change)="onCaseChange()">
                    <option [value]="0">Select case...</option>
                    <option *ngFor="let c of cases" [value]="c.caseId">
                      #{{ c.caseId }} – {{ c.title }} ({{ c.status }})
                    </option>
                  </select>
                  <div *ngIf="selectedCase" class="mt-2 alert alert-light py-2 small">
                    <strong>Citizen ID:</strong> {{ selectedCase.citizenId }}
                    <span *ngIf="selectedCase.lawyerId">&nbsp;·&nbsp;<strong>Lawyer ID:</strong> {{ selectedCase.lawyerId }}</span>
                  </div>
                </div>

                <!-- Judge Selection -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Judge <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.judgeId" name="judgeId" required>
                    <option [value]="0">Select judge...</option>
                    <option *ngFor="let j of judges" [value]="j.userId">{{ j.name }} ({{ j.email }})</option>
                  </select>
                </div>

                <!-- Date & Time -->
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Date <span class="text-danger">*</span></label>
                    <input type="date" class="form-control" [(ngModel)]="form.date" name="date" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Time <span class="text-danger">*</span></label>
                    <input type="time" class="form-control" [(ngModel)]="form.time" name="time" required>
                  </div>
                </div>

                <div class="d-flex gap-2 mt-4">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!loading" class="bi bi-calendar-check me-1"></i>
                    Schedule Hearing
                  </button>
                  <a routerLink="/hearings" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HearingFormComponent implements OnInit {
  form = { caseId: 0, judgeId: 0, date: '', time: '' };
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  selectedCase: CaseResponse | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(
    private api: HearingApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    private citizenApi: CitizenApiService, // ADD THIS
  private notifApi: NotificationApiService,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.caseApi.getAll().subscribe({ next: d => { this.cases = d.filter(c => c.status !== 'CLOSED' && c.status !== 'DISMISSED'); }, error: () => {} });
    this.userApi.getByRole('JUDGE').subscribe({ next: d => this.judges = d, error: () => {} });

    // Pre-fill from query params (e.g. from case detail page)
    const caseIdParam = this.route.snapshot.queryParams['caseId'];
    if (caseIdParam) {
      this.form.caseId = +caseIdParam;
      this.caseApi.getById(+caseIdParam).subscribe({ next: c => this.selectedCase = c, error: () => {} });
    }

    // Pre-fill judge if current user is a judge
    if (this.auth.hasRole('JUDGE')) {
      this.form.judgeId = this.auth.currentUser!.userId;
    }
  }

  onCaseChange(): void {
    const c = this.cases.find(x => x.caseId === +this.form.caseId);
    this.selectedCase = c || null;
  }

  onSubmit(): void {
    if (!this.form.caseId || !this.form.judgeId || !this.form.date || !this.form.time) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.loading = true;
    this.error = '';

    // Build payload with ALL required fields that the backend expects
    const payload: any = {
      caseId: +this.form.caseId,
      judgeId: +this.form.judgeId,
      date: this.form.date,
      time: this.form.time,
      caseTitle: this.selectedCase?.title || `Case #${this.form.caseId}`,
      // citizenUserId comes from the citizen who owns the case
      // The hearing-service requires this for notifications
      citizenUserId: this.selectedCase?.citizenId || null,
    };

    if (this.selectedCase?.lawyerId) {
      payload.lawyerUserId = this.selectedCase.lawyerId;
    }

    this.api.schedule(payload).subscribe({
      next: h => {
        this.success = `Hearing #${h.hearingId} scheduled for ${h.date} at ${h.time}!`;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/hearings']), 1500);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to schedule hearing. Check all fields.';
        this.loading = false;
      }
    });
  }
}