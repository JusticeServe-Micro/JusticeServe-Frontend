import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HearingApiService, CaseApiService, CitizenApiService } from '../../core/services/api.service';
import { HearingResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hearings-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./hearings-list.html",
})
export class HearingsListComponent implements OnInit {
  hearings: HearingResponse[] = [];
  loading = true;
  search = '';
  filterStatus = '';
  statuses = ['SCHEDULED','IN_PROGRESS','COMPLETED','ADJOURNED','CANCELLED'];

  constructor(private api: HearingApiService, private caseApi: CaseApiService, private citizenApi: CitizenApiService, private auth: AuthService) {}

  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }
  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }
  get isAuditorOrCompliance(): boolean { return this.auth.hasRole('AUDITOR') || this.auth.hasRole('COMPLIANCE'); }
  get isJudge(): boolean { return this.auth.hasRole('JUDGE'); }

  get filtered(): HearingResponse[] {
    return this.hearings.filter(h =>
      (!this.filterStatus || h.status === this.filterStatus) &&
      (!this.search || h.caseTitle?.toLowerCase().includes(this.search.toLowerCase()))
    );
  }

  ngOnInit(): void {
    if (this.isLawyer) {
      // For lawyers, fetch cases first, then hearings for those cases
      this.caseApi.getAll().subscribe({
        next: cases => {
          const userId = this.auth.currentUser?.userId;
          if (!userId) { this.loading = false; return; }
          const myCases = cases.filter(c => c.lawyerId === userId);
          if (myCases.length === 0) { this.hearings = []; this.loading = false; return; }
          // Fetch hearings for each case
          const allHearings: HearingResponse[] = [];
          let pending = myCases.length;
          myCases.forEach(c => {
            this.api.getByCase(c.caseId).subscribe({
              next: caseHearings => {
                allHearings.push(...caseHearings);
                pending--;
                if (pending === 0) {
                  this.hearings = allHearings;
                  this.loading = false;
                }
              },
              error: () => {
                pending--;
                if (pending === 0) {
                  this.hearings = allHearings;
                  this.loading = false;
                }
              }
            });
          });
        },
        error: () => this.loading = false
      });
    } else if (this.isJudge) {
      const userId = this.auth.currentUser?.userId;
      if (!userId) { this.loading = false; return; }
      this.api.getAll().subscribe({
        next: allHearings => {
          this.hearings = allHearings.filter(h => h.judgeId === userId);
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else if (this.isCitizen) {
      const userId = this.auth.currentUser?.userId;
      if (!userId) { this.loading = false; return; }

      this.citizenApi.getByUserId(userId).subscribe({
        next: citizen => {
          this.caseApi.getByCitizen(citizen.citizenId).subscribe({
            next: cases => {
              if (cases.length === 0) { this.hearings = []; this.loading = false; return; }
              const allHearings: HearingResponse[] = [];
              let pending = cases.length;
              cases.forEach(c => {
                this.api.getByCase(c.caseId).subscribe({
                  next: caseHearings => {
                    allHearings.push(...caseHearings);
                    pending -= 1;
                    if (pending === 0) {
                      this.hearings = allHearings;
                      this.loading = false;
                    }
                  },
                  error: () => {
                    pending -= 1;
                    if (pending === 0) {
                      this.hearings = allHearings;
                      this.loading = false;
                    }
                  }
                });
              });
            },
            error: () => { this.hearings = []; this.loading = false; }
          });
        },
        error: () => { this.hearings = []; this.loading = false; }
      });
    } else {
      this.api.getAll().subscribe({ next: d => { this.hearings = d; this.loading = false; }, error: () => this.loading = false });
    }
  }

  badge(s: string): string {
    const m: Record<string,string> = { SCHEDULED:'bg-primary', IN_PROGRESS:'bg-info text-dark', COMPLETED:'bg-success', ADJOURNED:'bg-warning text-dark', CANCELLED:'bg-danger' };
    return m[s] ?? 'bg-secondary';
  }
}
