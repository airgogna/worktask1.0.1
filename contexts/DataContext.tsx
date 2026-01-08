import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project, Task, TimeLog, VacationRequest } from '@/types';

const STORAGE_KEYS = {
  PROJECTS: '@timetrack_projects',
  TASKS: '@timetrack_tasks',
  TIME_LOGS: '@timetrack_time_logs',
  VACATION_REQUESTS: '@timetrack_vacation_requests',
};

const defaultProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Mobile App Development',
    description: 'Build time tracking mobile application',
    estimatedHours: 320,
    estimatedManpower: 4,
    color: '#3b82f6',
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-1',
  },
  {
    id: 'proj-2',
    name: 'Website Redesign',
    description: 'Corporate website redesign project',
    estimatedHours: 160,
    estimatedManpower: 2,
    color: '#8b5cf6',
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-1',
  },
];

export const [DataProvider, useData] = createContextHook(() => {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!stored) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(defaultProjects));
        return defaultProjects;
      }
      return JSON.parse(stored);
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const timeLogsQuery = useQuery({
    queryKey: ['timeLogs'],
    queryFn: async (): Promise<TimeLog[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TIME_LOGS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const vacationRequestsQuery = useQuery({
    queryKey: ['vacationRequests'],
    queryFn: async (): Promise<VacationRequest[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VACATION_REQUESTS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
      const projects = projectsQuery.data || [];
      const newProject: Project = {
        ...projectData,
        id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...projects, newProject];
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const projects = projectsQuery.data || [];
      const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated.find(p => p.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { userId: string; projectId: string; taskId?: string; notes?: string }) => {
      const timeLogs = timeLogsQuery.data || [];
      const newLog: TimeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        clockIn: new Date().toISOString(),
        notes: data.notes,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const updated = [...timeLogs, newLog];
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(updated));
      return newLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async ({ logId }: { logId: string }) => {
      const timeLogs = timeLogsQuery.data || [];
      const updated = timeLogs.map(log => 
        log.id === logId 
          ? { ...log, clockOut: new Date().toISOString(), status: 'completed' as const }
          : log
      );
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(updated));
      return updated.find(log => log.id === logId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
    },
  });

  const createVacationRequestMutation = useMutation({
    mutationFn: async (data: Omit<VacationRequest, 'id' | 'createdAt' | 'status'>) => {
      const requests = vacationRequestsQuery.data || [];
      const newRequest: VacationRequest = {
        ...data,
        id: `vac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      const updated = [...requests, newRequest];
      await AsyncStorage.setItem(STORAGE_KEYS.VACATION_REQUESTS, JSON.stringify(updated));
      return newRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] });
    },
  });

  const updateVacationRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VacationRequest> }) => {
      const requests = vacationRequestsQuery.data || [];
      const updated = requests.map(r => r.id === id ? { ...r, ...updates } : r);
      await AsyncStorage.setItem(STORAGE_KEYS.VACATION_REQUESTS, JSON.stringify(updated));
      return updated.find(r => r.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] });
    },
  });

  return {
    projects: projectsQuery.data || [],
    tasks: tasksQuery.data || [],
    timeLogs: timeLogsQuery.data || [],
    vacationRequests: vacationRequestsQuery.data || [],
    isLoading: projectsQuery.isLoading || timeLogsQuery.isLoading,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    createVacationRequest: createVacationRequestMutation.mutate,
    updateVacationRequest: updateVacationRequestMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
});
