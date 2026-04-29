import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CaseApiService, CitizenApiService } from '../../core/services/api.service';
import { CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header d-flex align-items-center justify-content-between">
      <div>
        <h4><i class="bi bi-folder2-open me-2"></i>
          {{ isCitizen ? 'My Cases' : isLawyer ? 'My Assigned Cases' : 'All Cases' }}
        </h4>
        <small class="text-muted">{{ filtered.length }} case(s) found</small>
      </div>
      <a *ngIf="isCitizen" routerLink="/cases/new" class="btn btn-primary">
        <i class="bi bi-plus me-1"></i>File New Case
      </a>
    </div>

    <div class="p-4">
      <!-- Filter bar -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-4">
              <input class="form-control form-control-sm" placeholder="Search by title or citizen..."
                     [(ngModel)]="searchTerm" (input)="applyFilter()">
            </div>
            <div class="col-md-3">
              <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (change)="applyFilter()">
                <option value="">All Statuses</option>
                <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-md-3" *ngIf="!isCitizen && !isLawyer">
              <select class="form-select form-select-sm" [(ngModel)]="filterAssigned" (change)="applyFilter()">
                <option value="">All (Assigned &amp; Unassigned)</option>
                <option value="assigned">Lawyer Assigned</option>
                <option value="unassigned">No Lawyer Assigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Loading cases...</p>
          </div>
          <div class="table-responsive" *ngIf="!loading">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th *ngIf="!isCitizen">Citizen</th>
                  <th>Lawyer</th>
                  <th>Filed Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of filtered">
                  <td><strong>#{{ c.caseId }}</strong></td>
                  <td>{{ c.title }}</td>
                  <td *ngIf="!isCitizen">{{ c.citizenName }}</td>
                  <td>
                    <span *ngIf="c.lawyerName" class="badge bg-success">
                      <i class="bi bi-briefcase me-1"></i>{{ c.lawyerName }}
                    </span>
                    <span *ngIf="!c.lawyerName" class="text-muted small fst-italic">Not assigned</span>
                  </td>
                  <td>{{ c.filedDate | date:'mediumDate' }}</td>
                  <td><span class="badge" [ngClass]="badge(c.status)">{{ c.status }}</span></td>
                  <td>
                    <a [routerLink]="['/cases', c.caseId]" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>View
                    </a>
                  </td>
                </tr>
                <tr *ngIf="filtered.length === 0 && !loading">
                  <td [attr.colspan]="isCitizen ? 6 : 7" class="text-center text-muted py-5">
                    <i class="bi bi-folder-x" style="font-size:2.5rem;opacity:0.4"></i>
                    <p class="mt-2 mb-0">
                      {{ isCitizen ? 'You have no cases filed yet.' :
                         isLawyer ? 'No cases have been assigned to you yet.' :
                         'No cases found.' }}
                    </p>
                    <a *ngIf="isCitizen" routerLink="/cases/new" class="btn btn-primary btn-sm mt-2">
                      <i class="bi bi-plus me-1"></i>File Your First Case
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CasesListComponent implements OnInit {
  cases: CaseResponse[] = [];
  filtered: CaseResponse[] = [];
  loading = true;
  searchTerm = '';
  filterStatus = '';
  filterAssigned = '';
  statuses = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED', 'DISMISSED'];

  constructor(
    private api: CaseApiService,
    private citizenApi: CitizenApiService,
    public auth: AuthService
  ) {}

  get isCitizen() { return this.auth.hasRole('CITIZEN'); }
  get isLawyer() { return this.auth.hasRole('LAWYER'); }
  get isClerk() { return this.auth.hasRole('CLERK'); }
  get isAdmin() { return this.auth.hasRole('ADMIN'); }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) { this.loading = false; return; }

    if (this.isCitizen) {
      // Citizen: get their citizen profile first, then fetch their cases
      this.citizenApi.getByUserId(userId).subscribe({
        next: citizen => {
          this.api.getByCitizen(citizen.citizenId).subscribe({
            next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
            error: () => this.loading = false
          });
        },
        error: () => {
          // Fallback: show all (profile not created yet)
          this.api.getAll().subscribe({
            next: d => { this.cases = d.filter(c => c.citizenName === this.auth.currentUser?.name); this.applyFilter(); this.loading = false; },
            error: () => this.loading = false
          });
        }
      });
    } else if (this.isLawyer) {
      // Lawyer: only cases assigned to them
      this.api.getByLawyer(userId).subscribe({
        next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
        error: () => {
          // fallback: filter all cases by lawyerId
          this.api.getAll().subscribe({
            next: all => {
              this.cases = all.filter(c => c.lawyerId === userId);
              this.applyFilter();
              this.loading = false;
            },
            error: () => this.loading = false
          });
        }
      });
    } else {
      // Clerk, Admin, Judge, Compliance: see all cases
      this.api.getAll().subscribe({
        next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  applyFilter(): void {
    this.filtered = this.cases.filter(c => {
      const matchStatus = !this.filterStatus || c.status === this.filterStatus;
      const matchSearch = !this.searchTerm ||
        c.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.citizenName?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchAssigned = !this.filterAssigned ||
        (this.filterAssigned === 'assigned' ? !!c.lawyerName : !c.lawyerName);
      return matchStatus && matchSearch && matchAssigned;
    });
  }

  badge(s: string): string {
    const m: Record<string, string> = {
      FILED: 'bg-secondary', ACTIVE: 'bg-success', CLOSED: 'bg-dark',
      UNDER_REVIEW: 'bg-warning text-dark', HEARING_SCHEDULED: 'bg-info text-dark',
      JUDGMENT_PENDING: 'bg-danger', DISMISSED: 'bg-secondary'
    };
    return m[s] ?? 'bg-secondary';
  }
}
