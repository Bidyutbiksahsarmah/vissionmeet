"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Send,
} from "lucide-react";
import { api, Task, CommentItem } from "@/lib/api";
import { TaskBadge } from "@/components/TaskBadge";

export default function AssignedToMePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentTask, setActiveCommentTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasksAssignedToMe();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task["status"]) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleMarkBlocked = async (taskId: number) => {
    const reason = prompt("Describe the blocker:");
    if (!reason || !reason.trim()) return;

    try {
      await api.updateTask(taskId, { status: "blocked" });
      await api.addComment(taskId, `Blocker: ${reason.trim()}`);
      await loadTasks();
    } catch (err: any) {
      alert(err.message || "Failed to mark task as blocked");
    }
  };

  const openComments = async (task: Task) => {
    setActiveCommentTask(task);
    try {
      const list = await api.listComments(task.id);
      setComments(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentTask || !newCommentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await api.addComment(activeCommentTask.id, newCommentBody.trim());
      setComments([...comments, created]);
      setNewCommentBody("");
    } catch (err: any) {
      alert(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
          Assigned to me
        </h1>
        <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-0.5">
          Action items and deliverables assigned to your account.
        </p>
      </div>

      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slateText-lightSec dark:text-slateText-darkSec">
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs font-medium text-slateText-light dark:text-slateText-dark">
              No tasks assigned to you
            </p>
            <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
              When meeting recordings identify action items for you, they will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr className="bg-surface-light dark:bg-[#0F1419]">
                <th>Task</th>
                <th>Assigner</th>
                <th>Evidence & timestamp</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-surface-light dark:hover:bg-[#1E2530] transition-colors"
                >
                  <td className="max-w-xs">
                    <p className="font-medium text-xs text-slateText-light dark:text-slateText-dark">
                      {task.description}
                    </p>
                    <Link
                      href={`/meetings/${task.meeting_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-1"
                    >
                      <span>View meeting</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </td>

                  <td className="text-xs text-slateText-light dark:text-slateText-dark">
                    {task.assigner?.name || task.assigner_name || "Unspecified"}
                  </td>

                  <td className="max-w-xs">
                    {task.evidence_timestamp && (
                      <span className="font-mono text-[11px] text-slateText-lightSec dark:text-slateText-darkSec block mb-1">
                        At {task.evidence_timestamp}
                      </span>
                    )}
                    {task.evidence_quote && (
                      <p className="text-[11px] italic text-slateText-lightSec dark:text-slateText-darkSec line-clamp-2">
                        &quot;{task.evidence_quote}&quot;
                      </p>
                    )}
                  </td>

                  <td>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task.id, e.target.value as Task["status"])
                      }
                      className="text-xs py-1 px-2 border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
                    >
                      <option value="extracted">Extracted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="accepted">Accepted</option>
                      <option value="in_progress">In progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="in_review">In review</option>
                      <option value="done">Done</option>
                    </select>
                  </td>

                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleMarkBlocked(task.id)}
                        className="p-1.5 text-slateText-lightSec dark:text-slateText-darkSec hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-surface-light dark:hover:bg-gray-800"
                        title="Flag blocker"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openComments(task)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border-light dark:border-border-dark text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Notes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Comments / Notes Drawer */}
      {activeCommentTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#171D25] border border-border-light dark:border-border-dark rounded p-6 w-full max-w-lg shadow-sm">
            <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark mb-1">
              Task discussion & blockers
            </h2>
            <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mb-4">
              {activeCommentTask.description}
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 border border-border-light dark:border-border-dark rounded p-3 bg-surface-light dark:bg-[#0F1419]">
              {comments.length === 0 ? (
                <p className="text-xs text-center text-slateText-lightSec dark:text-slateText-darkSec py-4">
                  No notes or blocker updates posted yet.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="text-xs border-b border-border-light dark:border-border-dark pb-2 last:border-b-0">
                    <div className="flex items-center justify-between text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-1">
                      <span>{c.author?.name || "Participant"}</span>
                      <span className="font-mono">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slateText-light dark:text-slateText-dark">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                required
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Add a blocker update or note..."
                className="flex-1 px-3 py-1.5 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                Post
              </button>
            </form>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setActiveCommentTask(null)}
                className="px-3 py-1.5 text-xs font-medium border border-border-light dark:border-border-dark text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
