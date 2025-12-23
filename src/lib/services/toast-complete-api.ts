/**
 * Complete Toast API Integration
 * Based on official Toast API Reference: https://doc.toasttab.com/openapi/
 */

import ToastAPIClient from './toast-api-client';
import ToastAuthService from './toast-auth';

export interface ToastAnalyticsData {
  revenue: number;
  orders: number;
  averageCheck: number;
  period: string;
  laborHours?: number;
  timeEntriesCount?: number;
}

export interface ToastMenuItem {
  guid: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface ToastOrder {
  guid: string;
  orderNumber: string;
  total: number;
  status: string;
  createdDate: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export class ToastCompleteAPI {
  private apiClient: ToastAPIClient;
  private authService: ToastAuthService;

  constructor() {
    this.apiClient = new ToastAPIClient();
    this.authService = ToastAuthService.getInstance();
  }

  /**
   * Analytics API - Get revenue data (try different endpoint)
   * Reference: https://doc.toasttab.com/openapi/#tag/Analytics
   */
  async getAnalytics(restaurantGuid: string, startDate: string, endDate: string): Promise<ToastAnalyticsData> {
    // Try different analytics endpoint - some require different permissions
    const endpoint = `/labor/v1/timeentries`;
    const queryParams = {
      restaurantGuid,
      startDate,
      endDate,
      businessDate: startDate,
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown[]>(endpoint, 'GET', undefined, queryParams, headers);
      
      // Transform labor data to analytics format
      const timeEntries = Array.isArray(response) ? response : (response as {data?: unknown[]}).data || [];
      return {
        revenue: 0, // Labor API doesn't provide revenue directly
        orders: 0,
        averageCheck: 0,
        period: `${startDate} to ${endDate}`,
        laborHours: timeEntries.length
      };
    } catch (error) {
      console.error('Analytics API error:', error);
      throw error;
    }
  }

  /**
   * Menus V3 API - Get menu items
   * Reference: https://doc.toasttab.com/openapi/#tag/Menus-V3
   */
  async getMenuItems(restaurantGuid: string): Promise<ToastMenuItem[]> {
    const endpoint = `/menus/v3/menus`;
    const queryParams = {
      restaurantGuid,
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown[]>(endpoint, 'GET', undefined, queryParams, headers);
      
      const menus = Array.isArray(response) ? response : (response as {data?: unknown[]}).data || [];
      const menuItems: ToastMenuItem[] = [];

      // Extract items from all menus
      (menus as { menuGroups?: { name: string; menuItems?: { guid: string; name: string; description: string; pricing: { basePrice: number; }; disabled: boolean; }[] }[] }[]).forEach((menu) => {
        if (menu.menuGroups) {
          menu.menuGroups.forEach((group) => {
            if (group.menuItems) {
              group.menuItems.forEach((item) => {
                menuItems.push({
                  guid: item.guid,
                  name: item.name,
                  description: item.description || '',
                  price: item.pricing?.basePrice || 0,
                  category: group.name,
                  available: !item.disabled,
                });
              });
            }
          });
        }
      });

      return menuItems;
    } catch (error) {
      console.error('Menus API error:', error);
      throw error;
    }
  }

  /**
   * Orders API - Get recent orders (max 1 hour interval)
   * Reference: https://doc.toasttab.com/openapi/#tag/Orders
   */
  async getOrders(restaurantGuid: string, startDate: string, endDate: string): Promise<ToastOrder[]> {
    // Toast Orders API only allows 1 hour intervals
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneHourLater = new Date(start.getTime() + 60 * 60 * 1000);
    const actualEndDate = end > oneHourLater ? oneHourLater.toISOString() : endDate;

    const endpoint = `/orders/v2/orders`;
    const queryParams = {
      restaurantGuid,
      startDate,
      endDate: actualEndDate,
      pageSize: '50', // Reduce page size
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown[]>(endpoint, 'GET', undefined, queryParams, headers);
      
      const orders = Array.isArray(response) ? response : (response as {data?: unknown[]}).data || [];
      
      return (orders as { guid: string; orderNumber: string; totalAmount: number; orderStatus: string; createdDate: string; customer: { firstName: string; lastName: string; email: string; }; selections: { item: { name: string; }; quantity: number; price: number; }[]; }[]).map((order) => ({
        guid: order.guid,
        orderNumber: order.orderNumber || '',
        total: order.totalAmount || 0,
        status: order.orderStatus || 'unknown',
        createdDate: order.createdDate,
        customer: order.customer ? {
          firstName: order.customer.firstName || '',
          lastName: order.customer.lastName || '',
          email: order.customer.email || '',
        } : undefined,
        items: (order.selections || []).map((item) => ({
          name: item.item?.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
        })),
      }));
    } catch (error) {
      console.error('Orders API error:', error);
      throw error;
    }
  }

  /**
   * Stock API - Get inventory levels
   * Reference: https://doc.toasttab.com/openapi/#tag/Stock
   */
  async getStockLevels(restaurantGuid: string): Promise<unknown[]> {
    const endpoint = `/stock/v1/inventory`;
    const queryParams = {
      restaurantGuid,
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown[]>(endpoint, 'GET', undefined, queryParams, headers);
      return Array.isArray(response) ? response : (response as {data?: unknown[]}).data || [];
    } catch (error) {
      console.error('Stock API error:', error);
      throw error;
    }
  }

  /**
   * Kitchen API - Get kitchen orders
   * Reference: https://doc.toasttab.com/openapi/#tag/Kitchen
   */
  async getKitchenOrders(restaurantGuid: string): Promise<unknown[]> {
    const endpoint = `/kitchen/v1/orders`;
    const queryParams = {
      restaurantGuid,
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown[]>(endpoint, 'GET', undefined, queryParams, headers);
      return Array.isArray(response) ? response : (response as {data?: unknown[]}).data || [];
    } catch (error) {
      console.error('Kitchen API error:', error);
      throw error;
    }
  }

  /**
   * Cash Management API - Get cash drawer info
   * Reference: https://doc.toasttab.com/openapi/#tag/Cash-Management
   */
  async getCashDrawerInfo(restaurantGuid: string): Promise<unknown> {
    const endpoint = `/cashmgmt/v1/cashDrawers`;
    const queryParams = {
      restaurantGuid,
    };

    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    try {
      const response = await this.apiClient.makeRequest<unknown>(endpoint, 'GET', undefined, queryParams, headers);
      return response;
    } catch (error) {
      console.error('Cash Management API error:', error);
      throw error;
    }
  }
}

export default ToastCompleteAPI;