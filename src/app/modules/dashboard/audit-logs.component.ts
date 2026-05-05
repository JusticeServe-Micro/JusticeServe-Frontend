import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditLogApiService } from '../../core/services/api.service';
import { AuditLogResponse } from '../../shared/models/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4><i class="bi bi-file-text me-2"></i>System Logs</h4>
        <small class="text-muted">Audit trail of all system activities</small>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" (click)="refreshLogs()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
        <button class="btn btn-outline-danger btn-sm" (click)="deleteAllLogs()">
          <i class="bi bi-trash me-1"></i>Delete All Logs
        </button>
      </div>
    </div>

    <div class="p-4">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2 text-muted">Loading audit logs...</p>
      </div>

      <div *ngIf="!loading">
        
        <!-- Filters -->
        <div class="card mb-3">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Filter by Action</label>
                <select class="form-select form-select-sm" [(ngModel)]="filterAction" (change)="applyFilters()">
                  <option value="">All Actions</option>
                  <option *ngFor="let action of uniqueActions" [value]="action">{{ action }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Filter by Resource</label>
                <select class="form-select form-select-sm" [(ngModel)]="filterResource" (change)="applyFilters()">
                  <option value="">All Resources</option>
                  <option *ngFor="let resource of uniqueResources" [value]="resource">{{ resource }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Filter by User ID</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="filterUserId" (input)="applyFilters()" placeholder="Enter user ID">
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="row g-3 mb-3">
          <div class="col-sm-6 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Total Logs</div>
              <div class="stat-value">{{ logs.length }}</div>
            </div>
          </div>
          <div class="col-sm-6 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Unique Users</div>
              <div class="stat-value">{{ getUniqueUsers() }}</div>
            </div>
          </div>
          <div class="col-sm-6 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Unique Actions</div>
              <div class="stat-value">{{ uniqueActions.length }}</div>
            </div>
          </div>
          <div class="col-sm-6 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Unique Resources</div>
              <div class="stat-value">{{ uniqueResources.length }}</div>
            </div>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="card">
          <div class="card-header fw-semibold"><i class="bi bi-list-ul me-2"></i>Audit Log Entries</div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Timestamp</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of filtered" class="audit-log-row">
                  <td><span class="badge bg-secondary">#{{ log.auditLogId }}</span></td>
                  <td>
                    <span class="badge bg-light text-dark">
                      <i class="bi bi-person me-1"></i>{{ log.userId }}
                    </span>
                  </td>
                  <td>
                    <span class="action-badge" [ngClass]="getActionClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>
                    <span class="resource-badge">
                      <i class="bi me-1" [ngClass]="getResourceIcon(log.resource)"></i>{{ log.resource }}
                    </span>
                  </td>
                  <td>
                    <small class="text-muted">{{ log.timestamp | date:'medium' }}</small>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" title="Delete log" (click)="deleteLog(log.auditLogId)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size:2rem;opacity:0.3"></i>
                    <p class="mt-2 mb-0">No audit logs found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="card-footer text-muted small d-flex justify-content-between align-items-center">
            <span>Showing {{ filtered.length }} of {{ logs.length }} logs</span>
            <span>Last updated: {{ lastUpdated | date:'medium' }}</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .stat-box {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #6c757d;
      font-weight: 600;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #007bff;
    }

    .audit-log-row {
      border-left: 4px solid transparent;
      transition: all 0.2s ease;
    }

    .audit-log-row:hover {
      background: #f8f9fa;
      border-left-color: #007bff;
    }

    .action-badge {
      display: inline-block;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .action-badge.create {
      background: #d4edda;
      color: #155724;
    }

    .action-badge.update {
      background: #cce5ff;
      color: #004085;
    }

    .action-badge.delete {
      background: #f8d7da;
      color: #721c24;
    }

    .action-badge.read {
      background: #e2e3e5;
      color: #383d41;
    }

    .action-badge.login {
      background: #fff3cd;
      color: #856404;
    }

    .resource-badge {
      display: inline-block;
      padding: 0.35rem 0.65rem;
      background: #e7f3ff;
      color: #0056b3;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    table {
      font-size: 0.9rem;
    }

    thead {
      background: #f8f9fa;
      border-top: 2px solid #dee2e6;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: #495057;
    }

    .card-header {
      background: #007bff;
      color: white;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLogResponse[] = [];
  filtered: AuditLogResponse[] = [];
  loading = true;
  lastUpdated = new Date();
  
  filterAction = '';
  filterResource = '';
  filterUserId: number | string | null = null;

  uniqueActions: string[] = [];
  uniqueResources: string[] = [];

  constructor(private auditApi: AuditLogApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditApi.getAll().subscribe({
      next: (data) => {
        this.logs = data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.updateFilters();
        this.applyFilters();
        this.loading = false;
        this.lastUpdated = new Date();
      },
      error: (e) => {
        console.error('Error loading audit logs:', e);
        this.loading = false;
      }
    });
  }

  updateFilters(): void {
    this.uniqueActions = [...new Set(this.logs.map(l => l.action))].sort();
    this.uniqueResources = [...new Set(this.logs.map(l => l.resource))].sort();
  }

  applyFilters(): void {
    const userId = this.filterUserId == null || this.filterUserId === '' ? null : Number(this.filterUserId);

    this.filtered = this.logs.filter(log => {
      const matchAction = !this.filterAction || log.action === this.filterAction;
      const matchResource = !this.filterResource || log.resource === this.filterResource;
      const matchUserId = userId == null || log.userId === userId;
      return matchAction && matchResource && matchUserId;
    });
  }

  getUniqueUsers(): number {
    return new Set(this.logs.map(l => l.userId)).size;
  }

  getActionClass(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('create') || lower.includes('post')) return 'create';
    if (lower.includes('update') || lower.includes('put') || lower.includes('patch')) return 'update';
    if (lower.includes('delete')) return 'delete';
    if (lower.includes('login') || lower.includes('auth')) return 'login';
    return 'read';
  }

  getResourceIcon(resource: string): string {
    const lower = resource.toLowerCase();
    if (lower.includes('user')) return 'bi-person';
    if (lower.includes('case')) return 'bi-folder';
    if (lower.includes('hearing')) return 'bi-calendar';
    if (lower.includes('judgment')) return 'bi-hammer';
    if (lower.includes('document')) return 'bi-file-text';
    if (lower.includes('audit')) return 'bi-shield-check';
    return 'bi-document';
  }

  refreshLogs(): void {
    this.loadLogs();
  }

  deleteLog(id: number): void {
    if (!confirm('Delete this audit log entry? This cannot be undone.')) return;
    this.auditApi.delete(id).subscribe({
      next: () => {
        this.logs = this.logs.filter(l => l.auditLogId !== id);
        this.updateFilters();
        this.applyFilters();
      },
      error: (e) => {
        console.error('Error deleting audit log:', e);
      }
    });
  }

  deleteAllLogs(): void {
    if (!confirm('Delete all audit logs? This will remove the entire audit history.')) return;
    this.auditApi.deleteAll().subscribe({
      next: () => {
        this.logs = [];
        this.filtered = [];
      },
      error: (e) => {
        console.error('Error deleting all audit logs:', e);
      }
    });
  }
}
