import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CaseResponse, UserResponse } from '../../shared/models/models';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-file-text me-2"></i>Issue Court Order</h4>
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
                <div class="mb-3" *ngIf="auth.role !== 'JUDGE'">
                  <label class="form-label">Judge <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="form.judgeId" name="judgeId" required>
                    <option [value]="0">Select judge...</option>
                    <option *ngFor="let j of judges" [value]="j.userId">{{ j.name }}</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label class="form-label">Order Description <span class="text-danger">*</span></label>
                  <textarea class="form-control" rows="4" [(ngModel)]="form.description" name="description" required
                            placeholder="Describe the court order..."></textarea>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>Issue Order
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
export class OrderFormComponent implements OnInit {
  form = { caseId: 0, judgeId: 0, description: '' };
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = false; error = ''; success = '';

  constructor(private api: JudgmentApiService, private caseApi: CaseApiService, private userApi: UserApiService, public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.caseApi.getAll().subscribe(cases => {
      if (this.auth.role === 'JUDGE') {
        this.cases = cases.filter(c => c.judgeId === this.auth.currentUser?.userId);
        this.form.judgeId = this.auth.currentUser?.userId || 0;
      } else {
        this.cases = cases;
      }
    });
    if (this.auth.role !== 'JUDGE') {
      this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d);
    }
  }

  onSubmit(): void {
    this.loading = true; this.error = '';
    this.api.issueOrder(this.form as any).subscribe({
      next: o => { this.success = `Order #${o.orderId} issued!`; setTimeout(() => this.router.navigate(['/judgments']), 1200); },
      error: e => { this.error = e.error?.message || 'Failed'; this.loading = false; }
    });
  }
}
