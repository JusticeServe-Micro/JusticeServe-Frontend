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
  templateUrl:"./my-profile.html"
})
export class MyProfileComponent implements OnInit {
  citizen: CitizenResponse | null = null;
  documents: DocumentResponse[] = [];
  cases: CaseResponse[] = [];
  loading = true;
  saving = false;
  error = '';

  // document state
  showDocForm = false;
  docType = '';
  fileUri = '';
  docTypes = ['PETITION', 'EVIDENCE', 'ORDER', 'ID_PROOF', 'LEGAL_DOC'];

  // edit state
  editing = false;

  form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };

  constructor(
    public auth: AuthService,
    private citizenApi: CitizenApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) { this.loading = false; return; }
    this.form.userId = userId;
    this.form.name = this.auth.currentUser?.name ?? '';

    // Fetch user details to get phone
    this.userApi.getById(userId).subscribe({
      next: user => {
        this.form.contactInfo = user.phone ?? '';
      },
      error: () => {
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
    this.form.contactInfo = c.contactInfo;
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
