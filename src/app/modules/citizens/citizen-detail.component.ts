import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
import { CitizenResponse, DocumentResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizen-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-person me-2"></i>Citizen Profile</h4>
      <a routerLink="/citizens" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i>Back</a>
    </div>
    <div class="p-4" *ngIf="!loading && citizen">
      <div class="row g-3">
        <div class="col-lg-4">
          <div class="card text-center p-4">
            <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto mb-3"
                 style="width:80px;height:80px;font-size:2rem;color:#fff">
              {{ citizen.name[0] }}
            </div>
            <h5 class="fw-bold">{{ citizen.name }}</h5>
            <span class="badge mb-2" [ngClass]="citizen.status==='ACTIVE'?'bg-success':'bg-danger'">{{ citizen.status }}</span>
            <div class="text-muted" style="font-size:0.85rem">Citizen ID: #{{ citizen.citizenId }}</div>
            <hr>
            <div class="text-start">
              <div class="mb-2"><i class="bi bi-calendar3 me-2 text-muted"></i>{{ citizen.dob ? (citizen.dob | date:'mediumDate') : 'N/A' }}</div>
              <div class="mb-2"><i class="bi bi-gender-ambiguous me-2 text-muted"></i>{{ citizen.gender || 'N/A' }}</div>
              <div class="mb-2"><i class="bi bi-telephone me-2 text-muted"></i>{{ citizen.contactInfo || 'N/A' }}</div>
              <div><i class="bi bi-geo-alt me-2 text-muted"></i>{{ citizen.address || 'N/A' }}</div>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <!-- Documents -->
          <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span><i class="bi bi-file-earmark me-2"></i>Documents</span>
            </div>

            <!-- Document list - Read Only -->
            <div class="card-body p-0">
              <table class="table table-sm mb-0">
                <thead><tr><th>Type</th><th>File</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let d of documents">
                    <td><span class="badge bg-secondary">{{ d.docType }}</span></td>
                    <td>
                      <a [href]="d.fileUri" target="_blank" class="text-truncate d-inline-block" style="max-width:140px">
                        <i class="bi bi-file-earmark me-1"></i>{{ d.fileUri }}
                      </a>
                    </td>
                    <td>{{ d.uploadedDate | date:'mediumDate' }}</td>
                    <td><span class="badge" [ngClass]="vbadge(d.verificationStatus)">{{ d.verificationStatus }}</span></td>
                  </tr>
                  <tr *ngIf="documents.length===0">
                    <td colspan="4" class="text-center text-muted py-3">
                      <i class="bi bi-file-earmark me-2"></i>No documents uploaded yet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Cases -->
          <div class="card">
            <div class="card-header"><i class="bi bi-folder2-open me-2"></i>{{ isLawyer ? 'Cases Assigned to you' : 'Cases Filed' }}</div>
            <div class="card-body p-0">
              <table class="table table-sm mb-0">
                <thead><tr><th>ID</th><th>Title</th><th>Filed</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of filteredCases">
                    <td>#{{ c.caseId }}</td>
                    <td>{{ c.title }}</td>
                    <td>{{ c.filedDate | date:'mediumDate' }}</td>
                    <td><span class="badge bg-secondary">{{ c.status }}</span></td>
                    <td><a [routerLink]="['/cases', c.caseId]" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a></td>
                  </tr>
                  <tr *ngIf="filteredCases.length===0"><td colspan="5" class="text-center text-muted py-2">No cases</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
  `
})
export class CitizenDetailComponent implements OnInit {
  citizen!: CitizenResponse;
  documents: DocumentResponse[] = [];
  cases: CaseResponse[] = [];
  loading = true;
  showDocForm = false;
  docType = '';
  fileUri = '';
  docTypes = ['PETITION','EVIDENCE','ORDER','ID_PROOF','LEGAL_DOC'];

  constructor(
    private route: ActivatedRoute,
    private api: CitizenApiService,
    private caseApi: CaseApiService,
    private auth: AuthService
  ) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

  get filteredCases(): CaseResponse[] {
    if (!this.isLawyer) return this.cases;
    // For lawyers, show only cases where they are the assigned lawyer
    const userId = this.auth.currentUser?.userId;
    return this.cases.filter(c => (c as any).lawyerId === userId);
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.api.getById(id).subscribe(c => { this.citizen = c; this.loading = false; });
    this.api.getDocuments(id).subscribe(d => this.documents = d);
    this.caseApi.getByCitizen(id).subscribe(c => this.cases = c);
  }

  addDoc(): void {
    if (!this.docType || !this.fileUri) return;
    this.api.addDocument(this.citizen.citizenId, { docType: this.docType, fileUri: this.fileUri } as any).subscribe(d => {
      this.documents = [...this.documents, d];
      this.showDocForm = false;
      this.docType = ''; this.fileUri = '';
    });
  }

  verify(docId: number, status: string): void {
    this.api.verifyDocument(this.citizen.citizenId, docId, status).subscribe(d => {
      this.documents = this.documents.map(x => x.documentId === docId ? d : x);
    });
  }

  getFileName(fileUri: string): string {
    if (!fileUri) return 'document';
    const parts = fileUri.split('/');
    const raw = parts[parts.length - 1];
    const match = raw.match(/^\d+_[a-f0-9]+\.(.+)$/);
    return match ? `document.${match[1]}` : raw;
  }

  fileIcon(fileUri: string): string {
    const ext = (fileUri || '').split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'bi-file-earmark-pdf text-danger';
    if (['jpg','jpeg','png'].includes(ext)) return 'bi-file-earmark-image text-success';
    if (['doc','docx'].includes(ext)) return 'bi-file-earmark-word text-primary';
    return 'bi-file-earmark';
  }

  vbadge(s: string): string {
    return s === 'VERIFIED' ? 'bg-success' : s === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark';
  }
}
