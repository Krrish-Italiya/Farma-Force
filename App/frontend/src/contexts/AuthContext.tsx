"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  phone?: string;
  profileImage?: string;
  location?: string;
  kpiThresholds?: {
    callRateTarget: number;
    customerCoverage: number;
    frequencyOfVisits: number;
  };
  notifications?: {
    kpiAlerts: boolean;
    emailAlerts: boolean;
    aiRecommendation: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch complete user data from database
  const fetchUserData = async (token: string, basicUserData: User): Promise<User> => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          id: userData._id || basicUserData.id,
          name: userData.name || basicUserData.name,
          email: userData.email || basicUserData.email,
          employeeId: userData.employeeId || basicUserData.employeeId,
          phone: userData.phone || basicUserData.phone,
          profileImage: userData.profileImage || basicUserData.profileImage,
          location: userData.location || basicUserData.location,
          kpiThresholds: userData.kpiThresholds,
          notifications: userData.notifications,
        };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    
    // Return basic user data if fetch fails
    return basicUserData;
  };

  useEffect(() => {
    // Check for existing authentication on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch complete user data from database
        fetchUserData(token, parsedUser).then((completeUserData) => {
          setUser(completeUserData);
          localStorage.setItem('user', JSON.stringify(completeUserData));
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (token: string, userData: User) => {
    localStorage.setItem('token', token);
    
    // Fetch complete user data from database
    const completeUserData = await fetchUserData(token, userData);
    
    localStorage.setItem('user', JSON.stringify(completeUserData));
    setUser(completeUserData);
    
    // Redirect to dashboard after successful login
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/auth/login');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
