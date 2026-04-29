import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceApiService, UserApiService } from '../../core/services/api.service';
import { ComplianceRecordResponse, AuditResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h4><i class="bi bi-shield-check me-2"></i>Compliance & Audits</h4>
    </div>

    <!-- Toast Notification -->
    <div *ngIf="toast" class="alert d-flex align-items-center gap-2 m-3 alert-dismissible fade show"
         [ngClass]="toast.type === 'success' ? 'alert-success' : 'alert-danger'">
      <i class="bi" [ngClass]="toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>
      {{ toast.msg }}
      <button type="button" class="btn-close" (click)="toast = null"></button>
    </div>

    <div class="p-4">
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='compliance'" (click)="tab='compliance'">Compliance Records</a></li>
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='audits'" (click)="tab='audits'">Audits</a></li>
      </ul>

      <!-- Compliance Records -->
      <div *ngIf="tab==='compliance'">
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Compliance Records</span>
            <button class="btn btn-sm btn-primary" (click)="showRecordForm=!showRecordForm">+ New Record</button>
          </div>
          <div *ngIf="showRecordForm" class="card-body border-bottom bg-light">
            <div class="row g-2">
              <div class="col-md-2">
                <input type="number" class="form-control form-control-sm" [(ngModel)]="recForm.entityId" placeholder="Entity ID">
              </div>
              <div class="col-md-3">
                <select class="form-select form-select-sm" [(ngModel)]="recForm.type">
                  <option value="">Type...</option>
                  <option>CASE</option><option>HEARING</option><option>JUDGMENT</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select form-select-sm" [(ngModel)]="recForm.result">
                  <option value="">Result...</option>
                  <option>COMPLIANT</option><option>NON_COMPLIANT</option><option>PENDING</option>
                </select>
              </div>
              <div class="col-md-3">
                <input class="form-control form-control-sm" [(ngModel)]="recForm.notes" placeholder="Notes">
              </div>
              <div class="col-md-1">
                <button class="btn btn-sm btn-success w-100" (click)="addRecord()">Add</button>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div *ngIf="loading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>
            <table class="table table-hover mb-0" *ngIf="!loading">
              <thead><tr><th>ID</th><th>Entity ID</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of records">
                  <td>#{{ r.complianceId }}</td>
                  <td>{{ r.entityId }}</td>
                  <td><span class="badge bg-secondary">{{ r.type }}</span></td>
                  <td><span class="badge" [ngClass]="resultBadge(r.result)">{{ r.result }}</span></td>
                  <td>{{ r.date | date:'mediumDate' }}</td>
                  <td>{{ r.notes || '—' }}</td>
                </tr>
                <tr *ngIf="records.length===0"><td colspan="6" class="text-center text-muted py-3">No records</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Audits -->
      <div *ngIf="tab==='audits'">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Audit Records</span>
            <button class="btn btn-sm btn-primary" (click)="showAuditForm=!showAuditForm">+ New Audit</button>
          </div>
          <div *ngIf="showAuditForm" class="card-body border-bottom bg-light">
            <div class="row g-2">
              <div class="col-md-3">
                <select class="form-select form-select-sm" [(ngModel)]="auditForm.officerId">
                  <option [value]="0">Officer...</option>
                  <option *ngFor="let u of officers" [value]="u.userId">{{ u.name }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <input class="form-control form-control-sm" [(ngModel)]="auditForm.scope" placeholder="Scope of audit">
              </div>
              <div class="col-md-4">
                <input class="form-control form-control-sm" [(ngModel)]="auditForm.findings" placeholder="Initial findings">
              </div>
              <div class="col-md-1">
                <button class="btn btn-sm btn-success w-100" (click)="addAudit()">Add</button>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div *ngIf="auditsLoading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>
            <table class="table table-hover mb-0" *ngIf="!auditsLoading">
              <thead><tr><th>ID</th><th>Officer</th><th>Scope</th><th>Findings</th><th>Date</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of audits">
                  <td>#{{ a.auditId }}</td>
                  <td>{{ a.officerName }}</td>
                  <td>{{ a.scope }}</td>
                  <td>{{ (a.findings || '—') | slice:0:40 }}</td>
                  <td>{{ a.date | date:'mediumDate' }}</td>
                  <td><span class="badge" [ngClass]="auditBadge(a.status)">{{ a.status }}</span></td>
                  <td>
                    <select class="form-select form-select-sm" style="width:110px" [ngModel]="a.status"
                            (change)="updateAuditStatus(a.auditId, $any($event.target).value)">
                      <option>OPEN</option><option>REVIEW</option><option>CLOSED</option>
                    </select>
                  </td>
                </tr>
                <tr *ngIf="audits.length===0"><td colspan="7" class="text-center text-muted py-3">No audits</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ComplianceComponent implements OnInit {
  tab = 'compliance';
  records: ComplianceRecordResponse[] = [];
  audits: AuditResponse[] = [];
  officers: UserResponse[] = [];
  loading = true;
  auditsLoading = true;
  showRecordForm = false;
  showAuditForm = false;
  recForm = { entityId: 0, type: '', result: '', notes: '' };
  auditForm = { officerId: 0, scope: '', findings: '' };
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  constructor(private api: ComplianceApiService, private userApi: UserApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.getAllRecords().subscribe({ next: d => { this.records = d; this.loading = false; }, error: () => this.loading = false });
    this.api.getAllAudits().subscribe({ next: d => { this.audits = d; this.auditsLoading = false; }, error: () => this.auditsLoading = false });
    this.userApi.getAll().subscribe({
      next: d => this.officers = d.filter(u => ['COMPLIANCE','AUDITOR','ADMIN'].includes(u.role)),
      error: (e) => {
        console.error('Error loading officers:', e);
        this.officers = [];
        this.showToast('Failed to load officers - backend error', 'error');
      }
    });
  }

  addRecord(): void {
    if (!this.recForm.type || !this.recForm.result) {
      this.showToast('Please fill in Type and Result fields', 'error');
      return;
    }
    console.log('Creating compliance record:', this.recForm);
    this.api.createRecord(this.recForm as any).subscribe({
      next: r => {
        console.log('Record created successfully:', r);
        this.records = [...this.records, r];
        this.showRecordForm = false;
        this.recForm = { entityId: 0, type: '', result: '', notes: '' };
        this.showToast('Record added successfully', 'success');
      },
      error: (e) => {
        console.error('Error creating record:', e);
        this.showToast('Failed to add record: ' + (e.error?.message || e.message), 'error');
      }
    });
  }

  addAudit(): void {
    if (!this.auditForm.scope || !this.auditForm.officerId) {
      this.showToast('Please select Officer and enter Scope', 'error');
      return;
    }
    console.log('Creating audit:', this.auditForm);
    this.api.createAudit(this.auditForm as any).subscribe({
      next: a => {
        console.log('Audit created successfully:', a);
        this.audits = [...this.audits, a];
        this.showAuditForm = false;
        this.auditForm = { officerId: 0, scope: '', findings: '' };
        this.showToast('Audit added successfully', 'success');
      },
      error: (e) => {
        console.error('Error creating audit:', e);
        this.showToast('Failed to add audit: ' + (e.error?.message || e.message), 'error');
      }
    });
  }

  updateAuditStatus(id: number, status: string): void {
    console.log('Updating audit status:', id, status);
    this.api.updateAuditStatus(id, status).subscribe({
      next: a => {
        console.log('Audit status updated:', a);
        this.audits = this.audits.map(x => x.auditId === id ? a : x);
        this.showToast('Status updated successfully', 'success');
      },
      error: (e) => {
        console.error('Error updating audit status:', e);
        this.showToast('Failed to update status', 'error');
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  resultBadge(s: string): string {
    return s === 'COMPLIANT' ? 'bg-success' : s === 'NON_COMPLIANT' ? 'bg-danger' : 'bg-warning text-dark';
  }
  auditBadge(s: string): string {
    return s === 'CLOSED' ? 'bg-success' : s === 'REVIEW' ? 'bg-warning text-dark' : 'bg-primary';
  }
}
