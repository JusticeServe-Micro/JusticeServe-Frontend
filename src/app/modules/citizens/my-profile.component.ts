// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterLink, Router } from '@angular/router';
// import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
// import { CitizenResponse, DocumentResponse, CaseResponse } from '../../shared/models/models';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-my-profile',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   template: `
//     <div *ngIf="loading" class="text-center py-5">
//       <div class="spinner-border text-primary"></div>
//     </div>

//     <!-- Not registered yet -->
//     <div *ngIf="!loading && !citizen">
//       <div class="page-header">
//         <h4><i class="bi bi-person-plus me-2"></i>Complete Your Citizen Profile</h4>
//         <p class="text-muted mb-0">You need to complete your profile before filing cases.</p>
//       </div>
//       <div class="p-4">
//         <div class="row justify-content-center">
//           <div class="col-lg-7">
//             <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
//               <i class="bi bi-person-circle fs-5"></i>
//               <div>Registering profile for <strong>{{ auth.currentUser?.name }}</strong> ({{ auth.currentUser?.email }})</div>
//             </div>
//             <div class="card">
//               <div class="card-body p-4">
//                 <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
//                 <form (ngSubmit)="registerProfile()">
//                   <div class="mb-3">
//                     <label class="form-label">Full Name <span class="text-danger">*</span></label>
//                     <input class="form-control" [(ngModel)]="form.name" name="name" required>
//                   </div>
//                   <div class="row g-3">
//                     <div class="col-md-6">
//                       <label class="form-label">Date of Birth</label>
//                       <input type="date" class="form-control" [(ngModel)]="form.dob" name="dob">
//                     </div>
//                     <div class="col-md-6">
//                       <label class="form-label">Gender</label>
//                       <select class="form-select" [(ngModel)]="form.gender" name="gender">
//                         <option value="">Select...</option>
//                         <option>Male</option><option>Female</option><option>Other</option>
//                       </select>
//                     </div>
//                     <div class="col-12">
//                       <label class="form-label">Address</label>
//                       <textarea class="form-control" rows="2" [(ngModel)]="form.address" name="address" placeholder="123 Main St, City"></textarea>
//                     </div>
//                     <div class="col-12">
//                       <label class="form-label">Contact Info</label>
//                       <input class="form-control" [(ngModel)]="form.contactInfo" name="contactInfo" placeholder="+91 9999999999">
//                     </div>
//                   </div>
//                   <button type="submit" class="btn btn-primary mt-4" [disabled]="saving">
//                     <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>Save Profile
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>

//     <!-- Profile registered -->
//     <div *ngIf="!loading && citizen">
//       <div class="page-header d-flex justify-content-between align-items-center">
//         <h4><i class="bi bi-person me-2"></i>My Profile</h4>
//         <a routerLink="/cases/new" class="btn btn-primary"><i class="bi bi-folder-plus me-1"></i>File a Case</a>
//       </div>
//       <div class="p-4">
//         <div class="row g-3">

//           <!-- Left: info card -->
//           <div class="col-lg-4">
//             <div class="card text-center p-4">
//               <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto mb-3"
//                    style="width:80px;height:80px;font-size:2rem;color:#fff">
//                 {{ citizen.name[0] }}
//               </div>
//               <h5 class="fw-bold">{{ citizen.name }}</h5>
//               <span class="badge bg-success mb-2">{{ citizen.status }}</span>
//               <div class="text-muted mb-3" style="font-size:0.85rem">Citizen ID: #{{ citizen.citizenId }}</div>
//               <hr>
//               <div class="text-start">
//                 <div class="mb-2"><i class="bi bi-calendar3 me-2 text-muted"></i>{{ citizen.dob ? (citizen.dob | date:'mediumDate') : 'N/A' }}</div>
//                 <div class="mb-2"><i class="bi bi-gender-ambiguous me-2 text-muted"></i>{{ citizen.gender || 'N/A' }}</div>
//                 <div class="mb-2"><i class="bi bi-telephone me-2 text-muted"></i>{{ citizen.contactInfo || 'N/A' }}</div>
//                 <div><i class="bi bi-geo-alt me-2 text-muted"></i>{{ citizen.address || 'N/A' }}</div>
//               </div>
//             </div>
//           </div>

