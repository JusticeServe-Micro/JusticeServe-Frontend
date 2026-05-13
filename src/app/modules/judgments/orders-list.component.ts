import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { CourtOrderResponse, CaseResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./orders-list.html",
  styleUrl: "./orders-list.scss"
})
export class OrdersListComponent implements OnInit {
  orders: CourtOrderResponse[] = [];
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = true;
  selectedOrder: CourtOrderResponse | null = null;

  constructor(
    private api: JudgmentApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    public auth: AuthService
  ) {}

  get isAuditorOrCompliance(): boolean {
    return this.auth.hasRole('AUDITOR') || this.auth.hasRole('COMPLIANCE');
  }

  get isJudge(): boolean {
    return this.auth.hasRole('JUDGE');
  }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;

    forkJoin({
      cases: this.caseApi.getAll(),
      judges: this.userApi.getByRole('JUDGE'),
      orders: this.api.getAllOrders()
    }).subscribe({
      next: ({ cases, judges, orders }) => {
        this.cases = cases;
        this.judges = judges;

        const filteredOrders = this.isJudge && userId
          ? orders.filter(o => o.judgeId === userId)
          : orders;

        this.orders = filteredOrders.map(o => ({
          ...o,
          caseTitle: o.caseTitle || cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
          judgeName: o.judgeName || judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
        }));

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  viewOrder(order: CourtOrderResponse): void {
    this.selectedOrder = order;
  }

  closeModal(): void {
    this.selectedOrder = null;
  }

  downloadOrderPDF(order: CourtOrderResponse | null): void {
    if (!order) return;
    const htmlContent = this.generateOrderHTML(order);
    this.generatePDF(htmlContent, `CourtOrder_${order.orderId}.pdf`);
  }

  private generateOrderHTML(order: CourtOrderResponse): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
            .section { margin-bottom: 25px; }
            .section-title { background: #f0f0f0; padding: 10px 15px; border-left: 4px solid #667eea; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; color: #333; font-weight: 600; }
            .content-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background: #fafafa; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 11px; color: #666; text-align: center; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-active { background: #28a745; color: white; }
            .badge-served { background: #17a2b8; color: white; }
            .badge-expired { background: #6c757d; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚖️ COURT ORDER</h1>
            <p>Order ID: #${order.orderId}</p>
          </div>

          <div class="section">
            <div class="section-title">Order Status</div>
            <span class="badge ${order.status === 'ACTIVE' ? 'badge-active' : order.status === 'SERVED' ? 'badge-served' : 'badge-expired'}">
              ${order.status}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Court Order Details</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Order ID</div>
                <div class="info-value">#${order.orderId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Issued</div>
                <div class="info-value">${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Judge</div>
                <div class="info-value">${order.judgeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case</div>
                <div class="info-value">${order.caseTitle}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Description</div>
            <div class="content-box">${order.description.replace(/\n/g, '<br>')}</div>
          </div>

          <div class="footer">
            <p>This document is generated from JusticeServe Case Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generatePDF(htmlContent: string, filename: string): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    this.simpleHTMLToPDF(htmlContent, filename);
    document.body.removeChild(tempDiv);
  }

  private simpleHTMLToPDF(htmlContent: string, filename: string): void {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 100);
    }
  }
}

