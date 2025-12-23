# Toast POS Integration Guide

This guide covers the complete Toast POS integration that has been implemented in your application.

## Overview

The Toast integration provides comprehensive Point of Sale functionality including:
- Employee management and synchronization
- Order tracking and analytics  
- Menu management
- Real-time webhook support
- Comprehensive error handling and logging

## Environment Setup

Add these environment variables to your `.env.local` file:

```env
# Toast API Credentials
TOAST_CLIENT_ID=ZNt0eJ4SpovBJFqPF2hYHo2FXQT8cesx
TOAST_CLIENT_SECRET=qK8YBX4Z27oUA8M36Ppw5newpF6GE4zJ8HiqOvQTsN8j6Dsem0LAGSDjF8lCzeIc
TOAST_API_HOSTNAME=https://ws-api.toasttab.com
TOAST_USER_ACCESS_TYPE=TOAST_MACHINE_CLIENT

# Optional: Webhook secret for signature verification
TOAST_WEBHOOK_SECRET=your-webhook-secret-here
```

## Core Components

### 1. Authentication Service (`src/lib/services/toast-auth.ts`)
- Handles OAuth authentication with Toast API
- Manages token refresh automatically
- Singleton pattern for application-wide access

**Key Features:**
- Automatic token refresh with 5-minute buffer
- Secure credential management
- Error handling with retry logic

### 2. API Client (`src/lib/services/toast-api-client.ts`)
- Comprehensive wrapper for all Toast API endpoints
- Type-safe with Zod schema validation
- Built-in error handling and logging

**Available Methods:**
- `getEmployees(restaurantGuid, page, pageSize)` - Fetch employee data
- `getOrders(restaurantGuid, startDate, endDate)` - Retrieve orders
- `getMenus(restaurantGuid)` - Get menu information
- `getRestaurants()` - List connected restaurants
- `getSalesSummary(restaurantGuid, businessDate)` - Analytics data

### 3. Data Models
- **ToastEmployee** (`src/lib/models/ToastEmployee.ts`) - Employee data structure
- **ToastOrder** (`src/lib/models/ToastOrder.ts`) - Order data structure

**Features:**
- MongoDB integration with Mongoose
- Automatic sync status tracking
- Data validation and error handling
- Efficient indexing for performance

### 4. API Routes

All Toast endpoints are available under `/api/toast/`:

#### Authentication
- `POST /api/toast/auth` - Test authentication
- `GET /api/toast/auth` - Check auth status
- `DELETE /api/toast/auth` - Logout

#### Employee Management
- `GET /api/toast/employees?restaurantGuid=<guid>&sync=true` - Sync employees
- `POST /api/toast/employees` - Create employee
- `GET /api/toast/employees/[id]` - Get specific employee
- `PUT /api/toast/employees/[id]` - Update employee
- `DELETE /api/toast/employees/[id]` - Deactivate employee

#### Orders
- `GET /api/toast/orders?restaurantGuid=<guid>&startDate=<date>&endDate=<date>` - Get orders

#### Other Endpoints
- `GET /api/toast/restaurants` - List restaurants
- `GET /api/toast/menus?restaurantGuid=<guid>` - Get menus
- `GET /api/toast/analytics` - Analytics data
- `POST /api/toast/webhooks` - Webhook handler
- `POST /api/toast/sync` - Full synchronization

### 5. React Hook (`src/lib/hooks/use-toast-integration.ts`)

Provides easy-to-use React interface for Toast integration:

```typescript
const {
  integrationStatus,     // Connection status and metadata
  syncStatus,           // Sync progress and results
  employees,            // Synchronized employees
  restaurants,          // Connected restaurants
  selectedRestaurant,   // Currently selected restaurant
  testConnection,       // Test API connection
  syncEmployees,        // Sync employee data
  performFullSync,      // Full data synchronization
} = useToastIntegration();
```

### 6. Error Handling (`src/lib/services/toast-error-handler.ts`)

Comprehensive error management system:

**Error Types:**
- `AUTHENTICATION` - Auth failures
- `NETWORK` - Connection issues
- `RATE_LIMIT` - API rate limiting
- `VALIDATION` - Data validation errors
- `SERVER` - Toast server errors
- `WEBHOOK` - Webhook processing errors
- `SYNC` - Synchronization errors

