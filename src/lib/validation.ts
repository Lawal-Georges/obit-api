import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Le nom du projet doit contenir au moins 2 caracteres").max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  memberIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caracteres").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(taskStatusValues).optional().default("TODO"),
  priority: z.enum(taskPriorityValues).optional().default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatusValues),
});

export const taskFilterSchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  assigned_user_id: z.string().uuid().optional(),
});
