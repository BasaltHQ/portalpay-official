import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';
import ToastAuthService from '@/lib/services/toast-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Toast API Debug ===');
    
    // Test authentication
    const authService = ToastAuthService.getInstance();
    const token = await authService.getAccessToken();
    console.log('Access token obtained:', token ? `${token.substring(0, 50)}...` : 'No token');
    
    // Decode JWT token to check scopes
    let tokenScopes: string[] = [];
    try {
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          tokenScopes = payload.scope ? payload.scope.split(' ') : [];
          console.log('🔍 Token scopes:', tokenScopes);
        }
      }
    } catch (e) {
      console.log('Could not decode token:', e);
    }
    
    // Test API client
    const apiClient = new ToastAPIClient();
    
    // Get restaurants first
    console.log('Getting restaurants...');
    const restaurants = await apiClient.getConnectedRestaurants();
    console.log('Restaurants found:', restaurants.data.length);
    
    if (restaurants.data.length > 0) {
      const restaurant = restaurants.data[0];
      console.log('First restaurant:', restaurant);
      
      // Try to get employees for this restaurant
      console.log(`Getting employees for restaurant: ${restaurant.guid}`);
      console.log('Restaurant object:', JSON.stringify(restaurant, null, 2));
      
      // Let's try different approaches to the employee API
      try {
        // First try direct API call with different approaches
        const authService = ToastAuthService.getInstance();
        const headers = await authService.getAuthHeaders();
        
        const testEndpoints = [
          {
            url: `https://ws-api.toasttab.com/labor/v1/employees?restaurantGuid=${restaurant.guid}`,
            headers: { ...headers }
          },
          {
            url: `https://ws-api.toasttab.com/labor/v1/employees?restaurantGuid=${restaurant.guid}`,
            headers: { ...headers, 'restaurant-external-id': restaurant.guid }
          },
          {
            url: `https://ws-api.toasttab.com/labor/v1/employees?restaurantGuid=${restaurant.guid}`,
            headers: { ...headers, 'Toast-Restaurant-External-Id': restaurant.guid }
          }
        ];
        
        for (const test of testEndpoints) {
          try {
            console.log(`🧪 Testing: ${test.url}`);
            console.log(`Headers:`, Object.keys(test.headers));
            
            const response = await fetch(test.url, {
              method: 'GET',
              headers: test.headers
            });
            
            console.log(`Response: ${response.status} ${response.statusText}`);
            const responseText = await response.text();
            console.log('Response body:', responseText.substring(0, 500));
            
            if (response.ok) {
              console.log('✅ SUCCESS with test endpoint!');
              break;
            }
          } catch (testError) {
            console.log('❌ Test failed:', testError);
          }
        }
        
        // Then try our regular method
        const employees = await apiClient.getEmployees(restaurant.guid, 1, 10);
        console.log('Employees found:', employees.data.length);
        
        return NextResponse.json({
          success: true,
          debug: {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenScopes: tokenScopes,
            hasEmployeeScope: tokenScopes.includes('labor.employees:read'),
            hasLaborScope: tokenScopes.includes('labor:read'),
            restaurantsCount: restaurants.data.length,
            firstRestaurant: restaurant,
            employeesCount: employees.data.length,
            employees: employees.data,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (employeeError) {
        console.error('Employee fetch error:', employeeError);
        return NextResponse.json({
          success: false,
          debug: {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenScopes: tokenScopes,
            hasEmployeeScope: tokenScopes.includes('labor.employees:read'),
            hasLaborScope: tokenScopes.includes('labor:read'),
            missingScope: !tokenScopes.includes('labor.employees:read') ? 'labor.employees:read' : null,
            restaurantsCount: restaurants.data.length,
            firstRestaurant: restaurant,
            employeeError: employeeError instanceof Error ? employeeError.message : 'Unknown error',
          },
          error: 'Failed to fetch employees',
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        debug: {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenScopes: tokenScopes,
          hasEmployeeScope: tokenScopes.includes('labor.employees:read'),
          hasLaborScope: tokenScopes.includes('labor:read'),
          restaurantsCount: 0,
        },
        error: 'No restaurants found',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Debug API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}