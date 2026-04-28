import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { CaseResponse, UserResponse } from '../../shared/models/models';

@Component({
  selector: 'app-judgment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-hammer me-2"></i>Record Judgment</h4>
    </div>
    <div class="p-4">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <div class="card">
            <div class="card-body p-4">
              <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
              <div *ngIf="success" class="alert alert-success">{{ success }}</div>
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Case <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.caseId" name="caseId" required>
                    <option [value]="0">Select case...</option>
                    <option *ngFor="let c of cases" [value]="c.caseId">#{{ c.caseId }} – {{ c.title }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Judge <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.judgeId" name="judgeId" required>
                    <option [value]="0">Select judge...</option>
                    <option *ngFor="let j of judges" [value]="j.userId">{{ j.name }}</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label class="form-label">Judgment Summary <span class="text-danger">*</span></label>
                  <textarea class="form-control" rows="5" [(ngModel)]="form.summary" name="summary" required
                            placeholder="Detailed judgment summary..."></textarea>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>Record Judgment
                  </button>
                  <a routerLink="/judgments" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class JudgmentFormComponent implements OnInit {
  form = { caseId: 0, judgeId: 0, summary: '' };
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private api: JudgmentApiService, private caseApi: CaseApiService, private userApi: UserApiService, private router: Router) {}

  ngOnInit(): void {
    this.caseApi.getAll().subscribe(d => this.cases = d);
    this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d);
  }

  onSubmit(): void {
    this.loading = true; this.error = '';
    this.api.record(this.form as any).subscribe({
      next: j => { this.success = `Judgment #${j.judgmentId} recorded as DRAFT`; setTimeout(() => this.router.navigate(['/judgments']), 1200); },
      error: e => { this.error = e.error?.message || 'Failed'; this.loading = false; }
    });
  }
}