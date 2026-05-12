import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CitizenApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { CitizenResponse, DocumentResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl:"./my-profile.html",
  styles: [`
    .profile-card {
      border: none;
      border-radius: 1.25rem;
      box-shadow: 0 22px 45px rgba(15, 23, 42, 0.08);
    }
    .profile-card .card-header {
      background: linear-gradient(135deg, rgba(26,58,92,0.95), rgba(46,109,164,0.95));
      color: #fff;
      border: none;
      letter-spacing: 0.03em;
    }
    .profile-card .profile-avatar {
      width: 100px;
      height: 100px;
      font-size: 2.25rem;
      border-radius: 50%;
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
    }
    .profile-card .profile-avatar i {
      line-height: 1;
    }
    .profile-card .profile-gender-icon {
      font-size: 2.3rem;
    }
    .profile-card .profile-field {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
    .profile-card .profile-field:last-child { border-bottom: none; }
    .profile-card .profile-field-label {
      width: 125px;
      color: #64748b;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .profile-card .profile-field-value {
      color: #0f172a;
      font-weight: 600;
    }
    .profile-card .profile-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      font-size: 0.82rem;
      color: #fff;
    }
    .profile-card .profile-badge.bg-primary { background-color: #0d6efd !important; }
    .profile-card .profile-badge.bg-danger { background-color: #d63384 !important; }
    .profile-card .profile-info-card {
      border-radius: 1.15rem;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.06);
    }
    .profile-card .profile-info-card .card-body {
      padding: 1.5rem;
    }
    .profile-card .profile-stat {
      border-radius: 1rem;
      padding: 1rem 1.2rem;
      background: #eff6ff;
      border: 1px solid rgba(99, 102, 241, 0.15);
      color: #1d4ed8;
      min-height: 90px;
    }
    .profile-card .profile-stat h6 {
      margin-bottom: 0.45rem;
      font-size: 0.92rem;
      letter-spacing: 0.02em;
    }
    .profile-card .profile-stat .stat-value {
      font-size: 1.45rem;
      font-weight: 700;
      color: #0f172a;
    }
    .profile-card .profile-header {
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .profile-card .profile-header h5 {
      margin-bottom: 0.25rem;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .profile-card .profile-header p {
      color: #94a3b8;
      margin-bottom: 0;
    }
  `]
})
export class MyProfileComponent implements OnInit {
  citizen: CitizenResponse | null = null;
  documents: DocumentResponse[] = [];
  cases: CaseResponse[] = [];
  loading = true;
  saving = false;
  error = '';
  phone = ''; // Store registered phone number

  // document state
  showDocForm = false;
  docType = '';
  fileUri = '';
  docTypes = ['PETITION', 'EVIDENCE', 'ORDER', 'ID_PROOF', 'LEGAL_DOC'];

  // edit state
  editing = false;

  form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };

  get isDobAdult(): boolean {
    if (!this.form.dob) return false;
    const dob = new Date(this.form.dob);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age >= 18;
  }

  private ageValidationMessage(): string {
    return 'You must be 18 years or older to create a profile.';
  }

  constructor(
    public auth: AuthService,
    private citizenApi: CitizenApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    private router: Router
  ) {}

  // get genderIconClass(): string {
  //   const gender = this.citizen?.gender?.toLowerCase();
  //   if (gender === 'female') return 'bi-gender-female';
  //   if (gender === 'male') return 'bi-gender-male';
  //   return 'bi-person-circle';
  // }

  // get genderBadgeClass(): string {
  //   const gender = this.citizen?.gender?.toLowerCase();
  //   if (gender === 'female') return 'bg-danger';
  //   if (gender === 'male') return 'bg-primary';
  //   return 'bg-secondary';
  // }
  

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) { this.loading = false; return; }
    this.form.userId = userId;
    this.form.name = this.auth.currentUser?.name ?? '';

    // Fetch user details to get phone
    this.userApi.getById(userId).subscribe({
      next: user => {
        this.phone = user.phone ?? '';
        this.form.contactInfo = this.phone;
      },
      error: () => {
        this.phone = '';
        this.form.contactInfo = '';
      }
    });

    this.citizenApi.getByUserId(userId).subscribe({
      next: c => {
        this.citizen = c;
        this.loading = false;
        this.populateForm(c);
        this.loadRelated(c.citizenId);
      },
      error: () => {
        this.citizen = null;
        this.loading = false;
      }
    });
  }

  populateForm(c: CitizenResponse): void {
    this.form.name = c.name;
    this.form.dob = c.dob;
    this.form.gender = c.gender;
    this.form.address = c.address;
    // Preserve the registered phone number if citizen contactInfo is empty
    this.form.contactInfo = c.contactInfo || this.phone;
  }

  startEdit(): void {
    this.editing = true;
    if (this.citizen) this.populateForm(this.citizen);
  }

  cancelEdit(): void {
    this.editing = false;
    if (this.citizen) this.populateForm(this.citizen);
  }

  updateProfile(form?: any): void {
    if (form && form.invalid) return;
    if (!this.isDobAdult) {
      this.error = this.ageValidationMessage();
      return;
    }
    if (!this.citizen) return;
    this.saving = true; this.error = '';
    this.citizenApi.update(this.citizen.citizenId, this.form as any).subscribe({
      next: c => {
        this.citizen = c;
        this.editing = false;
        this.saving = false;
      },
      error: e => { this.error = e.error?.message || 'Failed to update profile'; this.saving = false; }
    });
  }

  loadRelated(citizenId: number): void {
    this.citizenApi.getDocuments(citizenId).subscribe(d => this.documents = d);
    this.caseApi.getByCitizen(citizenId).subscribe(c => this.cases = c);
  }

  registerProfile(form?: any): void {
    if (form && form.invalid) return;
    if (!this.isDobAdult) {
      this.error = this.ageValidationMessage();
      return;
    }
    this.saving = true; this.error = '';
    this.citizenApi.create(this.form as any).subscribe({
      next: c => {
        this.citizen = c;
        this.saving = false;
        this.loadRelated(c.citizenId);
      },
      error: e => { this.error = e.error?.message || 'Failed to save profile'; this.saving = false; }
    });
  }

  addDoc(): void {
    if (!this.docType || !this.fileUri || !this.citizen) return;
    this.citizenApi.addDocument(this.citizen.citizenId, {
      docType: this.docType, fileUri: this.fileUri
    } as any).subscribe(d => {
      this.documents = [...this.documents, d];
      this.showDocForm = false;
      this.docType = ''; this.fileUri = '';
    });
  }
}
