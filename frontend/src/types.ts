export type Role = "dispatcher" | "master";
export type Status = "new" | "assigned" | "in_progress" | "done" | "canceled";
export type Priority = "low" | "normal" | "high" | "urgent";

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export interface MasterInfo {
  id: number;
  name: string;
}

export interface RepairRequest {
  id: number;
  clientName: string;
  phone: string;
  address: string;
  problemText: string;
  status: Status;
  priority: Priority;
  assignedTo: number | null;
  assignedMaster: MasterInfo | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  requestId: number;
  userId: number;
  action: string;
  oldStatus: Status | null;
  newStatus: Status | null;
  details: string | null;
  createdAt: string;
  user: { id: number; name: string; role: Role };
}

export interface Comment {
  id: number;
  requestId: number;
  userId: number;
  text: string;
  createdAt: string;
  user: { id: number; name: string; role: Role };
}

export interface RequestDetail extends RepairRequest {
  auditLogs: AuditLog[];
  comments: Comment[];
}

export interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}
