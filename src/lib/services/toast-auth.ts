import { z } from 'zod';
import ToastErrorHandler from './toast-error-handler';
import { isDemoMode } from '@/lib/config/demo';

// Global cache for the auth service instance
let authServiceInstance: ToastAuthService | null = null;

// Toast API authentication service
export class ToastAuthService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;

  private readonly clientId = process.env.TOAST_CLIENT_ID!;
  private readonly clientSecret = process.env.TOAST_CLIENT_SECRET!;
  private readonly apiHostname = process.env.TOAST_API_HOSTNAME!;
  private readonly userAccessType = process.env.TOAST_USER_ACCESS_TYPE!;

  private static instance: ToastAuthService;

  public static getInstance(): ToastAuthService {
    if (typeof window !== 'undefined') {
      throw new Error('ToastAuthService should not be instantiated on the client-side.');
    }
    if (!ToastAuthService.instance) {
      ToastAuthService.instance = new ToastAuthService();
    }
    return ToastAuthService.instance;
  }

  private constructor() {
    if (!this.clientId || !this.clientSecret || !this.apiHostname) {
      throw new Error('Toast API credentials not configured. Check environment variables.');
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  public async getAccessToken(): Promise<string> {
    if (isDemoMode()) {
      return 'demo-token';
    }
    // Check if current token is still valid (with 5-minute buffer)
    if (this.accessToken && this.tokenExpiry) {
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (now.getTime() < (this.tokenExpiry.getTime() - bufferTime)) {
        return this.accessToken;
      }
    }

    // Token is expired or doesn't exist, get a new one
    // Note: Toast API might not provide refresh tokens for machine clients
    if (this.refreshToken) {
      try {
        return await this.refreshAccessToken();
      } catch {
        // If refresh fails, fall back to re-authentication
        console.log('Refresh failed, re-authenticating...');
        return await this.authenticate();
      }
    } else {
      return await this.authenticate();
    }
  }

  /**
   * Initial authentication to get access token
   */
  private async authenticate(): Promise<string> {
    if (isDemoMode()) return 'demo-token';
    const authUrl = `${this.apiHostname}/authentication/v1/authentication/login`;
    
    const payload = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      userAccessType: this.userAccessType
    };

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Toast authentication failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Toast API Response:', JSON.stringify(data, null, 2));
      }

      // Validate response structure - refreshToken might be optional for machine clients
      const authSchema = z.object({
        token: z.object({
          accessToken: z.string(),
          refreshToken: z.string().optional().nullable(),
          tokenType: z.string(),
          expiresIn: z.number(),
        }).optional(),
        // Handle case where token might be directly in response
        accessToken: z.string().optional(),
        refreshToken: z.string().optional().nullable(),
        tokenType: z.string().optional(),
        expiresIn: z.number().optional(),
      }).transform((data) => {
        // Normalize response format
        if (data.token) {
          return data;
        } else {
          return {
            token: {
              accessToken: data.accessToken!,
              refreshToken: data.refreshToken,
              tokenType: data.tokenType!,
              expiresIn: data.expiresIn!,
            }
          };
        }
      });

      const validatedData = authSchema.parse(data);
      
      if (validatedData.token) {
        this.accessToken = validatedData.token.accessToken;
        this.refreshToken = validatedData.token.refreshToken || null;
        
        // Calculate expiry time
        this.tokenExpiry = new Date();
        this.tokenExpiry.setSeconds(this.tokenExpiry.getSeconds() + validatedData.token.expiresIn);

        console.log('Toast authentication successful');
        return this.accessToken;
      }
      throw new Error("Invalid auth response from Toast");
    } catch (error) {
      const errorHandler = ToastErrorHandler.getInstance();
      const toastError = errorHandler.handleError(error, authUrl, false); // Don't show toast on server
      throw new Error(toastError.message);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (isDemoMode()) return 'demo-token';
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshUrl = `${this.apiHostname}/authentication/v1/authentication/refresh`;
    
    const payload = {
      refreshToken: this.refreshToken,
    };

    try {
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // If refresh fails, clear tokens and re-authenticate
        this.clearTokens();
        return await this.authenticate();
      }

      const data = await response.json();
      
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Toast Refresh Response:', JSON.stringify(data, null, 2));
      }

      const refreshSchema = z.object({
        token: z.object({
          accessToken: z.string(),
          refreshToken: z.string().optional().nullable(),
          tokenType: z.string(),
          expiresIn: z.number(),
        }).optional(),
        // Handle case where token might be directly in response
        accessToken: z.string().optional(),
        refreshToken: z.string().optional().nullable(),
        tokenType: z.string().optional(),
        expiresIn: z.number().optional(),
      }).transform((data) => {
        // Normalize response format
        if (data.token) {
          return data;
        } else {
          return {
            token: {
              accessToken: data.accessToken!,
              refreshToken: data.refreshToken,
              tokenType: data.tokenType!,
              expiresIn: data.expiresIn!,
            }
          };
        }
      });

      const validatedData = refreshSchema.parse(data);
      
      if (validatedData.token) {
        this.accessToken = validatedData.token.accessToken;
        this.refreshToken = validatedData.token.refreshToken || null;
        
        // Calculate expiry time
        this.tokenExpiry = new Date();
        this.tokenExpiry.setSeconds(this.tokenExpiry.getSeconds() + validatedData.token.expiresIn);

        console.log('Toast token refreshed successfully');
        return this.accessToken;
      }
      throw new Error("Invalid refresh response from Toast");
    } catch (error) {
      const errorHandler = ToastErrorHandler.getInstance();
      errorHandler.handleError(error, refreshUrl, false); // Don't show toast for refresh errors
      // Clear tokens and re-authenticate
      this.clearTokens();
      return await this.authenticate();
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if currently authenticated
   */
  public isAuthenticated(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    
    const now = new Date();
    return now.getTime() < this.tokenExpiry.getTime();
  }

  /**
   * Get authentication headers for API requests
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    console.log('Using access token for API request:', token ? `${token.substring(0, 20)}...` : 'No token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Logout and clear tokens
   */
  public logout(): void {
    this.clearTokens();
  }
}

export default ToastAuthService;