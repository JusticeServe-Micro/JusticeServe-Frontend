import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JudgmentApiService } from '../../core/services/api.service';
import { JudgmentResponse } from '../../shared/models/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-judgments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl:"./judgments-list.html"
})
export class JudgmentsListComponent implements OnInit {
  tab = 'judgments';
  judgments: JudgmentResponse[] = [];
  orders: any[] = [];
  loading = true;
  ordersLoading = false;

  constructor(private api: JudgmentApiService) {}

  ngOnInit(): void {
    this.api.getAll().subscribe({ next: d => { this.judgments = d; this.loading = false; }, error: () => this.loading = false });
  }

  loadOrders(): void {
    if (this.orders.length) return;
    this.ordersLoading = true;
    this.api.getAllOrders().subscribe({ next: d => { this.orders = d; this.ordersLoading = false; }, error: () => this.ordersLoading = false });
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
}