"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Play,
  RotateCw,
  Quote,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Volume2,
} from "lucide-react";
import { api, Meeting, Task, User as UserType } from "@/lib/api";
import { TaskBadge } from "@/components/TaskBadge";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = Number(params.id);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "summary" | "transcript">("tasks");
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit task modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState<number | undefined>(undefined);
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    // Check if token was passed from extension in query string
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromQuery = urlParams.get("token");
      if (tokenFromQuery) {
        localStorage.setItem("vm_token", tokenFromQuery);
        api.getCurrentUser().then((u) => {
          localStorage.setItem("vm_user", JSON.stringify(u));
        }).catch(() => {});
      }
    }

    if (meetingId) {
      loadMeeting();
      loadUsers();
    }
  }, [meetingId]);

  const loadMeeting = async () => {
    setLoading(true);
    try {
      const data = await api.getMeeting(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const userList = await api.listUsers();
      setUsers(userList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmTask = async (taskId: number) => {
    try {
      await api.confirmTask(taskId);
      await loadMeeting();
    } catch (err: any) {
      alert(err.message || "Failed to confirm task");
    }
  };

  const handleProcessMeeting = async () => {
    setProcessing(true);
    try {
      await api.processMeeting(meetingId);
      // Poll or reload
      setTimeout(() => {
        loadMeeting();
        setProcessing(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to trigger processing");
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadAudio(meetingId, file);
      await loadMeeting();
      // Auto-trigger analysis
      handleProcessMeeting();
    } catch (err: any) {
      alert(err.message || "Audio upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditDescription(task.description);
    setEditAssigneeId(task.assignee_id || undefined);
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSavingTask(true);
    try {
      await api.updateTask(editingTask.id, {
        description: editDescription,
        assignee_id: editAssigneeId || null,
      });
      setEditingTask(null);
      await loadMeeting();
    } catch (err: any) {
      alert(err.message || "Could not update task");
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-xs text-slateText-lightSec dark:text-slateText-darkSec">
        Loading meeting details...
      </div>
    );
  }

  if (!meeting) {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("vm_token");
    if (!hasToken) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-sm font-medium text-slateText-light dark:text-slateText-dark mb-1">
            Sign in required
          </p>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mb-4">
            You must be signed in to your workspace account to view this meeting and its action items.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded inline-block"
          >
            Sign in to your account
          </Link>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
          Meeting session not found.
        </p>
        <Link href="/meetings" className="text-accent text-xs hover:underline mt-2 inline-block">
          Return to meetings
        </Link>
      </div>
    );
  }

  const tasks = meeting.tasks || [];
  const needsReviewCount = tasks.filter((t) => t.needs_review || t.status === "extracted").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 text-xs text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to meetings
        </Link>
      </div>

      {/* Header bar */}
      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-gray-800 text-slateText-lightSec dark:text-slateText-darkSec uppercase">
                {meeting.platform}
              </span>
              <span className="text-[11px] font-mono text-slateText-lightSec dark:text-slateText-darkSec">
                {new Date(meeting.meeting_date || meeting.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
              {meeting.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-gray-800">
              Status: {meeting.status}
            </span>
            <button
              onClick={handleProcessMeeting}
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-light dark:border-border-dark text-xs font-medium text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} />
              Re-analyze meeting
            </button>
          </div>
        </div>

        {/* Audio section */}
        {meeting.audio_path ? (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slateText-lightSec dark:text-slateText-darkSec" />
              <span className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
                Audio recording attached:
              </span>
              <span className="font-mono text-xs text-slateText-light dark:text-slateText-dark">
                {meeting.audio_path.split(/[/\\]/).pop()}
              </span>
            </div>
            <label className="text-xs text-accent hover:underline cursor-pointer">
              Replace audio
              <input
                type="file"
                accept="audio/*,.webm,.mp3,.wav,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
              No audio uploaded yet. Record via the Chrome extension or upload a file directly:
            </span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-light dark:border-border-dark text-xs font-medium text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
              <Volume2 className="w-3.5 h-3.5 text-accent" />
              <span>{uploading ? "Uploading..." : "Upload audio file"}</span>
              <input
                type="file"
                accept="audio/*,.webm,.mp3,.wav,.m4a"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border-light dark:border-border-dark mb-6 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "tasks"
              ? "border-primary dark:border-blue-400 text-primary dark:text-white"
              : "border-transparent text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white"
          }`}
        >
          <span>Tasks & action items</span>
          <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-surface-light dark:bg-gray-800 border border-border-light dark:border-border-dark">
            {tasks.length}
          </span>
          {needsReviewCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {needsReviewCount} review
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "summary"
              ? "border-primary dark:border-blue-400 text-primary dark:text-white"
              : "border-transparent text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white"
          }`}
        >
          Summary & decisions
        </button>

        <button
          onClick={() => setActiveTab("transcript")}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "transcript"
              ? "border-primary dark:border-blue-400 text-primary dark:text-white"
              : "border-transparent text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white"
          }`}
        >
          Transcript
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="p-12 text-center border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25]">
              <p className="text-xs text-slateText-light dark:text-slateText-dark font-medium">
                No tasks extracted yet
              </p>
              <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
                Click &quot;Re-analyze meeting&quot; above to run speech transcription and task extraction.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="border border-border-light dark:border-border-dark rounded p-4 bg-white dark:bg-[#171D25] hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TaskBadge status={task.status} needsReview={task.needs_review} />
                      {task.evidence_timestamp && (
                        <span className="font-mono text-xs text-slateText-lightSec dark:text-slateText-darkSec bg-surface-light dark:bg-[#0F1419] px-2 py-0.5 rounded border border-border-light dark:border-border-dark flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          From {task.evidence_timestamp}
                        </span>
                      )}
                      <span className="text-[11px] text-slateText-lightSec dark:text-slateText-darkSec">
                        Confidence: {(task.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slateText-light dark:text-slateText-dark">
                      {task.description}
                    </p>

                    {/* Attribution */}
                    <div className="flex items-center gap-4 text-xs text-slateText-lightSec dark:text-slateText-darkSec">
                      <span>
                        Assigner:{" "}
                        <strong className="text-slateText-light dark:text-slateText-dark font-normal">
                          {task.assigner?.name || task.assigner_name || "Unassigned"}
                        </strong>
                      </span>
                      <span>
                        Assignee:{" "}
                        <strong className="text-slateText-light dark:text-slateText-dark font-normal">
                          {task.assignee?.name || task.assignee_name || "Unassigned"}
                        </strong>
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Evidence quote */}
                    {task.evidence_quote && (
                      <div className="p-2.5 rounded bg-surface-light dark:bg-[#0F1419] border border-border-light dark:border-border-dark flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-slateText-lightSec dark:text-slateText-darkSec shrink-0 mt-0.5" />
                        <p className="text-xs italic text-slateText-lightSec dark:text-slateText-darkSec">
                          &quot;{task.evidence_quote}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === "extracted" || task.needs_review ? (
                      <button
                        onClick={() => handleConfirmTask(task.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Confirm
                      </button>
                    ) : null}

                    <button
                      onClick={() => openEditModal(task)}
                      className="px-2.5 py-1 text-xs font-medium border border-border-light dark:border-border-dark text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Summary */}
      {activeTab === "summary" && (
        <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark">
            Executive summary
          </h2>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec leading-relaxed whitespace-pre-wrap">
            {meeting.summary || "No summary generated for this meeting."}
          </p>
        </div>
      )}

      {/* Tab 3: Transcript */}
      {activeTab === "transcript" && (
        <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
          <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark mb-4">
            Timestamped transcript
          </h2>
          {meeting.transcript ? (
            <pre className="font-mono text-xs text-slateText-light dark:text-slateText-dark whitespace-pre-wrap leading-relaxed">
              {meeting.transcript}
            </pre>
          ) : (
            <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
              No transcript available. Ensure audio is recorded and processed.
            </p>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#171D25] border border-border-light dark:border-border-dark rounded p-6 w-full max-w-md shadow-sm">
            <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark mb-4">
              Edit task
            </h2>
            <form onSubmit={handleSaveTaskEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
                  Task description
                </label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
                  Assignee
                </label>
                <select
                  value={editAssigneeId || ""}
                  onChange={(e) =>
                    setEditAssigneeId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs font-medium border border-border-light dark:border-border-dark text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded disabled:opacity-50"
                >
                  {savingTask ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
