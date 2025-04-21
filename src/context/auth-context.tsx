import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import API, { BASE_URL, clearCookies } from '../lib/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTokens, removeTokens, setTokens } from '../lib/tokenStorage';
import Cookies from '@react-native-cookies/cookies';
import { logoutMutationFn } from '../api/api';

type UserType = {
  id:string;
  sessionid: string;
  student_id?: string;
  userId: string;
  name: string;
  gender: string;
  email: string;
  department_id?: string;
  std_year?: string;
  userType: string;
  blood_type?: string;
  contact_number: string;
  sessionId?: string;
  createdAt: string;
  expiredAt: string;
  is_available: boolean;
  isOnLeave: boolean;
  HA_Contact_Number: string;
  is_onLeave:boolean;
  start_date: Date;
  end_date: Date


};

interface AuthContextType {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const queryClient = useQueryClient();

  // Use useCallback for logout to prevent recreation on each render
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Optional: Call backend logout API
      
      await logoutMutationFn();
    } catch (err) {
      console.error('Backend logout failed (may be expected if token is already invalid):', err);
    } finally {
      await removeTokens();
      try {  
        await clearCookies();; // Pass full URL like "https://e-health-backend.onrender.com"
      } catch (e) {
        console.error('Failed to clear cookies during logout:', e);
      }
     
      setUser(null);
      queryClient.removeQueries();
      delete API.defaults.headers.common['Authorization'];
      setIsLoading(false);
      setInitialLoadComplete(false);
    }
  }, [queryClient]); // Only depend on queryClient

  // Query is now enabled based on initialLoadComplete, not on user state
  const {
    data: userData,
    isLoading: isUserQueryLoading,
    isError: isUserQueryErrorState,
    error: userQueryErrorObject,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await API.get('/session/');
      return response.data.user;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: initialLoadComplete, // Enable based on initialLoadComplete flag
    retry: false,
  });

  // Initial load effect - runs only once
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const { accessToken } = await getTokens();
        // Don't set placeholder user here
        setUser(accessToken ? null : null); // Reset to null
      } catch (err) {
        setUser(null);
      } finally {
        setInitialLoadComplete(true);
        setIsLoading(false); // Always stop initial loading
      }
    };
    loadUserFromStorage();
  }, []);

  // Effect to handle userData changes
  useEffect(() => {
    if (!isUserQueryLoading && userData !== undefined) {
      const sessionUser = userData?.user || userData;
      if (sessionUser) {
        setUser(sessionUser); // Update user with actual data
      } else {
        console.warn("User session endpoint returned no user data. Logging out.");
        logout();
      }
      setIsLoading(false);
      setError(null);
    }
  }, [userData, isUserQueryLoading, logout]);

  // Separate effect to handle query errors
  useEffect(() => {
    if (!isUserQueryLoading) {
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [userData, isUserQueryLoading]);

  // const login = async (credentials: any) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     console.log("Login credentials:", credentials);
  //     const response = await API.post('/auth/login', credentials);
  //     console.log("Login response:", response);
      
  //     if(response.status == 200) {
  //       console.log("Login successful:", response.data);
  //     }

  //     const apiDomain = API.defaults.baseURL ? API.defaults.baseURL.replace(/^(https?:\/\/)/, '').split('/')[0].split(':')[0] : '';
  //     let accessToken: string | null = null;
  //     let refreshToken: string | null = null;

  //     if (apiDomain) {
  //       const cookies = await Cookies.get(apiDomain);
  //       if (cookies) {
  //         console.log("Received cookies structure:", cookies);
  //         accessToken = typeof cookies.accessToken === 'object' && cookies.accessToken !== null ? cookies.accessToken.value : cookies.accessToken;
  //         refreshToken = typeof cookies.refreshToken === 'object' && cookies.refreshToken !== null ? cookies.refreshToken.value : cookies.refreshToken;
  //       }
  //     } else {
  //       console.warn("API baseURL is not set, cannot get cookies by domain.");
  //     }

  //     if (accessToken) {
  //       await setTokens(accessToken, refreshToken || undefined);
  //       setUser(response.data?.user || {} as UserType);
  //       queryClient.invalidateQueries({ queryKey: ['authUser'] });
  //     } else {
  //       throw new Error("Login successful but no access token cookie received or extracted correctly.");
  //     }
  //   } catch (err: any) {
  //     console.error('Login failed caught in AuthContext:');
  //     console.log('Error object:', err);
  //     console.log('Error message:', err.message);
  //     console.log('Error response:', err.response);
  //     console.log('Error config:', err.config);
  //     await removeTokens();
  //     setUser(null);
  //     setError(err.message || err.response?.data?.message || 'Login failed');
  //     setIsLoading(false);
  //     throw err;
  //   }
  // };

  // Compute final loading state
  // const login = async (credentials: any) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     console.log("Login credentials:", credentials);
  //     const response = await API.post('/auth/login', credentials);


  //     if(response.status == 200) {

  //       // --- Add this block to Check for MFA requirement ---
  //       if (response.data?.mfaRequired) {
  //           console.log("MFA is required for this user.");
  //           // DO NOT set user state, tokens, or invalidate query yet.
  //           setIsLoading(false); // Login attempt finished, loading is false
  //           // Throw an Error with a specific message that LoginScreen will check for
  //           const mfaError = new Error('MFA_REQUIRED'); // Use a distinct message
  //           (mfaError as any).email = credentials.email; // Optionally attach email
  //           throw mfaError; // Throw the custom error
  //       }
  //       // --- End MFA Check ---


  //       // --- This block runs ONLY if MFA is NOT required ---
  //       console.log("MFA is NOT required, proceeding with standard login.");
  //       // ... (rest of your standard login success logic:
  //       // read cookies, setTokens, setUser, queryClient.invalidateQueries) ...
  //       const cookies = await Cookies.get(BASE_URL); // Use get(BASE_URL, [names]) here too for consistency if you prefer
  //        console.log(`Cookies returned by Cookies.get(${BASE_URL}, ['accessToken', 'refreshToken']) after standard login:`, cookies);
  //       // ... extraction and setTokens ...
  //        let accessToken: string | null = null;
  //        let refreshToken: string | null = null;
  //        if (cookies) { /* ... extraction logic here ... */ } // ** Ensure extraction logic here is correct **

  //       if (accessToken) {
  //           await setTokens(accessToken, refreshToken || undefined);
  //           setUser(response.data?.user || {} as UserType); // Assuming user data is here
  //           queryClient.invalidateQueries({ queryKey: ['authUser'] });
  //       } else {
  //            throw new Error("Standard login successful but no access token cookie received or extracted.");
  //       }

  //     } else {
  //        // Handle non-200 success codes if any
  //         throw new Error(`Login failed with status: ${response.status}`);
  //     }

  //   } catch (err: any) {
  //     console.error('Login failed caught in AuthContext:', err);
  //      // --- Modify catch block to check for MFA_REQUIRED signal ---
  //      if (err.message === 'MFA_REQUIRED') {
  //         console.log('Caught MFA_REQUIRED signal, re-throwing for LoginScreen.');
  //         // isLoading is already set to false before throwing the mfaError
  //         throw err; // Re-throw the specific MFA error
  //      } else {
  //        // This is a standard login failure (network error, 401, 400, etc.)
  //        console.log('Caught standard login error.');
  //        await removeTokens(); // Clear Keychain on standard login failure
  //        setUser(null);
  //        setError(err.message || err.response?.data?.message || 'Login failed');
  //        setIsLoading(false);
  //        throw err; // Re-throw the standard error
  //      }
  //   }
  // };
  const login = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/login', credentials);
  
      if (response.status === 200) {
        // Check for MFA requirement first
        if (response.data?.mfaRequired) {
          console.log("MFA required - aborting auth state update");
          const mfaError = new Error('MFA_REQUIRED');
          await clearCookies();  // Add this line
          await removeTokens(); 
          (mfaError as any).email = credentials.email;
          throw mfaError;
        }
  
        // Only proceed with auth state update if MFA not required
        const cookies = await Cookies.get(`${BASE_URL}/auth/login`);
        const cookies_1 = await Cookies.get(`${BASE_URL}/auth/refresh`);
        console.log(cookies_1)
        
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
  
        if (cookies?.accessToken?.value) {
          accessToken = cookies.accessToken.value;
          refreshToken = cookies_1.refreshToken?.value || null;
        }
  
        if (accessToken) {
          await setTokens(accessToken, refreshToken || undefined);
          queryClient.invalidateQueries({ queryKey: ['authUser'] });
          
        } else {
          throw new Error("Login successful but no access token found");
        }
      }
    } catch (err: any) {
      if (err.message === 'MFA_REQUIRED') {
        console.log('MFA required - propagating error');
        setIsLoading(false);
        throw err; // Re-throw for LoginScreen to handle
      } else {
        // Existing error handling
        await removeTokens();
        setUser(null);
        setError(err.message || 'Login failed');
        setIsLoading(false);
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };
  const finalIsLoading = isLoading || isUserQueryLoading;

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: finalIsLoading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};