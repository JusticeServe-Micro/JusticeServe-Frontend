import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { JudgmentResponse, CourtOrderResponse, CaseResponse, UserResponse } from '../../shared/models/models';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-judgments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./judgments-list.html",
  styleUrl: "./judgments-list.scss"
})
export class JudgmentsListComponent implements OnInit {
  tab = 'judgments';
  judgments: JudgmentResponse[] = [];
  orders: CourtOrderResponse[] = [];
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = true;
  ordersLoading = false;
  selectedJudgment: JudgmentResponse | null = null;
  selectedOrder: CourtOrderResponse | null = null;

  constructor(private api: JudgmentApiService, private caseApi: CaseApiService, private userApi: UserApiService) {}

  ngOnInit(): void {
    forkJoin({
      cases: this.caseApi.getAll(),
      judges: this.userApi.getByRole('JUDGE'),
      judgments: this.api.getAll()
    }).subscribe({
      next: ({ cases, judges, judgments }) => {
        this.cases = cases;
        this.judges = judges;
        this.judgments = judgments.map(j => ({
          ...j,
          caseTitle: cases.find(c => c.caseId === j.caseId)?.title || 'Unknown',
          judgeName: judges.find(u => u.userId === j.judgeId)?.name || 'Unknown'
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadOrders(): void {
    if (this.orders.length) return;
    this.ordersLoading = true;
    this.api.getAllOrders().subscribe({ 
      next: orders => { 
        this.orders = orders.map(o => ({
          ...o,
          caseTitle: this.cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
          judgeName: this.judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
        }));
        this.ordersLoading = false; 
      }, 
      error: () => this.ordersLoading = false 
    });
  }

  finalize(id: number): void {
    this.api.finalize(id).subscribe(j => {
      const updated = {
        ...j,
        caseTitle: this.cases.find(c => c.caseId === j.caseId)?.title || 'Unknown',
        judgeName: this.judges.find(u => u.userId === j.judgeId)?.name || 'Unknown'
      };
      this.judgments = this.judgments.map(x => x.judgmentId === id ? updated : x);
    });
  }

  updateOrder(id: number, status: string): void {
    this.api.updateOrderStatus(id, status).subscribe(o => {
      const updated = {
        ...o,
        caseTitle: this.cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
        judgeName: this.judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
      };
      this.orders = this.orders.map(x => x.orderId === id ? updated : x);
    });
  }

  viewJudgment(j: JudgmentResponse): void {
    this.selectedJudgment = j;
  }

  viewOrder(o: CourtOrderResponse): void {
    this.selectedOrder = o;
  }

  closeModal(): void {
    this.selectedJudgment = null;
    this.selectedOrder = null;
  }

  downloadJudgmentPDF(judgment: JudgmentResponse | null): void {
    if (!judgment) return;
    
    // Create canvas for PDF generation
    const htmlContent = this.generateJudgmentHTML(judgment);
    this.generatePDF(htmlContent, `Judgment_${judgment.judgmentId}.pdf`);
  }

  downloadOrderPDF(order: CourtOrderResponse | null): void {
    if (!order) return;
    
    const htmlContent = this.generateOrderHTML(order);
    this.generatePDF(htmlContent, `CourtOrder_${order.orderId}.pdf`);
  }

  private generateJudgmentHTML(judgment: JudgmentResponse): string {
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
            .badge-final { background: #28a745; color: white; }
            .badge-draft { background: #ffc107; color: #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 JUDGMENT DOCUMENT</h1>
            <p>Judgment ID: #${judgment.judgmentId}</p>
          </div>

          <div class="section">
            <div class="section-title">Judgment Status</div>
            <span class="badge ${judgment.status === 'FINAL' ? 'badge-final' : 'badge-draft'}">
              ${judgment.status}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Judgment Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Judgment ID</div>
                <div class="info-value">#${judgment.judgmentId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Issued</div>
                <div class="info-value">${new Date(judgment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Judge</div>
                <div class="info-value">${judgment.judgeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case</div>
                <div class="info-value">${judgment.caseTitle}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Judgment Summary</div>
            <div class="content-box">
              ${judgment.summary.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div class="footer">
            <p>This document is generated from JusticeServe Case Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `;
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
            <span class="badge badge-${order.status.toLowerCase()}">
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
            <div class="content-box">
              ${order.description.replace(/\n/g, '<br>')}
            </div>
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