//           <!-- Right: documents + cases -->
//           <div class="col-lg-8">

//             <!-- Documents -->
//             <div class="card mb-3">
//               <div class="card-header d-flex justify-content-between align-items-center">
//                 <span><i class="bi bi-file-earmark me-2"></i>My Documents
//                   <span class="badge bg-secondary ms-1">{{ documents.length }}</span>
//                 </span>
//                 <button class="btn btn-sm btn-outline-primary" (click)="showDocForm=!showDocForm">
//                   <i class="bi bi-cloud-upload me-1"></i>Upload Document
//                 </button>
//               </div>

//               <!-- Upload form -->
//               <div *ngIf="showDocForm" class="card-body border-bottom bg-light">
//                 <div class="row g-2 align-items-end">
//                   <div class="col-md-3">
//                     <label class="form-label small mb-1">Document Type</label>
//                     <select class="form-select form-select-sm" [(ngModel)]="docType">
//                       <option value="">Select type...</option>
//                       <option *ngFor="let t of docTypes" [value]="t">{{ t }}</option>
//                     </select>
//                   </div>
//                   <div class="col-md-7">
//                     <label class="form-label small mb-1">File URL / Path</label>
//                     <input class="form-control form-control-sm" [(ngModel)]="fileUri"
//                            placeholder="e.g. https://drive.google.com/file/... or /uploads/doc.pdf">
//                   </div>
//                   <div class="col-md-2">
//                     <button class="btn btn-sm btn-success w-100" (click)="addDoc()">
//                       <i class="bi bi-plus"></i> Add
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <!-- Document list -->
//               <div class="card-body p-0">
//                 <table class="table table-sm mb-0">
//                   <thead class="table-light">
//                     <tr><th>Type</th><th>File</th><th>Date</th><th>Verification</th></tr>
//                   </thead>
//                   <tbody>
//                     <tr *ngFor="let d of documents">
//                       <td><span class="badge bg-secondary">{{ d.docType }}</span></td>
//                       <td>
//                         <a [href]="d.fileUri" target="_blank" class="text-truncate d-inline-block" style="max-width:160px">
//                           <i class="bi bi-file-earmark me-1"></i>{{ d.fileUri }}
//                         </a>
//                       </td>
//                       <td>{{ d.uploadedDate | date:'mediumDate' }}</td>
//                       <td>
//                         <span class="badge"
//                           [ngClass]="d.verificationStatus==='VERIFIED'?'bg-success':
//                                      d.verificationStatus==='REJECTED'?'bg-danger':'bg-warning text-dark'">
//                           {{ d.verificationStatus }}
//                         </span>
//                       </td>
//                     </tr>
//                     <tr *ngIf="documents.length===0">
//                       <td colspan="4" class="text-center text-muted py-3">
//                         <i class="bi bi-cloud-upload me-2"></i>No documents uploaded yet.
//                         Click "Upload Document" to add your first document.
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <!-- My Cases -->
//             <div class="card">
//               <div class="card-header d-flex justify-content-between align-items-center">
//                 <span><i class="bi bi-folder2-open me-2"></i>My Cases
//                   <span class="badge bg-secondary ms-1">{{ cases.length }}</span>
//                 </span>
//                 <a routerLink="/cases/new" class="btn btn-sm btn-outline-primary">
//                   <i class="bi bi-plus me-1"></i>File New Case
//                 </a>
//               </div>
//               <div class="card-body p-0">
//                 <table class="table table-sm mb-0">
//                   <thead class="table-light">
//                     <tr><th>ID</th><th>Title</th><th>Lawyer</th><th>Filed</th><th>Status</th><th></th></tr>
//                   </thead>
//                   <tbody>
//                     <tr *ngFor="let c of cases">
//                       <td><strong>#{{ c.caseId }}</strong></td>
//                       <td>{{ c.title }}</td>
//                       <td>
//                         <span *ngIf="c.lawyerName" class="badge bg-success">{{ c.lawyerName }}</span>
//                         <span *ngIf="!c.lawyerName" class="text-muted small fst-italic">Pending</span>
//                       </td>
//                       <td>{{ c.filedDate | date:'mediumDate' }}</td>
//                       <td>
//                         <span class="badge"
//                           [ngClass]="c.status==='ACTIVE'?'bg-success':
//                                      c.status==='CLOSED'?'bg-dark':
//                                      c.status==='FILED'?'bg-secondary':
//                                      c.status==='DISMISSED'?'bg-danger':'bg-warning text-dark'">
//                           {{ c.status }}
//                         </span>
//                       </td>
//                       <td>
//                         <a [routerLink]="['/cases', c.caseId]" class="btn btn-sm btn-outline-primary">
//                           <i class="bi bi-eye"></i>
//                         </a>
//                       </td>
//                     </tr>
//                     <tr *ngIf="cases.length===0">
//                       <td colspan="6" class="text-center text-muted py-3">
//                         <i class="bi bi-folder-x me-2"></i>No cases filed yet.
//                         <a routerLink="/cases/new" class="ms-1">File your first case →</a>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class MyProfileComponent implements OnInit {
//   citizen: CitizenResponse | null = null;
//   documents: DocumentResponse[] = [];
//   cases: CaseResponse[] = [];
//   loading = true;
//   saving = false;
//   error = '';

