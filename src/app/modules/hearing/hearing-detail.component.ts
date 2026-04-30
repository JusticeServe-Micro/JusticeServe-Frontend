import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HearingApiService, CaseApiService } from '../../core/services/api.service';
import { HearingResponse, ProceedingResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hearing-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-calendar-event me-2"></i>Hearing Details</h4>
      <a routerLink="/hearings" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i>Back</a>
    </div>
    <div class="p-4" *ngIf="!loading && hearing">
      <div class="row g-3">
        <!-- Hearing Info -->
        <div class="col-lg-5">
          <div class="card">
            <div class="card-header d-flex justify-content-between">
              <span>Hearing #{{ hearing.hearingId }}</span>
              <span class="badge" [ngClass]="badge(hearing.status)">{{ hearing.status }}</span>
            </div>
            <div class="card-body">
              <div class="mb-2"><small class="text-muted">Case</small><br><strong>{{ hearing.caseTitle }}</strong></div>
              <div class="mb-2"><small class="text-muted">Judge</small><br><strong>{{ hearing.judgeName }}</strong></div>
              <div class="mb-2"><small class="text-muted">Date & Time</small><br><strong>{{ hearing.date | date:'longDate' }} at {{ hearing.time }}</strong></div>
            </div>
            <!-- Status Update - Only for Clerk/Admin/Judge -->
            <div *ngIf="!isLawyer" class="card-footer">
              <label class="form-label mb-1">Update Status</label>
              <div class="d-flex gap-2">
                <select class="form-select form-select-sm" [(ngModel)]="newStatus">
                  <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                </select>
                <button class="btn btn-sm btn-primary" (click)="updateStatus()">Update</button>
              </div>
              <div *ngIf="statusMsg" class="alert alert-success mt-2 py-1">{{ statusMsg }}</div>
            </div>
          </div>
        </div>

        <!-- Case Details -->
        <div class="col-lg-7">
          <div class="card">
            <div class="card-header"><i class="bi bi-folder me-2"></i>Case Information</div>
            <div class="card-body" *ngIf="caseData">
              <div class="row g-3">
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Case ID</strong></small>
                  <span>#{{ caseData.caseId }}</span>
                </div>
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Title</strong></small>
                  <span>{{ caseData.title }}</span>
                </div>
                <div class="col-12">
                  <small class="text-muted d-block mb-1"><strong>Description</strong></small>
                  <p class="mb-0">{{ caseData.description || 'No description' }}</p>
                </div>
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Citizen</strong></small>
                  <span>{{ caseData.citizenName }}</span>
                </div>
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Filed Date</strong></small>
                  <span>{{ caseData.filedDate | date:'mediumDate' }}</span>
                </div>
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Status</strong></small>
                  <span class="badge" [ngClass]="caseStatusBadge(caseData.status)">{{ caseData.status }}</span>
                </div>
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1"><strong>Judge</strong></small>
                  <span>{{ caseData.judgeName || 'Not assigned' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Proceedings - Only for Clerk/Admin/Judge -->
      <div *ngIf="!isLawyer" class="row g-3 mt-3">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between">
              <span><i class="bi bi-journal-text me-2"></i>Proceedings</span>
              <button class="btn btn-sm btn-outline-primary" (click)="showForm=!showForm">+ Add</button>
            </div>
            <div *ngIf="showForm" class="card-body border-bottom bg-light">
              <div class="mb-2">
                <label class="form-label mb-1">Notes</label>
                <textarea class="form-control" rows="3" [(ngModel)]="procForm.notes" placeholder="Proceeding notes..."></textarea>
              </div>
              <div class="mb-2">
                <label class="form-label mb-1">Status</label>
                <input class="form-control" [(ngModel)]="procForm.status" placeholder="e.g. IN_PROGRESS">
              </div>
              <button class="btn btn-sm btn-success" (click)="addProceeding()">Add Proceeding</button>
            </div>
            <div class="card-body p-0">
              <div *ngFor="let p of proceedings; let i=index" class="p-3 border-bottom">
                <div class="d-flex justify-content-between">
                  <strong>Proceeding #{{ i+1 }}</strong>
                  <span>{{ p.date | date:'mediumDate' }}</span>
                </div>
                <p class="mb-1 mt-1">{{ p.notes }}</p>
                <span class="badge bg-secondary">{{ p.status }}</span>
              </div>
              <div *ngIf="proceedings.length===0" class="text-center text-muted py-3">No proceedings recorded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
  `
})
export class HearingDetailComponent implements OnInit {
  hearing!: HearingResponse;
  caseData: CaseResponse | null = null;
  proceedings: ProceedingResponse[] = [];
  loading = true;
  newStatus = '';
  statusMsg = '';
  showForm = false;
  procForm = { notes: '', status: 'IN_PROGRESS' };
  statuses = ['SCHEDULED','IN_PROGRESS','COMPLETED','ADJOURNED','CANCELLED'];

  constructor(private route: ActivatedRoute, private api: HearingApiService, private caseApi: CaseApiService, private auth: AuthService) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.api.getById(id).subscribe(h => { 
      this.hearing = h; 
      this.newStatus = h.status;
      // Fetch case details
      this.caseApi.getById(h.caseId).subscribe(c => this.caseData = c);
      this.loading = false; 
    });
    this.api.getProceedings(id).subscribe(p => this.proceedings = p);
  }

  updateStatus(): void {
    this.api.updateStatus(this.hearing.hearingId, this.newStatus).subscribe(h => {
      this.hearing = h; this.statusMsg = 'Updated!'; setTimeout(() => this.statusMsg = '', 2000);
    });
  }

  addProceeding(): void {
    const req = { hearingId: this.hearing.hearingId, ...this.procForm };
    this.api.addProceeding(this.hearing.hearingId, req as any).subscribe(p => {
      this.proceedings = [...this.proceedings, p]; this.showForm = false; this.procForm = { notes: '', status: 'IN_PROGRESS' };
    });
  }

  badge(s: string): string {
    const m: Record<string,string> = { SCHEDULED:'bg-primary', IN_PROGRESS:'bg-info text-dark', COMPLETED:'bg-success', ADJOURNED:'bg-warning text-dark', CANCELLED:'bg-danger' };
    return m[s] ?? 'bg-secondary';
  }

  caseStatusBadge(s: string): string {
    const m: Record<string,string> = { FILED:'bg-secondary', ACTIVE:'bg-success', CLOSED:'bg-dark', UNDER_REVIEW:'bg-warning text-dark', HEARING_SCHEDULED:'bg-info text-dark', JUDGMENT_PENDING:'bg-danger', DISMISSED:'bg-secondary' };
    return m[s] ?? 'bg-secondary';
  }
}