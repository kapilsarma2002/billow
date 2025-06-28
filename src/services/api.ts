import { Invoice, CreateInvoiceRequest } from '../types';

const API_BASE_URL = 'http://localhost:8080'; // Adjust this to match your Go server port

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>('/api/invoices');
  }

  async createInvoice(invoice: CreateInvoiceRequest): Promise<Invoice> {
    return this.request<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }
}

export const apiService = new ApiService();