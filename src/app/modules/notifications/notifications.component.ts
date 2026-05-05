import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationApiService } from '../../core/services/api.service';
import { NotificationResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4><i class="bi bi-bell me-2"></i>Notifications</h4>
        <small class="text-muted">
          {{ unreadCount }} unread · {{ notifications.length }} total
        </small>
      </div>
      <div class="d-flex gap-2">
        <select class="form-select form-select-sm" style="width:auto" [(ngModel)]="filterCat"
                (change)="applyFilter()" [ngModelOptions]="{standalone: true}">
          <option value="">All Categories</option>
          <option value="CASE">Case</option>
          <option value="DOCUMENT_REQUEST">Document Request</option>
          <option value="HEARING">Hearing</option>
          <option value="JUDGMENT">Judgment</option>
          <option value="COMPLIANCE">Compliance</option>
        </select>
        <button class="btn btn-outline-secondary btn-sm" (click)="markAllRead()"
                [disabled]="unreadCount === 0">
          <i class="bi bi-check-all me-1"></i>Mark All Read
        </button>
      </div>
    </div>

    <div class="p-4">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2 text-muted">Loading notifications...</p>
      </div>

      <div *ngIf="!loading">

        <!-- Unread section -->
        <div *ngIf="unread.length > 0" class="mb-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-danger">{{ unread.length }} New</span>
            <span class="text-muted small fw-semibold text-uppercase">Unread Notifications</span>
          </div>
          <div *ngFor="let n of unread" class="card mb-2 border-start border-4"
               [style.border-left-color]="catColor(n.category)">
            <div class="card-body py-3">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="d-flex gap-3 align-items-start flex-grow-1">

                  <!-- Icon -->
                  <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                       [ngClass]="catBg(n.category)"
                       style="width:44px;height:44px;min-width:44px">
                    <i class="bi fs-5" [ngClass]="catIcon(n.category)"></i>
                  </div>

                  <!-- Content -->
                  <div class="flex-grow-1">
                    <div class="fw-bold mb-1">{{ catTitle(n.category) }}</div>
                    <div class="text-dark mb-1" style="line-height:1.5">{{ n.message }}</div>
                    <div class="d-flex align-items-center gap-3 mt-1 flex-wrap">
                      <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>{{ n.createdDate | date:'medium' }}
                      </small>
                      <span class="badge bg-light text-dark border small">{{ n.category }}</span>
                      <button *ngIf="isDocumentRequest(n)" class="btn btn-xs btn-sm btn-outline-warning py-0 px-2 small" 
                              (click)="viewMessage(n)">
                        <i class="bi bi-chat-left-text me-1"></i>View Message
                      </button>
                      <a *ngIf="n.entityId && !isDocumentRequest(n)" [routerLink]="['/cases', n.entityId]"
                         class="btn btn-xs btn-sm btn-outline-primary py-0 px-2 small">
                        View Case #{{ n.entityId }}
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Mark read -->
                <div class="d-flex flex-column align-items-end gap-1">
                  <span class="badge bg-primary rounded-pill">New</span>
                  <button class="btn btn-sm btn-outline-secondary btn-xs" (click)="markRead(n)" title="Mark as read">
                    <i class="bi bi-check"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Read section -->
        <div *ngIf="read.length > 0">
          <div class="text-muted small fw-semibold text-uppercase mb-2" *ngIf="unread.length > 0">
            Earlier Notifications
          </div>
          <div *ngFor="let n of read" class="card mb-2 opacity-75">
            <div class="card-body py-2">
              <div class="d-flex gap-3 align-items-start">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-light border"
                     style="width:38px;height:38px;min-width:38px">
                  <i class="bi text-muted" [ngClass]="catIcon(n.category)"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold text-muted small mb-1">{{ catTitle(n.category) }}</div>
                  <div class="text-muted small" style="line-height:1.5">{{ n.message }}</div>
                  <div class="d-flex align-items-center gap-3 mt-1">
                    <small class="text-muted" style="font-size:0.75rem">
                      <i class="bi bi-clock me-1"></i>{{ n.createdDate | date:'medium' }}
                    </small>
                    <a *ngIf="n.entityId" [routerLink]="['/cases', n.entityId]"
                       class="btn btn-xs btn-sm btn-outline-secondary py-0 px-2" style="font-size:0.75rem">
                      View Case #{{ n.entityId }}
                    </a>
                  </div>
                </div>
                <i class="bi bi-check-all text-success"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="filtered.length === 0" class="text-center py-5">
          <i class="bi bi-bell-slash text-muted" style="font-size:4rem;opacity:0.3"></i>
          <h6 class="mt-3 text-muted">No notifications yet</h6>
          <p class="text-muted small">You'll be notified about case updates, hearings, and judgments here.</p>
        </div>

      </div>
    </div>

    <!-- Notification Detail Modal -->
    <div *ngIf="selectedNotification" class="modal d-block" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white" style="background: #0d6efd !important;">
            <div>
              <h5 class="modal-title"><i class="bi bi-bell me-2"></i>Notification Details</h5>
              <small style="color: rgba(255,255,255,0.8);">Category: {{ selectedNotification.category }}</small>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="closeMessage()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 case-info">
              <small class="notification-detail-label"><i class="bi bi-folder me-2"></i>Case</small>
              <div class="notification-detail-value">Case #{{ selectedNotification.entityId || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <small class="notification-detail-label"><i class="bi bi-chat-left-text me-2"></i>Message</small>
              <div class="notification-detail-value message-content">
                <div *ngFor="let line of notificationDetailLines; let i = index">
                  <strong *ngIf="line.startsWith('Case Title:') || line.startsWith('Case Description:') || line.startsWith('Requested Document Type:') || line.startsWith('Subject:') || line.startsWith('Document Request') || line.startsWith('Reply')">
                    {{ line }}
                  </strong>
                  <span *ngIf="!line.startsWith('Case Title:') && !line.startsWith('Case Description:') && !line.startsWith('Requested Document Type:') && !line.startsWith('Subject:') && !line.startsWith('Document Request') && !line.startsWith('Reply')">
                    {{ line }}
                  </span>
                  <br *ngIf="i < notificationDetailLines.length - 1" />
                </div>
              </div>
            </div>
            <div class="mb-3 timestamp-info">
              <small class="notification-detail-label"><i class="bi bi-clock me-2"></i>Received</small>
              <div class="notification-detail-value">{{ selectedNotification.createdDate | date:'medium' }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeMessage()">Close</button>
            <a *ngIf="selectedNotification.entityId" [routerLink]="['/cases', selectedNotification.entityId]" 
               class="btn btn-primary" (click)="closeMessage()">
              <i class="bi bi-folder2-open me-1"></i>Go to Case
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  // inline ngModel fix for non-form context
  styles: [`
    .btn-xs { font-size: 0.75rem; padding: 1px 6px; }
    .opacity-75 { opacity: 0.75; }

    .modal-content {
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border: none;
      overflow: hidden;
    }

    .modal-header {
      background: #007bff;
      color: black;
      border-bottom: none;
      padding: 1.25rem 1.5rem;
      border-radius: 12px 12px 0 0;
    }

    .modal-header .modal-title {
      font-weight: 600;
      font-size: 1.2rem;
    }

    .modal-body {
      padding: 1.5rem;
      background: white;
    }

    .modal-footer {
      border-top: 1px solid #dee2e6;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-radius: 0 0 12px 12px;
    }

    .notification-detail-label {
      font-weight: 600;
      color: #2484e3;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .notification-detail-value {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #e9ecef;
    }

    .message-content {
      white-space: pre-line;
      line-height: 1.6;
      font-size: 0.95rem;
      color: #212529;
    }

    .message-content strong {
      color: #343a40;
      font-weight: 600;
    }

    .case-info {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid #dee2e6;
    }

    .timestamp-info {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #dee2e6;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationResponse[] = [];
  filtered: NotificationResponse[] = [];
  loading = true;
  filterCat = '';
  selectedNotification: NotificationResponse | null = null;
  notificationDetailLines: string[] = [];

  constructor(private api: NotificationApiService, private auth: AuthService) {}

  get unreadCount() { return this.filtered.filter(n => n.status === 'UNREAD').length; }
  get unread() { return this.filtered.filter(n => n.status === 'UNREAD'); }
  get read() { return this.filtered.filter(n => n.status !== 'UNREAD'); }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (userId) {
      this.api.getByUser(userId).subscribe({
        next: d => {
          this.notifications = d.sort((a, b) =>
            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          );
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else { this.loading = false; }
  }

  applyFilter(): void {
    this.filtered = this.notifications.filter(n =>
      !this.filterCat || n.category === this.filterCat
    );
  }

  markRead(n: NotificationResponse): void {
    this.api.markRead(n.notificationId).subscribe(updated => {
      this.notifications = this.notifications.map(x =>
        x.notificationId === n.notificationId ? updated : x
      );
      this.applyFilter();
    });
  }

  markAllRead(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) return;

    // Try bulk endpoint first; fallback to one-by-one
    this.api.markAllRead(userId).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, status: 'READ' }));
        this.applyFilter();
      },
      error: () => {
        // Fallback: mark each unread one individually
        this.unread.forEach(n => this.markRead(n));
      }
    });
  }

  catTitle(cat: string): string {
    const m: Record<string, string> = {
      CASE: '📁 Case Update',
      DOCUMENT_REQUEST: '📄 Document Request',
      HEARING: '📅 Hearing Notice',
      JUDGMENT: '⚖️ Judgment Update',
      COMPLIANCE: '🛡️ Compliance Alert'
    };
    return m[cat] ?? '🔔 Notification';
  }

  catColor(cat: string): string {
    const m: Record<string, string> = {
      CASE: '#0d6efd', 
      DOCUMENT_REQUEST: '#fd7e14',
      HEARING: '#0dcaf0', 
      JUDGMENT: '#ffc107', 
      COMPLIANCE: '#198754'
    };
    return m[cat] ?? '#6c757d';
  }

  catBg(cat: string): string {
    const m: Record<string, string> = {
      CASE: 'bg-primary text-white',
      DOCUMENT_REQUEST: 'bg-warning text-dark',
      HEARING: 'bg-info text-dark',
      JUDGMENT: 'bg-warning text-dark',
      COMPLIANCE: 'bg-success text-white'
    };
    return m[cat] ?? 'bg-secondary text-white';
  }

  catIcon(cat: string): string {
    const m: Record<string, string> = {
      CASE: 'bi-folder2-open',
      DOCUMENT_REQUEST: 'bi-file-earmark-text',
      HEARING: 'bi-calendar-event',
      JUDGMENT: 'bi-hammer',
      COMPLIANCE: 'bi-shield-check'
    };
    return m[cat] ?? 'bi-bell';
  }

  isDocumentRequest(n: NotificationResponse): boolean {
    return n.message.toLowerCase().includes('document request') || n.message.toLowerCase().includes('reply to document request');
  }

  viewMessage(n: NotificationResponse): void {
    this.selectedNotification = n;
    this.notificationDetailLines = n.message?.split('\n') || [];
    this.markRead(n);
  }

  closeMessage(): void {
    this.selectedNotification = null;
    this.notificationDetailLines = [];
  }
}

