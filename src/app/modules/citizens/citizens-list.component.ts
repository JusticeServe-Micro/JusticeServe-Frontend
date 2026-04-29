import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
import { CitizenResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizens-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-people me-2"></i>{{ isLawyer ? 'My Clients' : 'Citizens' }}</h4>
      <a *ngIf="!isLawyer" routerLink="/citizens/new" class="btn btn-primary"><i class="bi bi-person-plus me-1"></i>Register Citizen</a>
    </div>
    <div class="p-4">
      <div class="card mb-3">
        <div class="card-body py-2">
          <input class="form-control form-control-sm w-50" placeholder="Search by name..." [(ngModel)]="search">
        </div>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
          <div class="table-responsive" *ngIf="!loading">
            <table class="table table-hover mb-0">
              <thead><tr>
                <th>ID</th><th>Name</th><th>Gender</th><th>DOB</th><th>Contact</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                <tr *ngFor="let c of filtered">
                  <td>#{{ c.citizenId }}</td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td>{{ c.gender || '—' }}</td>
                  <td>{{ c.dob ? (c.dob | date:'mediumDate') : '—' }}</td>
                  <td>{{ c.contactInfo || '—' }}</td>
                  <td><span class="badge" [ngClass]="c.status==='ACTIVE'?'bg-success':'bg-danger'">{{ c.status }}</span></td>
                  <td>
                    <a [routerLink]="['/citizens', c.citizenId]" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye"></i>
                    </a>
                  </td>
                </tr>
                <tr *ngIf="filtered.length===0">
                  <td colspan="7" class="text-center text-muted py-4">No citizens found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CitizensListComponent implements OnInit {
  citizens: CitizenResponse[] = [];
  loading = true;
  search = '';

  constructor(private api: CitizenApiService, private caseApi: CaseApiService, private auth: AuthService) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

  get filtered(): CitizenResponse[] {
    return this.citizens.filter(c =>
      !this.search || c.name?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  ngOnInit(): void {
    if (this.isLawyer) {
      // For lawyers, fetch their cases and then get the citizens from those cases
      const userId = this.auth.currentUser?.userId;
      if (!userId) { this.loading = false; return; }
      this.caseApi.getByLawyer(userId).subscribe({
        next: cases => {
          const citizenIds = new Set((cases as any[]).map(c => c.citizenId));
          this.api.getAll().subscribe({
            next: allCitizens => {
              this.citizens = (allCitizens as any[]).filter(c => citizenIds.has(c.citizenId));
              this.loading = false;
            },
            error: () => this.loading = false
          });
        },
        error: () => this.loading = false
      });
    } else {
      this.api.getAll().subscribe({ next: d => { this.citizens = d; this.loading = false; }, error: () => this.loading = false });
    }
  }
}
