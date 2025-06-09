import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  setGuestName: (name: string) => void;
}

const STORAGE_KEY = 'promptionary_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validateUser = (user: unknown): user is User => {
  if (typeof user !== 'object' || user === null) return false;
  
  const userObj = user as Record<string, unknown>;
  
  // Check for required fields
  if (!('id' in userObj) || !('name' in userObj)) return false;
  
  // Validate types
  if (typeof userObj.id !== 'string' || typeof userObj.name !== 'string') return false;
  
  // Validate email if present
  if ('email' in userObj && typeof userObj.email !== 'string') return false;
  
  // Validate isGuest if present
  if ('isGuest' in userObj && typeof userObj.isGuest !== 'boolean') return false;
  
  return true;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on mount
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (validateUser(parsedUser)) {
          setCurrentUser(parsedUser);
        } else {
          console.warn('Invalid user data found in localStorage:', parsedUser);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = (user: User) => {
    if (!validateUser(user)) {
      console.error('Invalid user data provided to login:', user);
      return;
    }
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      // Clear all auth-related data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gameState');
      localStorage.removeItem('roomId');
    } catch (error) {
      console.error('Error clearing auth data from localStorage:', error);
    }
  };

  const setGuestName = (name: string) => {
    if (!name.trim()) {
      console.error('Guest name cannot be empty');
      return;
    }
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      name: name.trim(),
      isGuest: true,
    };
    login(guestUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!currentUser,
        currentUser,
        login,
        logout,
        setGuestName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 