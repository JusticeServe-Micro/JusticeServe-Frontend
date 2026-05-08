import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CaseApiService, HearingApiService, JudgmentApiService,
  UserApiService, CitizenApiService, NotificationApiService
} from '../../core/services/api.service';
import {
  CaseResponse, CourtOrderResponse, DocumentResponse, HearingResponse,
  JudgmentResponse, ProceedingResponse, UserResponse
} from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4><i class="bi bi-folder2-open me-2"></i>Case Details</h4>
        <small class="text-muted">Case #{{ caseId }}</small>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-success btn-sm" (click)="downloadCasePDF()">
          <i class="bi bi-download me-1"></i>Download PDF
        </button>
        <a routerLink="/cases" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left me-1"></i>Back to Cases
        </a>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Loading case details...</p>
    </div>

    <div class="p-4" *ngIf="!loading && caseData">

      <!-- Toast Alert -->
      <div *ngIf="toast" class="alert d-flex align-items-center gap-2 mb-3"
           [ngClass]="toast.type === 'success' ? 'alert-success' : 'alert-danger'">
        <i class="bi" [ngClass]="toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>
        {{ toast.msg }}
      </div>

      <div class="row g-3 mb-3">

        <!-- Case Info Card -->
        <div class="col-lg-8">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-bold fs-6"><i class="bi bi-folder me-2 text-primary"></i>{{ caseData.title }}</span>
              <span class="badge fs-6 px-3" [ngClass]="badge(caseData.status)">{{ caseData.status }}</span>
            </div>
            <div class="card-body">
              <div class="row g-3">

                <!-- Citizen -->
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1">Citizen</small>
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                         style="width:32px;height:32px;font-size:0.8rem;font-weight:700">
                      {{ (caseData.citizenName || 'C')[0].toUpperCase() }}
                    </div>
                    <strong>{{ caseData.citizenName || 'Citizen #' + caseData.citizenId }}</strong>
                  </div>
                </div>

                <!-- Filed Date -->
                <div class="col-sm-6">
                  <small class="text-muted d-block mb-1">Filed Date</small>
                  <strong><i class="bi bi-calendar3 me-1 text-muted"></i>{{ caseData.filedDate | date:'longDate' }}</strong>
                </div>

                <!-- ── Assigned Lawyer ── -->
                <div class="col-12">
                  <small class="text-muted d-block mb-1">Assigned Lawyer</small>
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-2">

                    <!-- Show assigned lawyer name -->
                    <span *ngIf="caseData.lawyerName" class="badge bg-success px-3 py-2 fs-6">
                      <i class="bi bi-briefcase me-1"></i>{{ caseData.lawyerName }}
                    </span>
                    <span *ngIf="!caseData.lawyerName" class="text-muted fst-italic">
                      <i class="bi bi-clock me-1"></i>No lawyer assigned yet
                    </span>

                    <!-- Clerk/Admin controls — only when lawyer panel is closed -->
                    <ng-container *ngIf="canAssignLawyer && !showLawyerPanel">
                      <button class="btn btn-sm btn-outline-primary" (click)="toggleLawyerPanel()">
                        <i class="bi bi-person-check me-1"></i>{{ caseData.lawyerName ? 'Change Lawyer' : 'Assign Lawyer' }}
                      </button>
                      <button *ngIf="caseData.lawyerName" class="btn btn-sm btn-outline-danger"
                              (click)="removeLawyer()" [disabled]="savingLawyer">
                        <i class="bi bi-person-x me-1"></i>Remove Lawyer
                      </button>
                    </ng-container>

                    <small *ngIf="!canAssignLawyer && !caseData.lawyerName" class="text-muted">
                      Lawyer will be assigned by the court clerk
                    </small>
                  </div>

                  <!-- Assign/Change Lawyer Panel -->
                  <div *ngIf="showLawyerPanel && canAssignLawyer" class="border rounded p-3 bg-light">
                    <div class="fw-semibold mb-2 small text-uppercase text-muted">Select Lawyer to Assign</div>
                    <div class="row g-2 align-items-center">
                      <div class="col-md-7">
                        <select class="form-select" [(ngModel)]="selectedLawyerId">
                          <option value="">-- Select a Lawyer --</option>
                          <option *ngFor="let l of lawyers" [value]="l.userId.toString()">
                            {{ l.name }} · {{ l.email }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-5 d-flex gap-2">
                        <button class="btn btn-success" (click)="assignLawyer()"
                                [disabled]="!selectedLawyerId || savingLawyer">
                          <span *ngIf="savingLawyer" class="spinner-border spinner-border-sm me-1"></span>
                          <i *ngIf="!savingLawyer" class="bi bi-check-lg me-1"></i>
                          Save & Notify
                        </button>
                        <button class="btn btn-outline-secondary" (click)="showLawyerPanel = false">Cancel</button>
                      </div>
                    </div>
                    <small class="text-muted mt-1 d-block">
                      <i class="bi bi-info-circle me-1"></i>
                      Lawyer and citizen will be notified automatically.
                    </small>
                  </div>
                </div>

                <!-- ── Assigned Judge ── -->
                <div class="col-12">
                  <small class="text-muted d-block mb-1">Assigned Judge</small>
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                    <span *ngIf="caseData.judgeName" class="badge bg-info text-dark px-3 py-2 fs-6">
                      <i class="bi bi-person-badge me-1"></i>{{ caseData.judgeName }}
                    </span>
                    <span *ngIf="!caseData.judgeName" class="text-muted fst-italic">
                      <i class="bi bi-clock me-1"></i>No judge assigned yet
                    </span>

                    <ng-container *ngIf="canAssignJudge && !showJudgePanel">
                      <button class="btn btn-sm btn-outline-info" (click)="toggleJudgePanel()">
                        <i class="bi bi-person-badge me-1"></i>{{ caseData.judgeName ? 'Change Judge' : 'Assign Judge' }}
                      </button>
                    </ng-container>
                  </div>

                  <!-- Assign/Change Judge Panel -->
                  <div *ngIf="showJudgePanel && canAssignJudge" class="border rounded p-3 bg-light">
                    <div class="fw-semibold mb-2 small text-uppercase text-muted">Select Judge to Assign</div>
                    <div class="row g-2 align-items-center">
                      <div class="col-md-7">
                        <select class="form-select" [(ngModel)]="selectedJudgeId">
                          <option value="">-- Select a Judge --</option>
                          <option *ngFor="let j of judges" [value]="j.userId.toString()">
                            {{ j.name }} · {{ j.email }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-5 d-flex gap-2">
                        <button class="btn btn-info" (click)="assignJudge()"
                                [disabled]="!selectedJudgeId || savingJudge">
                          <span *ngIf="savingJudge" class="spinner-border spinner-border-sm me-1"></span>
                          <i *ngIf="!savingJudge" class="bi bi-check-lg me-1"></i>
                          Save & Notify
                        </button>
                        <button class="btn btn-outline-secondary" (click)="showJudgePanel = false">Cancel</button>
                      </div>
                    </div>
                    <small class="text-muted mt-1 d-block">
                      <i class="bi bi-info-circle me-1"></i>Judge will be notified automatically.
                    </small>
                  </div>
                </div>

                <!-- Description -->
                <div class="col-12">
                  <small class="text-muted d-block mb-1">Description</small>
                  <p class="mb-0 text-dark" style="text-align:justify;">{{ caseData.description || 'No description provided.' }}</p>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- Status & Timeline Card -->
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header fw-semibold"><i class="bi bi-activity me-2"></i>Case Progress</div>
            <div class="card-body">

              <!-- Status update for Clerk/Admin/Judge -->
              <div *ngIf="canUpdateStatus" class="mb-3">
                <label class="form-label small fw-semibold">Update Status</label>
                <select class="form-select form-select-sm mb-2" [(ngModel)]="newStatus">
                  <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                </select>
                <button class="btn btn-primary btn-sm w-100" (click)="updateStatus()" [disabled]="updatingStatus">
                  <span *ngIf="updatingStatus" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!updatingStatus" class="bi bi-arrow-repeat me-1"></i>
                  Update Status
                </button>
              </div>

              <!-- Timeline — computed from current caseData.status -->
              <div class="mt-2">
                <div class="small fw-semibold text-muted mb-2 text-uppercase">Timeline</div>
                <div *ngFor="let step of computedTimeline; let i = index"
                     class="d-flex align-items-center gap-2 mb-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                       [ngClass]="step.done ? 'bg-success text-white' : 'bg-light border text-muted'"
                       style="width:26px;height:26px;font-size:0.75rem;font-weight:700">
                    <i *ngIf="step.done" class="bi bi-check"></i>
                    <span *ngIf="!step.done">{{ i + 1 }}</span>
                  </div>
                  <span class="small" [class.text-success]="step.done" [class.fw-semibold]="step.done">
                    {{ step.label }}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Lawyer Info Box -->
      <div *ngIf="isLawyer" class="alert alert-success mb-3">
        <div class="fw-bold mb-1"><i class="bi bi-briefcase me-2"></i>You are assigned as the Lawyer for this case</div>
        <div class="small">
          <strong>Citizen:</strong> {{ caseData.citizenName }} &nbsp;·&nbsp;
          <strong>Filed:</strong> {{ caseData.filedDate | date:'mediumDate' }} &nbsp;·&nbsp;
          <strong>Status:</strong> {{ caseData.status }}
        </div>
        <hr class="my-2">
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-success" (click)="showRequestDocForm = !showRequestDocForm">
            <i class="bi bi-chat-left-text me-1"></i>Request Documents
          </button>
          <a *ngIf="hearings.length > 0" [routerLink]="['/hearings', hearings[0].hearingId]" class="btn btn-sm btn-outline-info">
            <i class="bi bi-calendar-event me-1"></i>View Hearing
          </a>
          <small class="text-muted d-block w-100 mt-1">
            <i class="bi bi-info-circle me-1"></i>
            Please review all submitted documents and stay tuned for hearing schedules and court orders.
          </small>
        </div>
      </div>

      <!-- Clerk Info Box -->
      <div *ngIf="isClerk && caseData.lawyerName" class="alert alert-warning mb-3">
        <div class="fw-bold mb-1"><i class="bi bi-clipboard-check me-2"></i>Clerk Actions for Case</div>
        <div class="small">
          <strong>Lawyer:</strong> {{ caseData.lawyerName }} &nbsp;·&nbsp;
          <strong>Status:</strong> {{ caseData.status }}
        </div>
        <hr class="my-2">
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-warning" (click)="showClerkDocRequestForm = !showClerkDocRequestForm">
            <i class="bi bi-file-earmark-text me-1"></i>Request Document from Lawyer
          </button>
          <small class="text-muted d-block w-100 mt-1">
            <i class="bi bi-info-circle me-1"></i>
            Send document requests to the assigned lawyer.
          </small>
        </div>
      </div>

      <!-- Clerk Document Request Modal -->
      <div *ngIf="showClerkDocRequestForm && isClerk" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-file-earmark-text me-2"></i>Request Document from Lawyer</h5>
              <button type="button" class="btn-close" (click)="showClerkDocRequestForm = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label"><strong>Document Type</strong></label>
                <select class="form-select" [(ngModel)]="clerkDocRequestForm.docType">
                  <option value="">Select document type...</option>
                  <option value="ID">ID Proof</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="BIRTH_CERT">Birth Certificate</option>
                  <option value="RESIDENCE">Residence Proof</option>
                  <option value="PETITION">Petition</option>
                  <option value="EVIDENCE">Evidence</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Description / Reason</strong></label>
                <textarea class="form-control" [(ngModel)]="clerkDocRequestForm.description" rows="3"
                          placeholder="Why is this document needed? (e.g., Required for hearing on 15th April)"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Required By Date</strong></label>
                <input type="date" class="form-control" [(ngModel)]="clerkDocRequestForm.requiredBy">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showClerkDocRequestForm = false">Cancel</button>
              <button type="button" class="btn btn-warning" (click)="sendClerkDocumentRequest()" 
                      [disabled]="!clerkDocRequestForm.docType || !clerkDocRequestForm.description || !clerkDocRequestForm.requiredBy || sendingClerkDocRequest">
                <span *ngIf="sendingClerkDocRequest" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!sendingClerkDocRequest" class="bi bi-send me-1"></i>
                Send Request to Lawyer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Request Form Modal -->
      <div *ngIf="showRequestDocForm && isLawyer" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-chat-left-text me-2"></i>Request Documents from Citizen</h5>
              <button type="button" class="btn-close" (click)="showRequestDocForm = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label"><strong>Requested Document Type</strong></label>
                <select class="form-select" [(ngModel)]="requestDocForm.requestedDocType">
                  <option value="">Select document type...</option>
                  <option value="PETITION">Petition</option>
                  <option value="EVIDENCE">Evidence</option>
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="LEGAL_DOC">Legal Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Subject</strong></label>
                <input type="text" class="form-control" [(ngModel)]="requestDocForm.subject" 
                       placeholder="e.g., Required Evidence for Hearing">
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Message / Details</strong></label>
                <textarea class="form-control" [(ngModel)]="requestDocForm.content" rows="4"
                          placeholder="Explain what documents you need and why..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showRequestDocForm = false">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="sendDocumentRequest()" 
                      [disabled]="!requestDocForm.requestedDocType || !requestDocForm.subject || !requestDocForm.content || sendingDocRequest">
                <span *ngIf="sendingDocRequest" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!sendingDocRequest" class="bi bi-send me-1"></i>
                Send Request
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Citizen Info Box -->
      <div *ngIf="isCitizen" class="alert alert-info mb-3">
        <div class="fw-bold mb-1"><i class="bi bi-person me-2"></i>Your Case Status</div>
        <div class="small">
          <strong>Case:</strong> {{ caseData.title }} &nbsp;·&nbsp;
          <strong>Status:</strong> {{ caseData.status }}
        </div>
        <hr class="my-2">
        <div *ngIf="caseData.lawyerName" class="small">
          <i class="bi bi-check-circle-fill text-success me-1"></i>
          Your lawyer <strong>{{ caseData.lawyerName }}</strong> has been assigned.
        </div>
        <div *ngIf="!caseData.lawyerName" class="small text-muted">
          <i class="bi bi-clock me-1"></i>
          A lawyer will be assigned by the court clerk soon.
        </div>
      </div>

      <div *ngIf="isReviewer" class="card mb-3">
        <div class="card-header fw-semibold"><i class="bi bi-search me-2"></i>Review Summary</div>
        <div class="card-body">
          <div class="row text-center">
            <div class="col-6 col-sm-3 mb-3">
              <div class="text-muted small">Hearings</div>
              <div class="fs-5 fw-bold">{{ hearings.length }}</div>
            </div>
            <div class="col-6 col-sm-3 mb-3">
              <div class="text-muted small">Judgments</div>
              <div class="fs-5 fw-bold">{{ judgments.length }}</div>
            </div>
            <div class="col-6 col-sm-3 mb-3">
              <div class="text-muted small">Documents</div>
              <div class="fs-5 fw-bold">{{ documents.length }}</div>
            </div>
            <div class="col-6 col-sm-3 mb-3">
              <div class="text-muted small">Review Time</div>
              <div class="fs-5 fw-bold">{{ reviewPeriod }}</div>
            </div>
          </div>
          <div class="small text-muted">
            <strong>Lawyer:</strong> {{ caseData.lawyerName || 'Unassigned' }} ·
            <strong>Judge:</strong> {{ caseData.judgeName || 'Unassigned' }}
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-file-earmark-text me-2"></i>Documents
            <span class="badge bg-secondary ms-1">{{ documents.length }}</span>
          </span>
          <button *ngIf="!isReviewer" class="btn btn-sm btn-outline-primary" (click)="showDocForm = !showDocForm">
            <i class="bi bi-plus me-1"></i>Add Document
          </button>
        </div>
        <div *ngIf="showDocForm && !isReviewer" class="card-body border-bottom bg-light">
          <div class="row g-2 align-items-end">
            <div class="col-md-3">
              <label class="form-label small mb-1">Document Type</label>
              <select class="form-select form-select-sm" [(ngModel)]="docForm.docType">
                <option value="">Select Type...</option>
                <option *ngFor="let t of docTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="col-md-7">
              <label class="form-label small mb-1">File URL / Path</label>
              <input class="form-control form-control-sm" [(ngModel)]="docForm.fileUri"
                     placeholder="e.g. https://drive.google.com/file/... or /uploads/petition.pdf">
            </div>
            <div class="col-md-2">
              <button class="btn btn-sm btn-success w-100" (click)="addDocument()"
                      [disabled]="!docForm.docType || !docForm.fileUri">
                <i class="bi bi-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Type</th><th>File</th><th>Uploaded</th>
                <th>Verification</th><th *ngIf="canVerifyDocs">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of documents">
                <td><span class="badge bg-secondary">{{ d.docType }}</span></td>
                <td>
                  <a [href]="d.fileUri" target="_blank" class="d-flex align-items-center gap-1 text-decoration-none">
                    <i class="bi" [ngClass]="fileIcon(d.fileUri)"></i>
                    <span class="text-truncate" style="max-width:160px">{{ getFileName(d.fileUri) }}</span>
                    <i class="bi bi-box-arrow-up-right small text-muted ms-1"></i>
                  </a>
                </td>
                <td>{{ d.uploadedDate | date:'mediumDate' }}</td>
                <td><span class="badge" [ngClass]="verifyBadge(d.verificationStatus)">{{ d.verificationStatus }}</span></td>
                <td *ngIf="canVerifyDocs">
                  <button class="btn btn-sm btn-outline-success me-1" (click)="verifyDoc(d.documentId, 'VERIFIED')">
                    <i class="bi bi-check"></i> Verify
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="verifyDoc(d.documentId, 'REJECTED')">
                    <i class="bi bi-x"></i> Reject
                  </button>
                </td>
              </tr>
              <tr *ngIf="documents.length === 0">
                <td [attr.colspan]="canVerifyDocs ? 5 : 4" class="text-center text-muted py-3">
                  <i class="bi bi-file-earmark me-2"></i>No documents uploaded yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Hearings -->
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-calendar-event me-2"></i>Hearings
            <span class="badge bg-secondary ms-1">{{ hearings.length }}</span>
          </span>
          <a *ngIf="canScheduleHearing" [routerLink]="['/hearings/new']"
             [queryParams]="{caseId: caseId}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-plus me-1"></i>Schedule Hearing
          </a>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr><th>#</th><th>Judge</th><th>Date</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of hearings">
                <td>#{{ h.hearingId }}</td>
                <td>{{ h.judgeName }}</td>
                <td>{{ h.date | date:'mediumDate' }}</td>
                <td>{{ h.time }}</td>
                <td><span class="badge" [ngClass]="badge(h.status)">{{ h.status }}</span></td>
              </tr>
              <tr *ngIf="hearings.length === 0">
                <td colspan="5" class="text-center text-muted py-3">
                  <i class="bi bi-calendar-x me-2"></i>No hearings scheduled yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Judgments -->
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-hammer me-2"></i>Judgments
            <span class="badge bg-secondary ms-1">{{ judgments.length }}</span>
          </span>
          <a *ngIf="isJudge || isAdmin" [routerLink]="['/judgments/new']"
             [queryParams]="{caseId: caseId}" class="btn btn-sm btn-outline-warning shadow-sm">
            <i class="bi bi-plus me-1"></i>Record Judgment
          </a>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr><th>#</th><th>Summary</th><th>Date</th><th>Status</th><th *ngIf="isJudge || isAdmin">Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let j of judgments">
                <td>#{{ j.judgmentId }}</td>
                <td class="text-truncate" style="max-width:200px">{{ j.summary }}</td>
                <td>{{ j.date | date:'mediumDate' }}</td>
                <td><span class="badge" [ngClass]="badge(j.status)">{{ j.status }}</span></td>
                <td *ngIf="isJudge || isAdmin">
                  <button *ngIf="j.status === 'DRAFT'" class="btn btn-sm btn-outline-success"
                          (click)="finalizeJudgment(j.judgmentId)">
                    <i class="bi bi-check2-circle me-1"></i>Finalize
                  </button>
                  <span *ngIf="j.status === 'FINAL'" class="text-success small fw-semibold">
                    <i class="bi bi-check-circle-fill me-1"></i>Final
                  </span>
                </td>
              </tr>
              <tr *ngIf="judgments.length === 0">
                <td [attr.colspan]="(isJudge || isAdmin) ? 5 : 4" class="text-center text-muted py-3">
                  <i class="bi bi-hammer me-2"></i>No judgments recorded yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Court Orders -->
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-file-text me-2"></i>Court Orders
            <span class="badge bg-secondary ms-1">{{ orders.length }}</span>
          </span>
          <a *ngIf="isJudge || isAdmin" [routerLink]="['/judgments/orders/new']"
             [queryParams]="{caseId: caseId}" class="btn btn-sm btn-outline-info shadow-sm">
            <i class="bi bi-plus me-1"></i>Issue Order
          </a>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr><th>#</th><th>Description</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of orders">
                <td>#{{ o.orderId }}</td>
                <td class="text-truncate" style="max-width:220px">{{ o.description }}</td>
                <td>{{ o.date | date:'mediumDate' }}</td>
                <td><span class="badge bg-info text-dark">{{ o.status }}</span></td>
              </tr>
              <tr *ngIf="orders.length === 0">
                <td colspan="4" class="text-center text-muted py-3">
                  <i class="bi bi-file-text me-2"></i>No court orders issued yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Proceedings -->
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-file-earmark-break me-2"></i>Proceedings
            <span class="badge bg-secondary ms-1">{{ proceedings.length }}</span>
          </span>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr><th>#</th><th>Hearing</th><th>Description</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of proceedings">
                <td>#{{ p.proceedingId }}</td>
                <td>{{ getHearingTitle(p) }}</td>
                <td class="text-truncate" style="max-width:220px">{{ p.notes }}</td>
                <td>{{ p.date | date:'medium' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" (click)="openProceeding(p)">
                    <i class="bi bi-eye me-1"></i>View
                  </button>
                </td>
              </tr>
              <tr *ngIf="proceedings.length === 0">
                <td colspan="5" class="text-center text-muted py-3">
                  <i class="bi bi-file-earmark-text me-2"></i>No proceedings recorded yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showProceedingModal && selectedProceeding"
           class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
           style="background: rgba(0,0,0,0.55); z-index: 1060; padding: 1rem;">
        <div class="bg-white rounded shadow-lg overflow-hidden" style="width:100%; max-width:600px; max-height:90vh;">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold">Proceeding #{{ selectedProceeding.proceedingId }}</div>
                <div class="small text-muted">{{ caseData.title }}</div>
              </div>
              <button type="button" class="btn-close" aria-label="Close" (click)="closeProceeding()"></button>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="text-muted small mb-1">Proceeding Description</div>
                <p class="mb-0">{{ selectedProceeding.notes || 'No description available.' }}</p>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="text-muted small mb-1">Judge</div>
                  <div>{{ getProceedingJudgeName(selectedProceeding) }}</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small mb-1">Lawyer</div>
                  <div>{{ caseData.lawyerName || 'Unassigned' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small mb-1">Date</div>
                  <div>{{ selectedProceeding.date | date:'longDate' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small mb-1">Time</div>
                  <div>{{ selectedProceeding.date | date:'shortTime' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class CaseDetailComponent implements OnInit {
  caseId!: number;
  caseData!: CaseResponse;
  documents: DocumentResponse[] = [];
  hearings: HearingResponse[] = [];
  judgments: JudgmentResponse[] = [];
  orders: CourtOrderResponse[] = [];
  proceedings: ProceedingResponse[] = [];
  selectedProceeding?: ProceedingResponse;
  showProceedingModal = false;
  lawyers: UserResponse[] = [];
  judges: UserResponse[] = [];

  loading = true;
  savingLawyer = false;
  savingJudge = false;
  updatingStatus = false;
  showLawyerPanel = false;
  showJudgePanel = false;
  showDocForm = false;

  selectedLawyerId = '';
  selectedJudgeId = '';
  newStatus = '';
  toast: { msg: string; type: 'success' | 'error' } | null = null;
  docForm = { docType: '', fileUri: '' };
  
  // Document request form
  showRequestDocForm = false;
  sendingDocRequest = false;
  requestDocForm = { subject: '', content: '', requestedDocType: '' };

  // Clerk document request form
  showClerkDocRequestForm = false;
  sendingClerkDocRequest = false;
  clerkDocRequestForm = { docType: '', description: '', requiredBy: '' };

  statuses = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED', 'DISMISSED'];
  docTypes = ['PETITION', 'EVIDENCE', 'ORDER', 'ID_PROOF', 'LEGAL_DOC'];

  /**
   * Timeline computed getter — ALWAYS reflects current caseData.status.
   * FIX: 'Judgment / Closed' shows done at index >= 4 (JUDGMENT_PENDING)
   * and 'Case Closed' at CLOSED. Added 6-step timeline.
   */
  get computedTimeline() {
    const statusOrder = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED'];
    const idx = statusOrder.indexOf(this.caseData?.status ?? '');
    const hasScheduledHearing = this.hearings.some(h => ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(h.status));
    const hasJudgment = this.judgments.length > 0;
    return [
      { label: 'Case Filed', done: idx >= 0 },
      { label: 'Lawyer Assigned', done: !!this.caseData?.lawyerName },
      { label: 'Under Review / Active', done: idx >= 1 },
      { label: 'Hearing Scheduled', done: idx >= 3 || hasScheduledHearing },
      { label: 'Judgment Pending', done: idx >= 4 || hasJudgment },
      { label: 'Case Closed', done: idx >= 5 || this.caseData?.status === 'CLOSED' || this.judgments.some(j => j.status === 'FINAL') },
    ];
  }

  constructor(
    private route: ActivatedRoute,
    private api: CaseApiService,
    private hearingApi: HearingApiService,
    private judgmentApi: JudgmentApiService,
    private userApi: UserApiService,
    private citizenApi: CitizenApiService,
    private notifApi: NotificationApiService,
    public auth: AuthService
  ) {}

  get isAdmin() { return this.auth.hasRole('ADMIN'); }
  get isClerk() { return this.auth.hasRole('CLERK'); }
  get isJudge() { return this.auth.hasRole('JUDGE'); }
  get isCitizen() { return this.auth.hasRole('CITIZEN'); }
  get isLawyer() { return this.auth.hasRole('LAWYER'); }
  get isCompliance() { return this.auth.hasRole('COMPLIANCE'); }
  get isAuditor() { return this.auth.hasRole('AUDITOR'); }
  get isReviewer() { return this.isCompliance || this.isAuditor; }
  get canAssignLawyer() { return this.isAdmin || this.isClerk; }
  get canAssignJudge() { return this.isAdmin || this.isClerk; }
  get canUpdateStatus() { return this.isAdmin || this.isClerk || this.isJudge; }
  get canVerifyDocs() { return this.isAdmin || this.isClerk; }
  get canScheduleHearing() { return this.isAdmin || this.isClerk || this.isJudge; }
  get reviewPeriod(): string {
    if (!this.caseData) return '';
    const filed = new Date(this.caseData.filedDate);
    const latestJudgment = this.judgments.length
      ? this.judgments.reduce((latest, j) => {
          const date = new Date(j.date);
          return latest > date ? latest : date;
        }, new Date(this.judgments[0].date))
      : null;
    const end = latestJudgment ?? new Date();
    const days = Math.max(0, Math.ceil((end.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24)));
    return `${days} day${days === 1 ? '' : 's'} since filed`;
  }

  ngOnInit(): void {
    this.caseId = +this.route.snapshot.params['id'];
    this.loadCase();
    this.api.getDocuments(this.caseId).subscribe(d => this.documents = d, () => {});
    this.hearingApi.getByCase(this.caseId).subscribe({
      next: h => {
        this.hearings = h;
        if (h.length) {
          forkJoin(h.map(x => this.hearingApi.getProceedings(x.hearingId))).subscribe({
            next: proceedGroups => this.proceedings = proceedGroups.flat(),
            error: () => this.proceedings = []
          });
        } else {
          this.proceedings = [];
        }
      },
      error: () => { this.hearings = []; this.proceedings = []; }
    });
    this.judgmentApi.getByCase(this.caseId).subscribe(j => this.judgments = j, () => {});
    this.judgmentApi.getOrdersByCase(this.caseId).subscribe(o => this.orders = o, () => {});
    if (this.canAssignLawyer || this.canAssignJudge) {
      this.userApi.getByRole('LAWYER').subscribe(d => this.lawyers = d, () => {});
      this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d, () => {});
    }
  }

  loadCase(): void {
    this.loading = true;
    this.api.getById(this.caseId).subscribe({
      next: c => {
        this.caseData = c;
        this.newStatus = c.status;
        this.selectedLawyerId = c.lawyerId ? String(c.lawyerId) : '';
        this.selectedJudgeId = c.judgeId ? String(c.judgeId) : '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleLawyerPanel(): void {
    this.showLawyerPanel = !this.showLawyerPanel;
    this.showJudgePanel = false;
  }

  toggleJudgePanel(): void {
    this.showJudgePanel = !this.showJudgePanel;
    this.showLawyerPanel = false;
  }

  assignLawyer(): void {
    const lawyerIdNum = +this.selectedLawyerId;
    if (!lawyerIdNum) return;
    const lawyer = this.lawyers.find(l => +l.userId === lawyerIdNum);
    if (!lawyer) return;

    this.savingLawyer = true;
    this.api.assignLawyer(this.caseId, lawyerIdNum).subscribe({
      next: (updated) => {
        this.caseData = updated;          // FIX: update case object — triggers timeline re-compute
        this.newStatus = updated.status;  // keep status dropdown in sync
        this.showLawyerPanel = false;
        this.savingLawyer = false;
        this.showToast(`Lawyer "${lawyer.name}" assigned successfully!`, 'success');

        // Notify lawyer
        this.notifApi.create({
          userId: lawyer.userId, entityId: this.caseId, category: 'CASE',
          message: `You are assigned as lawyer for Case #${this.caseId}: "${updated.title}". Citizen: ${updated.citizenName}.`
        }).subscribe();

        // Notify citizen via citizenId lookup
        this.citizenApi.getById(updated.citizenId).subscribe({
          next: citizen => {
            this.notifApi.create({
              userId: citizen.userId, entityId: this.caseId, category: 'CASE',
              message: `Your case "${updated.title}" now has lawyer ${lawyer.name} assigned.`
            }).subscribe();
          }, error: () => {}
        });
      },
      error: (e) => {
        this.savingLawyer = false;
        this.showToast(e.error?.message || 'Failed to assign lawyer.', 'error');
      }
    });
  }

  removeLawyer(): void {
    if (!confirm('Remove the assigned lawyer from this case?')) return;
    this.savingLawyer = true;
    this.api.removeLawyer(this.caseId).subscribe({
      next: (updated) => {
        this.caseData = updated;    // FIX: reflect updated case (lawyerName = null)
        this.selectedLawyerId = '';
        this.savingLawyer = false;
        this.showToast('Lawyer removed successfully.', 'success');
      },
      error: (e) => { this.savingLawyer = false; this.showToast(e.error?.message || 'Failed.', 'error'); }
    });
  }

  // assignJudge(): void {
  //   const judgeIdNum = +this.selectedJudgeId;
  //   if (!judgeIdNum) return;
  //   const judge = this.judges.find(j => +j.userId === judgeIdNum);
  //   if (!judge) return;

  //   this.savingJudge = true;
  //   this.api.assignJudge(this.caseId, judgeIdNum).subscribe({
  //     next: (updated) => {
  //       this.caseData = updated;    // FIX: update case with new judge name
  //       this.showJudgePanel = false;
  //       this.savingJudge = false;
  //       this.showToast(`Judge "${judge.name}" assigned successfully!`, 'success');

  //       this.notifApi.create({
  //         userId: judge.userId, entityId: this.caseId, category: 'CASE',
  //         message: `You are assigned as Judge for Case #${this.caseId}: "${updated.title}".`
  //       }).subscribe();
  //     },
  //     error: (e) => {
  //       this.savingJudge = false;
  //       this.showToast(e.error?.message || 'Failed to assign judge.', 'error');
  //     }
  //   });
  // }

  assignJudge(): void {
  const judgeIdNum = +this.selectedJudgeId;
  if (!judgeIdNum) return;
  const judge = this.judges.find(j => +j.userId === judgeIdNum);
  if (!judge) return;

  this.savingJudge = true;
  this.api.assignJudge(this.caseId, judgeIdNum).subscribe({
    next: (updated) => {
      this.caseData = updated;
      this.showJudgePanel = false;
      this.savingJudge = false;
      this.showToast(`Judge "${judge.name}" assigned successfully!`, 'success');

      // 1. Notify the Judge
      this.notifApi.create({
        userId: judge.userId, 
        entityId: this.caseId, 
        category: 'CASE',
        message: `You are assigned as Judge for Case #${this.caseId}: "${updated.title}".`
      }).subscribe();

      // 2. Notify the Lawyer (if assigned)
      if (updated.lawyerId) {
        this.notifApi.create({
          userId: updated.lawyerId, 
          entityId: this.caseId, 
          category: 'CASE',
          message: `Judge ${judge.name} has been assigned to your Case #${this.caseId}: "${updated.title}".`
        }).subscribe();
      }

      // 3. Notify the Citizen
      // We use the citizenId from the updated case response
      this.citizenApi.getById(updated.citizenId).subscribe({
        next: citizen => {
          this.notifApi.create({
            userId: citizen.userId, 
            entityId: this.caseId, 
            category: 'CASE',
            message: `A Judge (${judge.name}) has been assigned to your case: "${updated.title}".`
          }).subscribe();
        },
        error: () => console.warn('Could not notify citizen of judge assignment')
      });
    },
    error: (e) => {
      this.savingJudge = false;
      this.showToast(e.error?.message || 'Failed to assign judge.', 'error');
    }
  });
}

  updateStatus(): void {
    if (!this.newStatus) return;
    this.updatingStatus = true;
    this.api.updateStatus(this.caseId, this.newStatus).subscribe({
      next: c => {
        this.caseData = c;          // FIX: replace case object → timeline auto-updates via getter
        this.newStatus = c.status;  // keep select in sync
        this.updatingStatus = false;
        this.showToast(`Status updated to ${c.status}`, 'success');
        
        // Reload full case data to ensure judge and lawyer names are updated
        this.loadCase();
      },
      error: (e) => {
        this.updatingStatus = false;
        this.showToast(e.error?.message || 'Failed to update status.', 'error');
      }
    });
  }

  addDocument(): void {
    if (!this.docForm.docType || !this.docForm.fileUri) return;
    this.api.addDocument(this.caseId, this.docForm as any).subscribe({
      next: d => {
        this.documents = [...this.documents, d];
        this.showDocForm = false;
        this.docForm = { docType: '', fileUri: '' };
        this.showToast('Document added successfully.', 'success');
      },
      error: (e) => this.showToast(e.error?.message || 'Failed to add document.', 'error')
    });
  }

  verifyDoc(docId: number, status: string): void {
    this.api.verifyDocument(this.caseId, docId, status).subscribe({
      next: d => { this.documents = this.documents.map(x => x.documentId === docId ? d : x); },
      error: (e) => this.showToast(e.error?.message || 'Failed.', 'error')
    });
  }

  finalizeJudgment(judgmentId: number): void {
    if (!confirm('Finalize this judgment? The case will be marked as CLOSED.')) return;
    this.judgmentApi.finalize(judgmentId).subscribe({
      next: j => {
        this.judgments = this.judgments.map(x => x.judgmentId === j.judgmentId ? j : x);
        this.showToast('Judgment finalized. Case will be closed.', 'success');
        // Reload case to get CLOSED status
        this.api.getById(this.caseId).subscribe(c => { this.caseData = c; this.newStatus = c.status; });
      },
      error: (e) => this.showToast(e.error?.message || 'Failed.', 'error')
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  badge(s: string): string {
    const m: Record<string, string> = {
      FILED: 'bg-secondary', ACTIVE: 'bg-success', CLOSED: 'bg-dark',
      UNDER_REVIEW: 'bg-warning text-dark', HEARING_SCHEDULED: 'bg-info text-dark',
      JUDGMENT_PENDING: 'bg-danger', DISMISSED: 'bg-secondary',
      SCHEDULED: 'bg-primary', IN_PROGRESS: 'bg-info text-dark',
      COMPLETED: 'bg-success', ADJOURNED: 'bg-warning text-dark',
      CANCELLED: 'bg-danger', DRAFT: 'bg-warning text-dark', FINAL: 'bg-success'
    };
    return m[s] ?? 'bg-secondary';
  }

  verifyBadge(s: string): string {
    return s === 'VERIFIED' ? 'bg-success' : s === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark';
  }

  fileIcon(fileUri: string): string {
    const ext = (fileUri || '').split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      pdf: 'bi-file-earmark-pdf text-danger',
      doc: 'bi-file-earmark-word text-primary', docx: 'bi-file-earmark-word text-primary',
      jpg: 'bi-file-earmark-image text-success', jpeg: 'bi-file-earmark-image text-success',
      png: 'bi-file-earmark-image text-success',
      zip: 'bi-file-earmark-zip text-warning', rar: 'bi-file-earmark-zip text-warning'
    };
    return map[ext] || 'bi-file-earmark';
  }

  getFileName(fileUri: string): string {
    if (!fileUri) return 'document';
    return fileUri.split('/').pop() || fileUri;
  }

  openProceeding(p: ProceedingResponse): void {
    this.selectedProceeding = p;
    this.showProceedingModal = true;
  }

  closeProceeding(): void {
    this.showProceedingModal = false;
    this.selectedProceeding = undefined;
  }

  getHearingTitle(proceeding: ProceedingResponse): string {
    const hearing = this.hearings.find(h => h.hearingId === proceeding.hearingId);
    return hearing ? `Hearing #${hearing.hearingId}` : `Hearing #${proceeding.hearingId}`;
  }

  getProceedingJudgeName(proceeding: ProceedingResponse): string {
    const hearing = this.hearings.find(h => h.hearingId === proceeding.hearingId);
    return hearing?.judgeName || this.caseData?.judgeName || 'N/A';
  }

  sendDocumentRequest(): void {
    if (!this.requestDocForm.subject || !this.requestDocForm.content || !this.requestDocForm.requestedDocType) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.sendingDocRequest = true;
    const userId = this.auth.currentUser?.userId;
    if (!userId) {
      this.showToast('User not logged in', 'error');
      this.sendingDocRequest = false;
      return;
    }

    const notificationMessage =
      `Document Request for Case #${this.caseId} - ${this.requestDocForm.requestedDocType}\n` +
      `Case Title: ${this.caseData.title}\n` +
      // `Case Description: ${this.caseData.description || 'No description provided.'}\n` +
      `Subject: ${this.requestDocForm.subject}\n` +
      `Details: ${this.requestDocForm.content}`;

    const notifyCitizen = (citizenUserId: number) => {
      return this.notifApi.create({
        userId: citizenUserId,
        entityId: this.caseId,
        category: 'CASE',
        message: notificationMessage
      });
    };

    const notifyLawyer = () => {
      return this.notifApi.create({
        userId,
        entityId: this.caseId,
        category: 'CASE',
        message:
          `You requested documents for Case #${this.caseId} - ${this.requestDocForm.requestedDocType}\n` +
          `Case Title: ${this.caseData.title}\n` +
          `Case Description: ${this.caseData.description || 'No description provided.'}\n` +
          `Subject: ${this.requestDocForm.subject}\n` +
          `Details: ${this.requestDocForm.content}`
      });
    };

    this.citizenApi.getById(this.caseData.citizenId).subscribe({
      next: citizen => {
        notifyCitizen(citizen.userId).subscribe({
          next: () => {
            notifyLawyer().subscribe({
              next: () => {
                this.showRequestDocForm = false;
                this.requestDocForm = { subject: '', content: '', requestedDocType: '' };
                this.sendingDocRequest = false;
                this.showToast('Document request notification sent to citizen and saved for you.', 'success');
              },
              error: (e: any) => {
                console.error('Error notifying lawyer:', e);
                this.sendingDocRequest = false;
                this.showToast('Citizen was notified, but failed to notify lawyer.', 'error');
              }
            });
          },
          error: (e: any) => {
            console.error('Error creating citizen notification:', e);
            this.sendingDocRequest = false;
            this.showToast('Failed to send document request to citizen: ' + (e.error?.message || e.message), 'error');
          }
        });
      },
      error: (e: any) => {
        console.error('Error loading citizen user id:', e);
        this.sendingDocRequest = false;
        this.showToast('Unable to resolve citizen for notification.', 'error');
      }
    });
  }

  sendClerkDocumentRequest(): void {
    if (!this.clerkDocRequestForm.docType || !this.clerkDocRequestForm.description || !this.clerkDocRequestForm.requiredBy) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!this.caseData.lawyerId) {
      this.showToast('No lawyer assigned to this case', 'error');
      return;
    }

    const clerkId = this.auth.currentUser?.userId;
    if (!clerkId) {
      this.showToast('User not logged in', 'error');
      return;
    }

    this.sendingClerkDocRequest = true;

    // Create notification message for lawyer using CASE category (backend doesn't support DOCUMENT_REQUEST)
    const notificationMessage =
      `Document Request from Clerk\nRequested Document Type: ${this.clerkDocRequestForm.docType}\nCase Title: ${this.caseData.title}\nDescription: ${this.clerkDocRequestForm.description}\nRequired By: ${this.clerkDocRequestForm.requiredBy}\nRequested By: ${this.auth.currentUser?.name || 'Court Clerk'}`;

    console.log('Sending notification with payload:', {
      userId: this.caseData.lawyerId!,
      entityId: this.caseId,
      category: 'CASE',
      message: notificationMessage
    });

    // Send notification to lawyer with CASE category (backend doesn't support DOCUMENT_REQUEST enum)
    this.notifApi.create({
      userId: this.caseData.lawyerId!,
      entityId: this.caseId,
      category: 'CASE',
      message: notificationMessage
    }).subscribe({
      next: (response) => {
        console.log('Document request notification sent successfully:', response);
        this.showToast('Document request sent to lawyer successfully', 'success');
        this.showClerkDocRequestForm = false;
        this.clerkDocRequestForm = { docType: '', description: '', requiredBy: '' };
        this.sendingClerkDocRequest = false;
      },
      error: (err) => {
        console.error('Error sending document request notification:', err);
        console.error('Error details:', err.error);
        this.showToast('Failed to send document request: ' + (err.error?.message || err.message), 'error');
        this.sendingClerkDocRequest = false;
      }
    });
  }

  downloadCasePDF(): void {
    const htmlContent = this.generateCaseHTML();
    this.generatePDF(htmlContent, `Case_${this.caseId}_Details.pdf`);
  }

  private generateCaseHTML(): string {
    const caseData = this.caseData;
    const documents = this.documents;
    const hearings = this.hearings;
    const judgments = this.judgments;
    const orders = this.orders;
    const proceedings = this.proceedings;

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
            .section { margin-bottom: 25px; page-break-inside: avoid; }
            .section-title { background: #f0f0f0; padding: 10px 15px; border-left: 4px solid #667eea; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; color: #333; font-weight: 600; }
            .content-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background: #fafafa; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; font-weight: bold; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-active { background: #28a745; color: white; }
            .badge-closed { background: #6c757d; color: white; }
            .badge-under_review { background: #ffc107; color: #333; }
            .badge-hearing_scheduled { background: #17a2b8; color: white; }
            .badge-judgment_pending { background: #dc3545; color: white; }
            .badge-dismissed { background: #6c757d; color: white; }
            .badge-filed { background: #007bff; color: white; }
            .badge-scheduled { background: #28a745; color: white; }
            .badge-completed { background: #17a2b8; color: white; }
            .badge-adjourned { background: #ffc107; color: #333; }
            .badge-cancelled { background: #dc3545; color: white; }
            .badge-draft { background: #ffc107; color: #333; }
            .badge-final { background: #28a745; color: white; }
            .badge-verified { background: #28a745; color: white; }
            .badge-rejected { background: #dc3545; color: white; }
            .badge-pending { background: #ffc107; color: #333; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 11px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 CASE DETAILS REPORT</h1>
            <p>Case ID: #${caseData.caseId} - ${caseData.title}</p>
          </div>

          <div class="section">
            <div class="section-title">Case Status</div>
            <span class="badge badge-${caseData.status.toLowerCase().replace('_', '_')}">
              ${caseData.status.replace('_', ' ')}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Case ID</div>
                <div class="info-value">#${caseData.caseId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Title</div>
                <div class="info-value">${caseData.title}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Filed Date</div>
                <div class="info-value">${new Date(caseData.filedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Citizen</div>
                <div class="info-value">${caseData.citizenName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned Lawyer</div>
                <div class="info-value">${caseData.lawyerName || 'Not Assigned'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned Judge</div>
                <div class="info-value">${caseData.judgeName || 'Not Assigned'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Case Description</div>
            <div class="content-box">
              ${caseData.description ? caseData.description.replace(/\n/g, '<br>') : 'No description provided.'}
            </div>
          </div>

          ${documents.length > 0 ? `
          <div class="section">
            <div class="section-title">Documents (${documents.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>File Name</th>
                  <th>Uploaded Date</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                ${documents.map(d => `
                  <tr>
                    <td>${d.docType}</td>
                    <td>${this.getFileName(d.fileUri)}</td>
                    <td>${new Date(d.uploadedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-${d.verificationStatus.toLowerCase()}">${d.verificationStatus}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${hearings.length > 0 ? `
          <div class="section">
            <div class="section-title">Hearings (${hearings.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Judge</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${hearings.map(h => `
                  <tr>
                    <td>#${h.hearingId}</td>
                    <td>${h.judgeName}</td>
                    <td>${new Date(h.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>${h.time}</td>
                    <td><span class="badge badge-${h.status.toLowerCase()}">${h.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${judgments.length > 0 ? `
          <div class="section">
            <div class="section-title">Judgments (${judgments.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Summary</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${judgments.map(j => `
                  <tr>
                    <td>#${j.judgmentId}</td>
                    <td>${j.summary.length > 50 ? j.summary.substring(0, 50) + '...' : j.summary}</td>
                    <td>${new Date(j.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-${j.status.toLowerCase()}">${j.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${orders.length > 0 ? `
          <div class="section">
            <div class="section-title">Court Orders (${orders.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td>#${o.orderId}</td>
                    <td>${o.description.length > 50 ? o.description.substring(0, 50) + '...' : o.description}</td>
                    <td>${new Date(o.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-pending">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${proceedings.length > 0 ? `
          <div class="section">
            <div class="section-title">Proceedings (${proceedings.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hearing</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${proceedings.map(p => `
                  <tr>
                    <td>#${p.proceedingId}</td>
                    <td>${this.getHearingTitle(p)}</td>
                    <td>${p.notes.length > 50 ? p.notes.substring(0, 50) + '...' : p.notes}</td>
                    <td>${new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>This document is generated from JusticeServe Case Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generatePDF(htmlContent: string, filename: string): void {
    // Create a temporary div to hold the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // Use html2pdf-like approach with canvas
    const element = tempDiv.querySelector('body') || tempDiv;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // Alternative: Simple PDF generation using canvas and blob
    this.simpleHTMLToPDF(htmlContent, filename);

    // Cleanup
    document.body.removeChild(tempDiv);
  }

  private simpleHTMLToPDF(htmlContent: string, filename: string): void {
    // Create a new window to print to PDF
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait a moment for content to load, then print
      setTimeout(() => {
        printWindow.print();
        // Optional: Close after printing
        // printWindow.close();
      }, 100);
    }
  }
}
