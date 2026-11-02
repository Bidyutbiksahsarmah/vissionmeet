"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { api, Task } from "@/lib/api";
import { TaskBadge } from "@/components/TaskBadge";

export default function AssignedByMePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasksAssignedByMe();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by assignee
  const groupedTasks: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    const key = t.assignee?.name || t.assignee_name || "Unassigned";
    if (!groupedTasks[key]) groupedTasks[key] = [];
    groupedTasks[key].push(t);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
          Assigned by me
        </h1>
        <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-0.5">
          Delegated action items grouped by person, with blocker and stale warnings.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slateText-lightSec dark:text-slateText-darkSec border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25]">
          Loading delegated tasks...
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div className="p-12 text-center border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25]">
          <p className="text-xs font-medium text-slateText-light dark:text-slateText-dark">
            No delegated tasks found
          </p>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
            Tasks you delegate in meetings will be tracked here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([person, personTasks]) => {
            const blockedCount = personTasks.filter((t) => t.status === "blocked").length;
            const openCount = personTasks.filter((t) => t.status !== "done").length;

            return (
              <div
                key={person}
                className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] overflow-hidden"
              >
                {/* Person group header */}
                <div className="bg-surface-light dark:bg-[#0F1419] px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slateText-light dark:text-slateText-dark">
                      {person}
                    </span>
                    <span className="text-[11px] text-slateText-lightSec dark:text-slateText-darkSec">
                      ({openCount} open)
                    </span>
                  </div>

                  {blockedCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-3 h-3" />
                      {blockedCount} blocked
                    </span>
                  )}
                </div>

                {/* Tasks table */}
                <table className="w-full text-left border-collapse table-dense">
                  <thead>
                    <tr className="bg-white dark:bg-[#171D25]">
                      <th>Task description</th>
                      <th>Evidence quote</th>
                      <th>Status</th>
                      <th className="text-right">Meeting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="hover:bg-surface-light dark:hover:bg-[#1E2530] transition-colors"
                      >
                        <td className="font-medium text-xs text-slateText-light dark:text-slateText-dark max-w-sm">
                          {task.description}
                        </td>
                        <td className="text-xs italic text-slateText-lightSec dark:text-slateText-darkSec max-w-sm">
                          {task.evidence_quote ? `"${task.evidence_quote}"` : "None"}
                        </td>
                        <td>
                          <TaskBadge status={task.status} needsReview={task.needs_review} />
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/meetings/${task.meeting_id}`}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
