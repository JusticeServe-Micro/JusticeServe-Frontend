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
  templateUrl :"./judgment-form.html"
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