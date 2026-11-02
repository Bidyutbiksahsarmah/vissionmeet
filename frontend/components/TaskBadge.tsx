"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSearch,
  Check,
  UserCheck,
  PauseCircle,
} from "lucide-react";

interface TaskBadgeProps {
  status: string;
  needsReview?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  extracted: {
    label: "Extracted",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
    icon: <FileSearch className="w-3 h-3" />,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: <Check className="w-3 h-3" />,
  },
  accepted: {
    label: "Accepted",
    bg: "bg-teal-50 dark:bg-teal-950",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    icon: <UserCheck className="w-3 h-3" />,
  },
  in_progress: {
    label: "In progress",
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: <Clock className="w-3 h-3" />,
  },
  blocked: {
    label: "Blocked",
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    icon: <PauseCircle className="w-3 h-3" />,
  },
  in_review: {
    label: "In review",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    icon: <Clock className="w-3 h-3" />,
  },
  done: {
    label: "Done",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

export function TaskBadge({ status, needsReview }: TaskBadgeProps) {
  const current = statusConfig[status] || statusConfig.extracted;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
      >
        {current.icon}
        {current.label}
      </span>

      {needsReview && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700">
          <AlertCircle className="w-3 h-3" />
          Needs review
        </span>
      )}
    </div>
  );
}
