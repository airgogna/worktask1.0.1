export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  estimatedHours: number;
  estimatedManpower: number;
  color: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  active: boolean;
}

export interface TimeLog {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  clockIn: string;
  clockOut?: string;
  notes?: string;
  status: 'active' | 'completed' | 'pending_approval';
  editRequested?: boolean;
  editReason?: string;
  createdAt: string;
}

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  timestamp: string;
}
