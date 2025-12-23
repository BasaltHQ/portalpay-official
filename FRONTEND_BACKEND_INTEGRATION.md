# Frontend-Backend Integration Guide

Your Varuni Backoffice frontend is now fully connected to the GraphQL backend! Here's what's been implemented and how to use it.

## 🎉 What's Been Connected

### ✅ **Apollo Client Setup**
- **Apollo Client Configuration** - `src/lib/apollo-client.ts`
- **Apollo Provider** - `src/components/providers/apollo-provider.tsx`
- **Root Layout Integration** - Apollo Provider wraps the entire app

### ✅ **GraphQL Hooks & Queries**
- **Complete Hook Library** - `src/lib/hooks/use-graphql.ts`
- **All CRUD Operations** - Queries and mutations for every entity
- **Real-time Updates** - Automatic cache invalidation and refetching

### ✅ **Dashboard Integration**
- **Real Data Display** - Dashboard now shows actual database data
- **Loading States** - Proper loading indicators while data fetches
- **Error Handling** - Graceful error states for failed requests

## 🚀 How to Use

### 1. **Environment Setup**
Create a `.env.local` file in your project root:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/varuni-backoffice

# GraphQL API URL
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql

# Application Configuration
NODE_ENV=development
```

### 2. **Start the Backend**
```bash
# Test database connection
npm run test:backend

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

### 3. **Verify Integration**
1. Open `http://localhost:3000`
2. Login with any valid email/password
3. Navigate to the dashboard
4. You should see real data from your database!

## 📊 Available Data

### **Dashboard Metrics**
- **Revenue** - Real revenue data from analytics
- **Orders** - Actual order counts
- **Active Staff** - Count of active team members
- **Table Turnover** - Real turnover rates

### **Team Management**
- **Staff List** - All team members from database
- **Performance Data** - Real performance metrics
- **Department Info** - Actual department assignments

### **Inventory Management**
- **Stock Levels** - Real inventory counts
- **Low Stock Alerts** - Items below threshold
- **Categories** - Actual inventory categories

## 🔧 Using GraphQL Hooks

### **In Any Component:**
```tsx
import { useTeamMembers, useInventoryItems, useAnalytics } from '@/lib/hooks/use-graphql';

function MyComponent() {
  const { data: teamData, loading: teamLoading, error: teamError } = useTeamMembers();
  const { data: inventoryData, loading: inventoryLoading } = useInventoryItems();
  const { data: analyticsData } = useAnalytics('daily');

  if (teamLoading) return <div>Loading team data...</div>;
  if (teamError) return <div>Error loading team data</div>;

  return (
    <div>
      <h2>Team Members: {teamData?.teamMembers?.length || 0}</h2>
      <h2>Inventory Items: {inventoryData?.inventoryItems?.length || 0}</h2>
      <h2>Revenue: ${analyticsData?.analytics?.revenue || 0}</h2>
    </div>
  );
}
```

### **Available Hooks:**

#### **Team Management**
- `useTeamMembers()` - Get all team members
- `useTeamMember(id)` - Get specific team member
- `useCreateTeamMember()` - Create new team member
- `useUpdateTeamMember()` - Update team member
- `useDeleteTeamMember()` - Delete team member

#### **Inventory Management**
- `useInventoryItems()` - Get all inventory items
- `useInventoryItem(id)` - Get specific item
- `useLowStockItems()` - Get low stock items
- `useCreateInventoryItem()` - Create new item
- `useUpdateInventoryItem()` - Update item
- `useUpdateStock()` - Update stock levels
- `useDeleteInventoryItem()` - Delete item

#### **Scheduling**
- `useShifts(startDate, endDate)` - Get shifts for date range
- `useShift(id)` - Get specific shift
- `useCreateShift()` - Create new shift
- `useUpdateShift()` - Update shift
- `useDeleteShift()` - Delete shift

#### **Invoicing**
- `useInvoices()` - Get all invoices
- `useInvoice(id)` - Get specific invoice
- `useCreateInvoice()` - Create new invoice
- `useUpdateInvoice()` - Update invoice
- `useMarkInvoicePaid()` - Mark invoice as paid
- `useDeleteInvoice()` - Delete invoice

#### **Analytics**
- `useAnalytics(period)` - Get analytics for period
- `useRevenueAnalytics(startDate, endDate)` - Get revenue analytics

## 🎯 Example: Updating Inventory

```tsx
import { useUpdateStock } from '@/lib/hooks/use-graphql';

function UpdateStockButton({ itemId, newQuantity }) {
  const [updateStock, { loading }] = useUpdateStock();

  const handleUpdate = async () => {
    try {
      await updateStock({
        variables: {
          id: itemId,
          quantity: newQuantity
        }
      });
      // Success! Data will automatically refresh
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  return (
    <button 
      onClick={handleUpdate} 
      disabled={loading}
      className="bg-orange-600 text-white px-4 py-2 rounded"
    >
      {loading ? 'Updating...' : 'Update Stock'}
    </button>
  );
}
```

## 🔄 Automatic Updates

The Apollo Client is configured with:
- **Automatic Cache Updates** - Data refreshes when mutations complete
- **Optimistic Updates** - UI updates immediately, then syncs with server
- **Error Handling** - Graceful error states and retry logic
- **Loading States** - Built-in loading indicators

## 🛠️ Development Workflow

### **Adding New Features:**
1. **Backend**: Add new GraphQL queries/mutations to `schema.ts`
2. **Resolvers**: Implement in `resolvers.ts`
3. **Frontend**: Add hooks to `use-graphql.ts`
4. **Components**: Use the hooks in your components

### **Testing:**
1. **GraphQL Playground**: `http://localhost:3000/api/graphql`
2. **Browser DevTools**: Check Network tab for GraphQL requests
3. **Apollo DevTools**: Install browser extension for debugging

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Cannot find module" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that Apollo Client is properly configured

2. **GraphQL connection errors**
   - Verify MongoDB is running
   - Check `.env.local` configuration
   - Ensure GraphQL API route is accessible

3. **Data not loading**
   - Check browser console for errors
   - Verify database is seeded with `npm run seed`
   - Test GraphQL endpoint directly

4. **TypeScript errors**
   - These are mostly import resolution warnings
   - Backend will work despite TypeScript warnings
   - Can be ignored for now or fixed with proper type declarations

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Dashboard shows real data instead of mock data
- ✅ Loading states appear while data fetches
- ✅ GraphQL requests appear in browser Network tab
- ✅ No console errors related to Apollo Client
- ✅ Data updates when you make changes

## 🚀 Next Steps

1. **Test all features** - Try creating, updating, and deleting data
2. **Add authentication** - Implement JWT authentication
3. **Real-time features** - Add GraphQL subscriptions
4. **Production deployment** - Deploy to your preferred platform

Your frontend is now fully connected to your GraphQL backend! 🎉 