//   // document state
//   showDocForm = false;
//   docType = '';
//   fileUri = '';
//   docTypes = ['PETITION', 'EVIDENCE', 'ORDER', 'ID_PROOF', 'LEGAL_DOC'];

//   form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };

//   constructor(
//     public auth: AuthService,
//     private citizenApi: CitizenApiService,
//     private caseApi: CaseApiService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     const userId = this.auth.currentUser?.userId;
//     if (!userId) { this.loading = false; return; }
//     this.form.userId = userId;
//     this.form.name = this.auth.currentUser?.name ?? '';

//     this.citizenApi.getByUserId(userId).subscribe({
//       next: c => {
//         this.citizen = c;
//         this.loading = false;
//         this.loadRelated(c.citizenId);
//       },
//       error: () => {
//         this.citizen = null;
//         this.loading = false;
//       }
//     });
//   }

//   loadRelated(citizenId: number): void {
//     this.citizenApi.getDocuments(citizenId).subscribe(d => this.documents = d);
//     this.caseApi.getByCitizen(citizenId).subscribe(c => this.cases = c);
//   }

//   registerProfile(): void {
//     this.saving = true; this.error = '';
//     this.citizenApi.create(this.form as any).subscribe({
//       next: c => {
//         this.citizen = c;
//         this.saving = false;
//         this.loadRelated(c.citizenId);
//       },
//       error: e => { this.error = e.error?.message || 'Failed to save profile'; this.saving = false; }
//     });
//   }

//   addDoc(): void {
//     if (!this.docType || !this.fileUri || !this.citizen) return;
//     this.citizenApi.addDocument(this.citizen.citizenId, {
//       docType: this.docType, fileUri: this.fileUri
//     } as any).subscribe(d => {
//       this.documents = [...this.documents, d];
//       this.showDocForm = false;
//       this.docType = ''; this.fileUri = '';
//     });
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
import { CitizenResponse, DocumentResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl : './my-profile.html'
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
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) { this.loading = false; return; }
    this.form.userId = userId;
    this.form.name = this.auth.currentUser?.name ?? '';

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

  updateProfile(): void {
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

  registerProfile(): void {
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
