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
  templateUrl:"./hearing-detail.html"
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
