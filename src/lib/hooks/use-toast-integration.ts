import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ToastIntegrationStatus {
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSync: string;
  employeesImported: number;
  rolesImported: number;
  apiKey: string;
  webhookUrl: string;
  isLoading: boolean;
  error?: string;
}

export interface ToastSyncStatus {
  lastSync: string;
  employeesImported: number;
  newEmployees: number;
  updatedProfiles: number;
  errors: number;
  isLoading: boolean;
}

export interface ToastEmployee {
  id: string;
  toastGuid: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitles: Array<{
    guid: string;
    title: string;
    tip: boolean;
    hourlyRate?: number;
  }>;
  isActive: boolean;
  lastSyncDate: string;
  syncStatus: 'pending' | 'synced' | 'error';
  isLocallyDeleted?: boolean;
}

const SHOP_SELECTION_KEY = 'ledgerone-selected-shop';
const LEGACY_SELECTION_KEY = 'toast-selected-restaurant';
export interface Restaurant {
  guid: string;
  restaurantName: string;
  locationName: string;
}

export function useToastIntegration() {
  const [integrationStatus, setIntegrationStatus] = useState<ToastIntegrationStatus>({
    status: 'disconnected',
    lastSync: 'Never',
    employeesImported: 0,
    rolesImported: 0,
    apiKey: '•••••••••••••••••••••••••••••••••••••••••••',
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/toast/webhooks` : '/api/toast/webhooks',
    isLoading: true,
  });

  const [syncStatus, setSyncStatus] = useState<ToastSyncStatus>({
    lastSync: 'Never',
    employeesImported: 0,
    newEmployees: 0,
    updatedProfiles: 0,
    errors: 0,
    isLoading: false,
  });

  const [employees, setEmployees] = useState<ToastEmployee[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => {
    // Persist shop selection in localStorage with legacy fallback
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem(SHOP_SELECTION_KEY);
      const legacy = localStorage.getItem(LEGACY_SELECTION_KEY);
      if (!current && legacy) {
        localStorage.setItem(SHOP_SELECTION_KEY, legacy);
        return legacy;
      }
      return current || legacy || '';
    }
    return '';
  });

  // Load connected restaurants
  const loadRestaurants = useCallback(async () => {
    try {
      const response = await fetch('/api/toast/restaurants');
      const data = await response.json();
      
      if (data.success) {
        setRestaurants(data.data);
        if (data.data.length > 0) {
          const restaurant = data.data[0];
          const restaurantGuid = restaurant.guid;
          console.log('Setting selected restaurant:', restaurantGuid, 'Full restaurant:', restaurant);
          
          // Only set if no restaurant is already selected (from localStorage)
          if (!selectedRestaurant) {
            setSelectedRestaurant(restaurantGuid);
            if (typeof window !== 'undefined') {
              localStorage.setItem(SHOP_SELECTION_KEY, restaurantGuid);
              localStorage.setItem(LEGACY_SELECTION_KEY, restaurantGuid);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  }, [selectedRestaurant]);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/toast/auth');
      const data = await response.json();
      
      if (data.authenticated) {
        setIntegrationStatus(prev => ({
          ...prev,
          status: 'connected',
          isLoading: false,
        }));
        
        // Load restaurants if authenticated
        await loadRestaurants();
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          status: 'disconnected',
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIntegrationStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to check authentication status',
        isLoading: false,
      }));
    }
  }, [loadRestaurants]);

  // Load employees from database
  const loadEmployees = useCallback(async (restaurantGuid?: string | Event, options?: { includeInactive?: boolean }) => {
    // Handle case where this is called from an event handler
    let targetRestaurant: string;
    if (typeof restaurantGuid === 'string') {
      targetRestaurant = restaurantGuid;
    } else {
      targetRestaurant = selectedRestaurant;
    }
    
    if (!targetRestaurant) return;

    console.log('Loading employees for restaurant:', targetRestaurant);
    try {
      const response = await fetch(`/api/toast/employees?restaurantGuid=${encodeURIComponent(targetRestaurant)}${options?.includeInactive ? '&includeInactive=true' : ''}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data.length} employees from database:`, data.data.map((emp: ToastEmployee) => `${emp.firstName} ${emp.lastName} (${emp.isLocallyDeleted ? 'HIDDEN' : 'VISIBLE'})`));
        setEmployees(data.data);
      } else {
        console.error('Failed to load employees:', data.error);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    }
  }, [selectedRestaurant]);

  // Test Toast API connection
  const testConnection = useCallback(async () => {
    setIntegrationStatus(prev => ({ ...prev, status: 'connecting', isLoading: true }));
    
    try {
      const response = await fetch('/api/toast/auth', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          status: 'connected',
          isLoading: false,
          error: undefined,
        }));
        
        toast.success('Toast integration connected successfully!');
        await loadRestaurants();
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          status: 'error',
          error: data.message,
          isLoading: false,
        }));
        
        toast.error(`Connection failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIntegrationStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Connection test failed',
        isLoading: false,
      }));
      
      toast.error('Failed to test connection');
    }
  }, [loadRestaurants]);

  // Sync employees from Toast
  const syncEmployees = useCallback(async (restaurantGuid?: string | Event) => {
    // Handle case where this is called from an event handler
    let targetRestaurant: string;
    if (typeof restaurantGuid === 'string') {
      targetRestaurant = restaurantGuid;
    } else {
      targetRestaurant = selectedRestaurant;
    }
    
    if (!targetRestaurant) {
      toast.error('Please select a restaurant first');
      return;
    }

    console.log('Syncing employees for restaurant:', targetRestaurant);
    setSyncStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/toast/employees?restaurantGuid=${encodeURIComponent(targetRestaurant)}&syncFromToast=true`);
      const data = await response.json();
      
      if (data.success) {
        const syncResults = data.syncResults || data.data || {};
        
        console.log('Sync response data:', data);
        console.log('Sync results:', syncResults);
        
        setSyncStatus({
          lastSync: new Date().toLocaleString(),
          employeesImported: (syncResults.created || 0) + (syncResults.updated || 0) + (syncResults.overridden || 0),
          newEmployees: syncResults.created || 0,
          updatedProfiles: (syncResults.updated || 0) + (syncResults.overridden || 0),
          errors: syncResults.errors || 0,
          isLoading: false,
        });

        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toLocaleString(),
          employeesImported: prev.employeesImported + (syncResults.created || 0),
        }));

        // Reload employees
        await loadEmployees(targetRestaurant);
        
        const created = syncResults.created || 0;
        const updated = syncResults.updated || 0;
        const overridden = syncResults.overridden || 0;
        
        toast.success(`Sync completed! ${created} created, ${updated + overridden} updated`);
      } else {
        setSyncStatus(prev => ({ ...prev, isLoading: false }));
        toast.error('Employee sync failed');
      }
    } catch (error) {
      console.error('Employee sync failed:', error);
      setSyncStatus(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to sync employees');
    }
  }, [selectedRestaurant, loadEmployees]);

  // Delete employee locally (hide but keep for Toast sync)
  const deleteEmployeeLocally = useCallback(async (employeeId: string) => {
    try {
      const response = await fetch(`/api/toast/employees/${employeeId}/delete`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Employee ${data.employee.name} hidden successfully`);
        // Immediately reload employees to update the list
        if (selectedRestaurant) {
          console.log('Reloading employees after hiding employee:', selectedRestaurant);
          await loadEmployees(selectedRestaurant);
        }
      } else {
        toast.error(`Failed to hide employee: ${data.error}`);
      }
    } catch (error) {
      console.error('Error hiding employee:', error);
      toast.error('Failed to hide employee');
    }
  }, [selectedRestaurant, loadEmployees]);

  // Perform full sync (employees and orders)
  const performFullSync = useCallback(async (restaurantGuid?: string | Event) => {
    // Handle case where this is called from an event handler
    let targetRestaurant: string;
    if (typeof restaurantGuid === 'string') {
      targetRestaurant = restaurantGuid;
    } else {
      targetRestaurant = selectedRestaurant;
    }
    
    if (!targetRestaurant) {
      console.error('Please select a restaurant first');
      return;
    }

    setIntegrationStatus(prev => ({ ...prev, isLoading: true }));
    setSyncStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/toast/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantGuid: targetRestaurant,
          syncType: 'all',
          force: false,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { syncResults } = data;
        
        setSyncStatus({
          lastSync: new Date().toLocaleString(),
          employeesImported: syncResults.employees.created + syncResults.employees.updated,
          newEmployees: syncResults.employees.created,
          updatedProfiles: syncResults.employees.updated,
          errors: syncResults.employees.errors + syncResults.orders.errors,
          isLoading: false,
        });

        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toLocaleString(),
          employeesImported: prev.employeesImported + syncResults.employees.created,
          isLoading: false,
        }));

        // Reload data
        await loadEmployees(targetRestaurant);
        
        toast.success('Full sync completed successfully!');
      } else {
        setIntegrationStatus(prev => ({ ...prev, isLoading: false }));
        setSyncStatus(prev => ({ ...prev, isLoading: false }));
        toast.error('Full sync failed');
      }
    } catch (error) {
      console.error('Full sync failed:', error);
      setIntegrationStatus(prev => ({ ...prev, isLoading: false }));
      setSyncStatus(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to perform full sync');
    }
  }, [selectedRestaurant, loadEmployees]);

  // Get sync status
  const getSyncStatus = useCallback(async (restaurantGuid?: string | Event) => {
    // Handle case where this is called from an event handler
    let targetRestaurant: string;
    if (typeof restaurantGuid === 'string') {
      targetRestaurant = restaurantGuid;
    } else {
      targetRestaurant = selectedRestaurant;
    }
    
    if (!targetRestaurant) return;

    try {
      const response = await fetch(`/api/toast/sync?restaurantGuid=${targetRestaurant}`);
      const data = await response.json();
      
      if (data.success && data.syncResults) {
        const employeeResults = data.syncResults.employees;
        
        if (employeeResults) {
          setSyncStatus(prev => ({
            ...prev,
            employeesImported: (employeeResults.processed || 0) - (employeeResults.errors || 0),
            lastSync: new Date().toLocaleString(),
          }));
        }
      }
    } catch (error) {
      console.error('Error getting sync status:', error);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  // Load employees automatically if we have a persisted restaurant selection
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedRestaurant && integrationStatus.status === 'connected') {
      console.log('Auto-loading employees for persisted restaurant:', selectedRestaurant);
      loadEmployees(selectedRestaurant);
    }
  }, [integrationStatus.status, loadEmployees, selectedRestaurant]);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && selectedRestaurant) {
      loadEmployees(selectedRestaurant);
      getSyncStatus(selectedRestaurant);
    }
  }, [selectedRestaurant, getSyncStatus, loadEmployees]);

  // Auto-sync every 30 minutes on client when connected and a restaurant is selected
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedRestaurant) return;
    if (integrationStatus.status !== 'connected') return;

    const interval = setInterval(() => {
      // Lightweight employee sync route that updates from Toast
      syncEmployees(selectedRestaurant);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [integrationStatus.status, selectedRestaurant, syncEmployees]);

  // Enhanced setSelectedRestaurant to persist to localStorage
  const setSelectedRestaurantWithPersistence = (restaurantGuid: string) => {
    setSelectedRestaurant(restaurantGuid);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SHOP_SELECTION_KEY, restaurantGuid);
      localStorage.setItem(LEGACY_SELECTION_KEY, restaurantGuid);
    }
  };

  return {
    integrationStatus,
    syncStatus,
    employees,
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant: setSelectedRestaurantWithPersistence,
    testConnection,
    syncEmployees,
    loadEmployees,
    deleteEmployeeLocally,
    performFullSync,
    checkAuthStatus,
    isAuthenticated: integrationStatus.status === 'connected',
    isLoading: integrationStatus.isLoading,
  };
}
