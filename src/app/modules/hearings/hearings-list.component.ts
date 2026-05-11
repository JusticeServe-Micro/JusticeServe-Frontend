import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HearingApiService, CaseApiService } from '../../core/services/api.service';
import { HearingResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hearings-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl:"./hearing-list.html"
})
export class HearingsListComponent implements OnInit {
  hearings: HearingResponse[] = [];
  loading = true;
  search = '';
  filterStatus = '';
  statuses = ['SCHEDULED','IN_PROGRESS','COMPLETED','ADJOURNED','CANCELLED'];

  constructor(private api: HearingApiService, private caseApi: CaseApiService, private auth: AuthService) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

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
    } else {
      this.api.getAll().subscribe({ next: d => { this.hearings = d; this.loading = false; }, error: () => this.loading = false });
    }
  }

  badge(s: string): string {
    const m: Record<string,string> = { SCHEDULED:'bg-primary', IN_PROGRESS:'bg-info text-dark', COMPLETED:'bg-success', ADJOURNED:'bg-warning text-dark', CANCELLED:'bg-danger' };
    return m[s] ?? 'bg-secondary';
  }
}
