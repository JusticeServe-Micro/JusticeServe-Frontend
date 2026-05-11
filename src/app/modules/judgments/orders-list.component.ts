import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ 
    selector: 'app-orders-list', 
    standalone: true, 
    imports: [RouterLink], 
    template: `
    <div class="p-4">Redirecting...</div>
    ` 
})
export class OrdersListComponent { }
