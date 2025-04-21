// src/lib/axios.ts

import axios from 'axios';
import { getTokens, removeTokens, setTokens } from './tokenStorage'; // Import all three
import Cookies from '@react-native-cookies/cookies';
import Config from 'react-native-config';

// Base URL hard-coded (or use Config.API_BASE_URL)
export const BASE_URL = "https://e-health-backend.onrender.com/api/v1";

// Helper function to extract domain from URL (simplified for getting cookies/clearing)
const getDomainFromUrl = (url: string): string => {
  try {
    if (!url) return '';
    // Remove protocol (http://, https://)
    let domainWithPortAndPath = url.replace(/^(https?:\/\/)/, '');
    // Find the first slash (/) or the end of the string
    const slashIndex = domainWithPortAndPath.indexOf('/');
    // If a slash exists, take the substring before it, otherwise take the whole string
    let domain = slashIndex > -1 ? domainWithPortAndPath.substring(0, slashIndex) : domainWithPortAndPath;

    // Find the first colon (:) for port and take the part before it
    const colonIndex = domain.indexOf(':');
     if (colonIndex > -1) {
         domain = domain.substring(0, colonIndex);
     }

    return domain;
  } catch (e) {
    console.error('Failed to extract domain:', e);
    return '';
  }
};


// Create the main Axios instance
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Needed for cookie handling
  timeout: 10000,
});

// Cross-platform function to clear cookies using expired date (needed for Android reliability)
export const clearCookies = async () => { // <-- No domain parameter here anymore
    console.log(`Attempting to clear cookies for BASE_URL domain: ${getDomainFromUrl(BASE_URL)}`);
    try {
      const now = new Date();
      const yesterday = new Date(now.setDate(now.getDate() - 1));
      const expiresString = yesterday.toUTCString();
  
      await Cookies.set(BASE_URL, { // <-- Still using BASE_URL here
        name: 'accessToken',
        value: '',
        path: '/',
        domain: getDomainFromUrl(BASE_URL), // <-- Still using getDomainFromUrl(BASE_URL) here
        expires: expiresString
      });
       console.log('Attempted to set expired accessToken cookie.');
  
      await Cookies.set(BASE_URL, { // <-- Still using BASE_URL here
        name: 'refreshToken',
        value: '',
        path: '/api/v1/auth/refresh', // Use correct path
        domain: getDomainFromUrl(BASE_URL), // <-- Still using getDomainFromUrl(BASE_URL) here
        expires: expiresString
      });
      console.log('Attempted to set expired refreshToken cookie.');
  
    } catch (e: any) {
      console.error('Failed to clear cookies:', e?.message || e);
    }
  };


