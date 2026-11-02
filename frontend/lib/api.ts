const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
}

export interface Task {
  id: number;
  meeting_id: number;
  assigner_id?: number | null;
  assignee_id?: number | null;
  assigner_name?: string | null;
  assignee_name?: string | null;
  description: string;
  status: "extracted" | "confirmed" | "accepted" | "in_progress" | "blocked" | "in_review" | "done";
  evidence_quote?: string | null;
  evidence_timestamp?: string | null;
  confidence: number;
  needs_review: boolean;
  deadline?: string | null;
  created_at: string;
  assigner?: User | null;
  assignee?: User | null;
  comments?: CommentItem[];
}

export interface CommentItem {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  created_at: string;
  author?: User | null;
}

export interface Meeting {
  id: number;
  title: string;
  platform: string;
  status: string;
  meeting_date: string;
  created_at: string;
  created_by: number;
  creator?: User | null;
  audio_path?: string | null;
  transcript?: string | null;
  summary?: string | null;
  task_count?: number;
  needs_review_count?: number;
  tasks?: Task[];
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("vm_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("vm_token");
      localStorage.removeItem("vm_user");
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("vm_token", data.access_token);
    const user = await this.getCurrentUser();
    localStorage.setItem("vm_user", JSON.stringify(user));
    return { token: data.access_token, user };
  },

  async register(email: string, name: string, password: string) {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
  },

  async getCurrentUser(): Promise<User> {
    return request<User>("/me");
  },

  logout() {
    localStorage.removeItem("vm_token");
    localStorage.removeItem("vm_user");
  },

  // Meetings
  async listMeetings(): Promise<Meeting[]> {
    return request<Meeting[]>("/meetings");
  },

  async getMeeting(id: number): Promise<Meeting> {
    return request<Meeting>(`/meetings/${id}`);
  },

  async createMeeting(title: string, platform = "browser"): Promise<Meeting> {
    return request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({ title, platform }),
    });
  },

  async deleteMeeting(id: number): Promise<void> {
    return request<void>(`/meetings/${id}`, { method: "DELETE" });
  },

  async uploadAudio(meetingId: number, file: File): Promise<Meeting> {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("vm_token") : null;
    const response = await fetch(`${API_BASE}/meetings/${meetingId}/upload-audio`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Audio upload failed");
    }
    return response.json();
  },

  async processMeeting(id: number): Promise<Meeting> {
    return request<Meeting>(`/meetings/${id}/process`, { method: "POST" });
  },

  // Tasks
  async getTasksAssignedToMe(status?: string): Promise<Task[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<Task[]>(`/tasks/assigned-to-me${q}`);
  },

  async getTasksAssignedByMe(status?: string): Promise<Task[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<Task[]>(`/tasks/assigned-by-me${q}`);
  },

  async getTasksNeedingReview(meetingId?: number): Promise<Task[]> {
    const q = meetingId ? `?meeting_id=${meetingId}` : "";
    return request<Task[]>(`/tasks/needs-review${q}`);
  },

  async confirmTask(taskId: number): Promise<Task> {
    return request<Task>(`/tasks/${taskId}/confirm`, { method: "POST" });
  },

  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
    return request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async createTask(meetingId: number, task: Partial<Task>): Promise<Task> {
    return request<Task>(`/meetings/${meetingId}/tasks`, {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  // Comments
  async addComment(taskId: number, body: string): Promise<CommentItem> {
    return request<CommentItem>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },

  async listComments(taskId: number): Promise<CommentItem[]> {
    return request<CommentItem[]>(`/tasks/${taskId}/comments`);
  },

  // Users
  async listUsers(): Promise<User[]> {
    return request<User[]>("/users");
  },
};