**Features:**
- Automatic error categorization
- User-friendly toast notifications
- Error logging and analytics
- Retry logic with exponential backoff
- Health status monitoring

## Usage Examples

### Basic Connection Test
```typescript
const { testConnection, integrationStatus } = useToastIntegration();

// Test the connection
await testConnection();

// Check status
if (integrationStatus.status === 'connected') {
  console.log('Toast integration is working!');
}
```

### Employee Synchronization
```typescript
const { syncEmployees, employees } = useToastIntegration();

// Sync employees from Toast
await syncEmployees();

// Access synchronized employee data
console.log(`Found ${employees.length} employees`);
```

### Full Data Sync
```typescript
const { performFullSync } = useToastIntegration();

// Sync all data (employees, orders, etc.)
await performFullSync();
```

### Custom API Calls
```typescript
import ToastAPIClient from '@/lib/services/toast-api-client';

const client = new ToastAPIClient();

// Get orders for the last week
const orders = await client.getOrders(
  restaurantGuid,
  '2025-01-15',
  '2025-01-22'
);

// Get sales analytics
const sales = await client.getSalesSummary(
  restaurantGuid,
  '20250122'
);
```

## Webhook Setup

1. Configure webhook URL in Toast dashboard: `https://yourdomain.com/api/toast/webhooks`
2. Set webhook secret in environment variables
3. The webhook handler automatically processes:
   - Employee created/updated/deleted
   - Order created/updated/deleted
   - Real-time data synchronization

## UI Integration

The integration automatically updates the following UI components:

### Settings Page (`/dashboard/settings`)
- Connection status indicator
- Restaurant selection dropdown
- Sync progress display
- Error notifications
- Configure/Connect buttons

### Team Page (`/dashboard/team`)
- Toast sync status card
- Employee count and sync statistics
- Real-time sync button
- Loading states and animations

## Data Flow

1. **Authentication**: Auto-handles OAuth token management
2. **Data Retrieval**: API client fetches data from Toast
3. **Local Storage**: Data saved to MongoDB with sync status
4. **UI Updates**: React hooks provide real-time status
5. **Webhooks**: Real-time updates from Toast platform
6. **Error Handling**: Comprehensive error management and user feedback

## Monitoring and Debugging

### Error Monitoring
```typescript
import ToastErrorHandler from '@/lib/services/toast-error-handler';

const errorHandler = ToastErrorHandler.getInstance();

// Get recent errors
const recentErrors = errorHandler.getRecentErrors(10);

// Check health status
const health = errorHandler.getHealthStatus(); // 'healthy' | 'warning' | 'critical'

// Get error statistics
const stats = errorHandler.getErrorStats();
```

### Sync Status Checking
```typescript
// Get sync status for a restaurant
const response = await fetch(`/api/toast/sync?restaurantGuid=${restaurantGuid}`);
const syncStatus = await response.json();

console.log(syncStatus.data.employees.total); // Total employees synced
console.log(syncStatus.data.orders.total);    // Total orders synced
```

## Best Practices

1. **Rate Limiting**: The system handles Toast API rate limits automatically
2. **Error Recovery**: Failed requests are retried with exponential backoff
3. **Data Validation**: All data is validated with Zod schemas
4. **Performance**: Efficient database indexing and query optimization
5. **Security**: Webhook signature verification and secure credential handling

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify credentials in `.env.local`
   - Check if credentials are valid in Toast platform
   - Ensure API hostname is correct

2. **No Restaurants Found**
   - Confirm your integration is approved by Toast
   - Check restaurant connection in Toast dashboard
   - Verify API permissions

3. **Sync Errors**
   - Check error logs in the UI
   - Verify restaurant GUID is correct
   - Ensure database connection is working

4. **Webhook Issues**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Review webhook logs in browser network tab

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging:
- API request/response details
- Error stack traces
- Webhook payload logging
- Database query logging

## Support

For issues with this integration:
1. Check the error logs in the UI (`/dashboard/settings`)
2. Review browser console for detailed error information
3. Test individual API endpoints using the built-in tools
4. Verify Toast API credentials and permissions

The integration includes comprehensive error handling and logging to help diagnose and resolve issues quickly.