import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../core/services/api.service';
import { UserResponse } from '../../shared/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4><i class="bi bi-person-gear me-2"></i>User Management</h4>
        <small class="text-muted">{{ filtered.length }} user(s) · Assign roles to grant portal access</small>
      </div>
    </div>

    <div class="p-4">

      <!-- Toast -->
      <div *ngIf="toast" class="alert d-flex align-items-center gap-2 mb-3"
           [ngClass]="toast.type === 'success' ? 'alert-success' : 'alert-danger'">
        <i class="bi" [ngClass]="toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>
        {{ toast.msg }}
      </div>

      <!-- Filter bar -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <input class="form-control form-control-sm" placeholder="Search by name or email..."
                     [(ngModel)]="search">
            </div>
            <div class="col-md-3">
              <select class="form-select form-select-sm" [(ngModel)]="filterRole">
                <option value="">All Roles</option>
                <option *ngFor="let r of roles" [value]="r">{{ r }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select form-select-sm" [(ngModel)]="filterStatus">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-body p-0">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Loading users...</p>
          </div>
          <div class="table-responsive" *ngIf="!loading">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Change Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filtered">
                  <td><small class="text-muted">#{{ u.userId }}</small></td>

                  <!-- Name with avatar -->
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                           [ngClass]="roleAvatarBg(u.role)"
                           style="width:32px;height:32px;font-size:0.8rem">
                        {{ u.name[0].toUpperCase() }}
                      </div>
                      <span class="fw-semibold">{{ u.name }}</span>
                    </div>
                  </td>

                  <td class="text-muted small">{{ u.email }}</td>

                  <!-- Current Role badge -->
                  <td>
                    <span class="badge px-2 py-1" [ngClass]="roleBadge(u.role)">
                      <i class="bi me-1" [ngClass]="roleIcon(u.role)"></i>{{ u.role }}
                    </span>
                  </td>

                  <td class="text-muted small">{{ u.phone || '—' }}</td>

                  <!-- Status badge -->
                  <td>
                    <span class="badge" [ngClass]="u.status==='ACTIVE'?'bg-success':'bg-danger'">
                      {{ u.status }}
                    </span>
                  </td>

                  <!-- Change Role inline dropdown -->
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <select class="form-select form-select-sm"
                              style="width:130px"
                              [(ngModel)]="roleSelections[u.userId]">
                        <option *ngFor="let r of roles" [value]="r">{{ r }}</option>
                      </select>
                      <button class="btn btn-sm btn-primary"
                              (click)="changeRole(u)"
                              [disabled]="roleSelections[u.userId] === u.role || savingRole === u.userId"
                              title="Save new role">
                        <span *ngIf="savingRole === u.userId" class="spinner-border spinner-border-sm"></span>
                        <i *ngIf="savingRole !== u.userId" class="bi bi-check-lg"></i>
                      </button>
                    </div>
                    <small *ngIf="roleSelections[u.userId] !== u.role" class="text-warning d-block mt-1">
                      <i class="bi bi-arrow-right-circle me-1"></i>Will become {{ roleSelections[u.userId] }}
                    </small>
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm"
                              [ngClass]="u.status==='ACTIVE'?'btn-outline-warning':'btn-outline-success'"
                              (click)="toggleStatus(u)"
                              [title]="u.status==='ACTIVE'?'Deactivate user':'Activate user'">
                        <i class="bi" [ngClass]="u.status==='ACTIVE'?'bi-person-x':'bi-person-check'"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger"
                              (click)="deleteUser(u.userId)" title="Delete user">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filtered.length === 0">
                  <td colspan="8" class="text-center text-muted py-5">
                    <i class="bi bi-people" style="font-size:2.5rem;opacity:0.3"></i>
                    <p class="mt-2 mb-0">No users found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="card mt-3">
        <div class="card-body py-2">
          <div class="d-flex flex-wrap gap-3 align-items-center">
            <small class="text-muted fw-semibold">Role Portals:</small>
            <small *ngFor="let r of roles" class="d-flex align-items-center gap-1">
              <span class="badge" [ngClass]="roleBadge(r)">{{ r }}</span>
              <span class="text-muted">→ {{ rolePortalName(r) }}</span>
            </small>
          </div>
          <div class="mt-2 alert alert-warning py-1 px-2 mb-0 small">
            <i class="bi bi-info-circle me-1"></i>
            After changing a role, the user must <strong>log out and log back in</strong> to access their new portal.
          </div>
        </div>
      </div>

    </div>
  `
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  loading = true;
  search = '';
  filterRole = '';
  filterStatus = '';
  savingRole: number | null = null;
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  // tracks selected role per user in the dropdown
  roleSelections: Record<number, string> = {};

  roles = ['CITIZEN', 'LAWYER', 'JUDGE', 'CLERK', 'ADMIN', 'COMPLIANCE', 'AUDITOR'];

  constructor(private api: UserApiService) {}

  get filtered(): UserResponse[] {
    return this.users.filter(u =>
      (!this.filterRole   || u.role   === this.filterRole) &&
      (!this.filterStatus || u.status === this.filterStatus) &&
      (!this.search ||
        u.name.toLowerCase().includes(this.search.toLowerCase()) ||
        u.email.toLowerCase().includes(this.search.toLowerCase()))
    );
  }

  ngOnInit(): void {
    this.api.getAll().subscribe({
      next: d => {
        this.users = d;
        // pre-populate role dropdown with current role
        d.forEach(u => this.roleSelections[u.userId] = u.role);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  changeRole(u: UserResponse): void {
    const newRole = this.roleSelections[u.userId];
    if (!newRole || newRole === u.role) return;

    if (!confirm(`Change ${u.name}'s role from ${u.role} to ${newRole}?\n\nThe user will need to log out and log back in to access their new portal.`)) {
      this.roleSelections[u.userId] = u.role; // reset dropdown
      return;
    }

    this.savingRole = u.userId;
    this.api.updateRole(u.userId, newRole).subscribe({
      next: updated => {
        this.users = this.users.map(x => x.userId === u.userId ? updated : x);
        this.roleSelections[u.userId] = updated.role;
        this.savingRole = null;
        this.showToast(`${updated.name}'s role changed to ${updated.role}. Ask them to log out and log back in.`, 'success');
      },
      error: (e) => {
        this.savingRole = null;
        this.roleSelections[u.userId] = u.role; // reset on error
        this.showToast(e.error?.message || 'Failed to change role. Please try again.', 'error');
      }
    });
  }

  toggleStatus(u: UserResponse): void {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'INACTIVE' ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${u.name}?`)) return;
    this.api.updateStatus(u.userId, newStatus).subscribe(updated => {
      this.users = this.users.map(x => x.userId === u.userId ? updated : x);
      this.showToast(`${updated.name} has been ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, 'success');
    });
  }

  deleteUser(id: number): void {
    const u = this.users.find(x => x.userId === id);
    if (!confirm(`Permanently delete ${u?.name}? This cannot be undone.`)) return;
    this.api.delete(id).subscribe(() => {
      this.users = this.users.filter(u => u.userId !== id);
      this.showToast('User deleted.', 'success');
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  roleBadge(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bg-danger', JUDGE: 'bg-primary', LAWYER: 'bg-info text-dark',
      CLERK: 'bg-warning text-dark', CITIZEN: 'bg-secondary',
      COMPLIANCE: 'bg-success', AUDITOR: 'bg-dark'
    };
    return m[role] ?? 'bg-secondary';
  }

  roleAvatarBg(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bg-danger', JUDGE: 'bg-primary', LAWYER: 'bg-info',
      CLERK: 'bg-warning', CITIZEN: 'bg-secondary',
      COMPLIANCE: 'bg-success', AUDITOR: 'bg-dark'
    };
    return m[role] ?? 'bg-secondary';
  }

  roleIcon(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bi-shield-fill', JUDGE: 'bi-person-badge',
      LAWYER: 'bi-briefcase-fill', CLERK: 'bi-clipboard-fill',
      CITIZEN: 'bi-person-fill', COMPLIANCE: 'bi-shield-check',
      AUDITOR: 'bi-search'
    };
    return m[role] ?? 'bi-person';
  }

  rolePortalName(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'Admin Panel', JUDGE: 'Judge Console', LAWYER: 'Lawyer Dashboard',
      CLERK: 'Clerk Panel', CITIZEN: 'Citizen Portal',
      COMPLIANCE: 'Compliance Console', AUDITOR: 'Auditor Dashboard'
    };
    return m[role] ?? role;
  }
}
