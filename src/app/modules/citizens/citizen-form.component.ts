import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CitizenApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl : './citizen-form.html'
})
export class CitizenFormComponent implements OnInit {
  form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private api: CitizenApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  get currentUserName(): string { return this.auth.currentUser?.name ?? ''; }
  get currentUserEmail(): string { return this.auth.currentUser?.email ?? ''; }

  ngOnInit(): void {
    // Auto-fill userId from logged-in session — no dropdown needed
    this.form.userId = this.auth.currentUser?.userId ?? 0;
    this.form.name = this.auth.currentUser?.name ?? '';
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.api.create(this.form as any).subscribe({
      next: c => {
        this.success = 'Profile registered successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/citizens', c.citizenId]), 1200);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to register profile';
        this.loading = false;
      }
    });
  }
}