// Request Interceptor: Attempt to set Access Token Cookie using Cookies.set
API.interceptors.request.use(
  async (config) => {
    try {
      // Get the accessToken from secure storage
      const tokens = await getTokens();
      const accessToken = tokens?.accessToken;

      if (accessToken) {
        // --- Attempt to set the cookie using Cookies.set with BASE_URL ---
        // Pass the full BASE_URL as the first argument
        try {
          await Cookies.set(BASE_URL, { // <-- Using BASE_URL as first arg
            name: 'accessToken',
            value: accessToken,
            path: '/', // Path should match the path the backend sets the cookie for (usually '/')
            domain: getDomainFromUrl(BASE_URL), // Domain should match the backend cookie domain
             // secure: true, // Set to true if using HTTPS
             // httpOnly: true, // Often tokens are httpOnly - might not need to set client-side
          });
          console.log(`Attempted to set accessToken cookie via Cookies.set for BASE_URL: ${BASE_URL}`);
        } catch (cookieError: any) {
          console.error('Error setting cookie in request interceptor:', cookieError?.message || cookieError);
          // DO NOT add Authorization header fallback - it won't work.
          // Allow the request to proceed. If the native layer automatically sends the cookie
          // (because it was set by the login response's set-cookie header), the request will succeed.
          // If not, it will fail with 401 and the response interceptor will handle it.
        }
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      // Propagate the error
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);


// Response Interceptor: Handle Responses and Token Refresh
API.interceptors.response.use(
  (response) => {
    console.log('Axios Response Received:', response.status, response.config.url);
    // Native layer should handle set-cookie headers from this response (login, refresh).
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // Check for 401 Unauthorized errors (expired token) and if we haven't retried yet
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) { // Prevent infinite refresh loop
      originalRequest._retry = true; // Mark as retried

      try {
        // 1. Get the refreshToken from secure storage (Keychain)
        const tokens = await getTokens();
        const refreshToken = tokens?.refreshToken; // Use optional chaining

        if (refreshToken) {
          console.log('Attempting token refresh...');

          // --- Attempt to set the refreshToken cookie before the refresh call ---
          // Use BASE_URL as the first argument for Cookies.set
          // The refresh endpoint itself might need the refreshToken cookie sent.
          try {
             await Cookies.set(BASE_URL, { // <-- Using BASE_URL as first arg
               name: 'refreshToken',
               value: refreshToken,
               path: '/api/v1/auth/refresh', // Use the correct path for refresh cookie
               domain: getDomainFromUrl(BASE_URL), // Domain
                // secure: true, httpOnly: true etc. if needed
             });
              console.log(`Attempted to set refreshToken cookie via Cookies.set for refresh call.`);
          } catch (e: any) {
               console.error('Error setting refresh token cookie before refresh:', e?.message || e);
               // If setting refresh cookie fails, the refresh call might not be authenticated.
               // Proceed anyway, the refresh call failing will trigger the catch block.
          }


          // 2. Call the refresh endpoint
          //    This call will use BASE_URL + '/auth/refresh'.
          //    It relies on the native layer sending the refreshToken cookie (hopefully set above or previously).
          const refreshResponse = await API.get('/auth/refresh'); // Call your refresh endpoint


          // 3. After successful refresh, READ the new cookies set by the refresh response
          const domain = getDomainFromUrl(BASE_URL);
          let newAccessToken: string | null = null;
          let newRefreshToken: string | null = null;

          if (domain) { // Use domain for getting cookies
               try {
                   const newCookies = await Cookies.get(domain); // Cookies.get often takes just domain
                   if (newCookies) {
                       console.log("Received new cookies after refresh:", newCookies);
                        // Safely extract new token values from the cookie object structure
                        newAccessToken = typeof newCookies.accessToken === 'object' && newCookies.accessToken !== null ? newCookies.accessToken.value : newCookies.accessToken;
                        newRefreshToken = typeof newCookies.refreshToken === 'object' && newCookies.refreshToken !== null ? newCookies.refreshToken.value : newCookies.refreshToken;
                   }
               } catch (e: any) {
                   console.error('Error getting cookies after refresh:', e?.message || e);
               }
          } else {
               console.warn('Could not determine domain for cookie getting after refresh.');
          }


          if (newAccessToken) {
              // 4. Store the new tokens in Keychain
              await setTokens(newAccessToken, newRefreshToken || undefined);
              console.log('Tokens refreshed successfully and stored.');

              // 5. Retry the original failed request
              console.log('Retrying original request after refresh...');
              // The retry should now use the new cookie that was just set natively by the refresh response.
              return API(originalRequest); // Retry the original request

          } else {
               // Refresh succeeded (200/201) but no new access token cookie found/extracted
               console.error('Refresh successful but no new access token cookie received or extracted.');
               // Treat as refresh failure
               throw new Error('Token refresh failed due to missing new access token.');
          }


        } else {
          // No refresh token available in Keychain, cannot refresh
          console.warn('No refresh token available for 401 retry.');
          // Proceed to force logout - throw error to be caught by AuthContext
           throw new Error('No refresh token available.');
        }

      } catch (refreshError: any) {
        // Refresh attempt failed (network error, 401 on refresh itself, or explicit throw above)
        console.error('Token refresh attempt failed:', refreshError.response?.status, refreshError.config?.url, refreshError.message);
        console.log('Token refresh failed, forcing logout.');

        // Clean up on refresh failure
        await removeTokens(); // Clear tokens from Keychain
        // Use the cross-platform cookie clearing approach
        const domain = getDomainFromUrl(BASE_URL);
        if (domain) {
             await clearCookies();
        } else {
             console.warn('Could not determine domain for cookie clearing after refresh failure.');
        }

        // Propagate the refresh error - this will be caught by useQuery or calling code
        return Promise.reject(refreshError);
      }
    }

    // If the error is not 401, or if it's a 401 for the refresh URL, or if retry is not needed/failed
    // Propagate the original error response
    return Promise.reject(error);
  }
);

export default API;