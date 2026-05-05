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
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-hammer me-2"></i>Judgments & Court Orders</h4>
      <div class="d-flex gap-2">
        <a routerLink="/judgments/orders/new" class="btn btn-outline-primary"><i class="bi bi-file-text me-1"></i>Issue Order</a>
        <a routerLink="/judgments/new" class="btn btn-primary"><i class="bi bi-plus me-1"></i>Record Judgment</a>
      </div>
    </div>
    <div class="p-4">
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='judgments'" (click)="tab='judgments'">Judgments</a></li>
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='orders'" (click)="tab='orders';loadOrders()">Court Orders</a></li>
      </ul>

      <!-- Judgments tab -->
      <div *ngIf="tab==='judgments'">
        <div class="card">
          <div class="card-body p-0">
            <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
            <div class="table-responsive" *ngIf="!loading">
              <table class="table table-hover mb-0">
                <thead><tr><th>ID</th><th>Case</th><th>Judge</th><th>Summary</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr *ngFor="let j of judgments">
                    <td>#{{ j.judgmentId }}</td>
                    <td>{{ j.caseTitle }}</td>
                    <td>{{ j.judgeName }}</td>
                    <td>{{ j.summary | slice:0:50 }}...</td>
                    <td>{{ j.date | date:'mediumDate' }}</td>
                    <td><span class="badge" [ngClass]="j.status==='FINAL'?'bg-success':'bg-warning text-dark'">{{ j.status }}</span></td>
                    <td>
                      <button class="btn btn-sm btn-info me-1" (click)="viewJudgment(j)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button *ngIf="j.status==='DRAFT'" class="btn btn-sm btn-success" (click)="finalize(j.judgmentId)">
                        <i class="bi bi-check-circle me-1"></i>Finalize
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="judgments.length===0"><td colspan="7" class="text-center text-muted py-4">No judgments</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders tab -->
      <div *ngIf="tab==='orders'">
        <div class="card">
          <div class="card-body p-0">
            <div *ngIf="ordersLoading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
            <div class="table-responsive" *ngIf="!ordersLoading">
              <table class="table table-hover mb-0">
                <thead><tr><th>ID</th><th>Case</th><th>Judge</th><th>Description</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr *ngFor="let o of orders">
                    <td>#{{ o.orderId }}</td>
                    <td>{{ o.caseTitle }}</td>
                    <td>{{ o.judgeName }}</td>
                    <td>{{ o.description | slice:0:50 }}...</td>
                    <td>{{ o.date | date:'mediumDate' }}</td>
                    <td>
                      <select class="form-select form-select-sm" style="width:120px" [ngModel]="o.status" (change)="updateOrder(o.orderId, $any($event.target).value)">
                        <option>ACTIVE</option><option>SERVED</option><option>EXPIRED</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-info" (click)="viewOrder(o)">
                        <i class="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="orders.length===0"><td colspan="7" class="text-center text-muted py-4">No orders</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Judgment Modal -->
    <div class="modal fade" [class.show]="selectedJudgment" [style.display]="selectedJudgment ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Judgment Details</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" *ngIf="selectedJudgment">
            <div class="row mb-3">
              <div class="col-sm-6"><strong>ID:</strong> #{{ selectedJudgment.judgmentId }}</div>
              <div class="col-sm-6"><strong>Date:</strong> {{ selectedJudgment.date | date:'medium' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-6"><strong>Case:</strong> {{ selectedJudgment.caseTitle }}</div>
              <div class="col-sm-6"><strong>Judge:</strong> {{ selectedJudgment.judgeName }}</div>
            </div>
            <div class="mb-3">
              <strong>Status:</strong> <span class="badge" [ngClass]="selectedJudgment.status==='FINAL'?'bg-success':'bg-warning text-dark'">{{ selectedJudgment.status }}</span>
            </div>
            <div>
              <strong>Summary:</strong>
              <p class="mt-2">{{ selectedJudgment.summary }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Modal -->
    <div class="modal fade" [class.show]="selectedOrder" [style.display]="selectedOrder ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Court Order Details</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" *ngIf="selectedOrder">
            <div class="row mb-3">
              <div class="col-sm-6"><strong>ID:</strong> #{{ selectedOrder.orderId }}</div>
              <div class="col-sm-6"><strong>Date:</strong> {{ selectedOrder.date | date:'medium' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-6"><strong>Case:</strong> {{ selectedOrder.caseTitle }}</div>
              <div class="col-sm-6"><strong>Judge:</strong> {{ selectedOrder.judgeName }}</div>
            </div>
            <div class="mb-3">
              <strong>Status:</strong> <span class="badge" [ngClass]="selectedOrder.status==='ACTIVE'?'bg-success':selectedOrder.status==='SERVED'?'bg-info':'bg-secondary'">{{ selectedOrder.status }}</span>
            </div>
            <div>
              <strong>Description:</strong>
              <p class="mt-2">{{ selectedOrder.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" *ngIf="selectedJudgment || selectedOrder" (click)="closeModal()"></div>
  `
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
      this.judgments = this.judgments.map(x => x.judgmentId === id ? j : x);
    });
  }

  updateOrder(id: number, status: string): void {
    this.api.updateOrderStatus(id, status).subscribe(o => {
      this.orders = this.orders.map(x => x.orderId === id ? o : x);
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
}
