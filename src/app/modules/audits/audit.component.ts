import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../core/services/api.service';
import { AuditResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html'
})
export class AuditComponent implements OnInit {
  audits: AuditResponse[] = [];
  officers: UserResponse[] = [];
  auditsLoading = true;
  showAuditForm = false;
  auditForm = { officerId: 0, scope: '', findings: '' };

  constructor(private userApi: UserApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadAudits();
  }

  loadAudits() {
    // Logic to load audits
  }

  onAddAudit() {
    // Logic to add audit
  }

  auditBadge(status: string) {
    const badges: { [key: string]: string } = {
      'pending': 'bg-warning',
      'completed': 'bg-success',
      'rejected': 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  }
}
