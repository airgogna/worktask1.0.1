import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import type { User, AuditLog } from '@/types';

const STORAGE_KEYS = {
  USERS: '@timetrack_users',
  CURRENT_USER: '@timetrack_current_user',
  AUDIT_LOGS: '@timetrack_audit_logs',
};

const createDefaultAdmin = (): User => ({
  id: 'admin-1',
  email: 'admin@company.com',
  password: 'admin123',
  name: 'System Admin',
  role: 'admin',
  active: true,
  vacationDaysTotal: 20,
  vacationDaysUsed: 0,
  createdAt: new Date().toISOString(),
});

const createDefaultEmployee = (): User => ({
  id: 'emp-1',
  email: 'employee@company.com',
  password: 'emp123',
  name: 'John Doe',
  role: 'employee',
  active: true,
  vacationDaysTotal: 20,
  vacationDaysUsed: 5,
  createdAt: new Date().toISOString(),
});

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!stored) {
        const defaultUsers = [createDefaultAdmin(), createDefaultEmployee()];
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
        return defaultUsers;
      }
      return JSON.parse(stored);
    },
  });

  const auditLogsQuery = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async (): Promise<AuditLog[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const userId = JSON.parse(stored);
        const users = usersQuery.data || [];
        const user = users.find(u => u.id === userId);
        if (user && user.active) {
          setCurrentUser(user);
        }
      }
      setIsInitialized(true);
    };
    
    if (usersQuery.data) {
      loadCurrentUser();
    }
  }, [usersQuery.data]);

  const addAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = auditLogsQuery.data || [];
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
  };

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const users = usersQuery.data || [];
      const user = users.find(u => u.email === email && u.password === password && u.active);
      
      if (!user) {
        throw new Error('Invalid credentials or account inactive');
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user.id));
      await addAuditLog({
        userId: user.id,
        action: 'login',
        entity: 'auth',
        entityId: user.id,
      });
      
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (currentUser) {
        await addAuditLog({
          userId: currentUser.id,
          action: 'logout',
          entity: 'auth',
          entityId: currentUser.id,
        });
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },
    onSuccess: () => {
      setCurrentUser(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'createdAt'>) => {
      const users = usersQuery.data || [];
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      const updated = [...users, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      
      if (currentUser) {
        await addAuditLog({
          userId: currentUser.id,
          action: 'create_user',
          entity: 'user',
          entityId: newUser.id,
          changes: newUser,
        });
      }
      
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const users = usersQuery.data || [];
      const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      
      if (currentUser) {
        await addAuditLog({
          userId: currentUser.id,
          action: 'update_user',
          entity: 'user',
          entityId: userId,
          changes: updates,
        });
      }
      
      return updated.find(u => u.id === userId);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (currentUser && updatedUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    },
  });

  return {
    currentUser,
    isInitialized,
    users: usersQuery.data || [],
    auditLogs: auditLogsQuery.data || [],
    isLoading: usersQuery.isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    isAdmin: currentUser?.role === 'admin',
    isEmployee: currentUser?.role === 'employee',
  };
});
