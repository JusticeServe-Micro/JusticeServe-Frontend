import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CaseApiService, HearingApiService, JudgmentApiService,
  UserApiService, CitizenApiService, NotificationApiService
} from '../../core/services/api.service';
import {
  CaseResponse, DocumentResponse, HearingResponse,
  JudgmentResponse, UserResponse
} from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl : "./case-detail.html"
})
export class CaseDetailComponent implements OnInit {
  caseId!: number;
  caseData!: CaseResponse;
  documents: DocumentResponse[] = [];
  hearings: HearingResponse[] = [];
  judgments: JudgmentResponse[] = [];
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
    return [
      { label: 'Case Filed', done: idx >= 0 },
      { label: 'Lawyer Assigned', done: !!this.caseData?.lawyerName },
      { label: 'Under Review / Active', done: idx >= 2 },
      { label: 'Hearing Scheduled', done: idx >= 3 },
      { label: 'Judgment Pending', done: idx >= 4 },
      { label: 'Case Closed', done: idx >= 5 || this.caseData?.status === 'CLOSED' },
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
  ) { }

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
    this.api.getDocuments(this.caseId).subscribe(d => this.documents = d, () => { });
    this.hearingApi.getByCase(this.caseId).subscribe(h => this.hearings = h, () => { });
    this.judgmentApi.getByCase(this.caseId).subscribe(j => this.judgments = j, () => { });
    if (this.canAssignLawyer || this.canAssignJudge) {
      this.userApi.getByRole('LAWYER').subscribe(d => this.lawyers = d, () => { });
      this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d, () => { });
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
          }, error: () => { }
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
}
