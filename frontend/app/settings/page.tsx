"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, Database, Bell } from "lucide-react";
import { api, User } from "@/lib/api";

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [retentionDays, setRetentionDays] = useState("90");
  const [requireConsent, setRequireConsent] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
          Workspace settings
        </h1>
        <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-0.5">
          Manage workspace members, retention policies, and recording compliance.
        </p>
      </div>

      {/* Section 1: Members */}
      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark">
            Workspace members
          </h2>
        </div>
        <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mb-4">
          Anyone in this workspace can be assigned action items from meeting notes.
        </p>

        <div className="border border-border-light dark:border-border-dark rounded overflow-hidden">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr className="bg-surface-light dark:bg-[#0F1419]">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-light dark:hover:bg-[#1E2530]">
                  <td className="font-medium text-xs text-slateText-light dark:text-slateText-dark">
                    {u.name}
                  </td>
                  <td className="text-xs font-mono text-slateText-lightSec dark:text-slateText-darkSec">
                    {u.email}
                  </td>
                  <td className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
                    Member
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Audio & Data Retention */}
      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-primary dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark">
            Audio and data retention
          </h2>
        </div>

        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
              Audio recording deletion schedule
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
            >
              <option value="30">Delete audio recordings after 30 days</option>
              <option value="60">Delete audio recordings after 60 days</option>
              <option value="90">Delete audio recordings after 90 days</option>
              <option value="never">Retain indefinitely until manual removal</option>
            </select>
            <p className="text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mt-1">
              Transcripts and extracted tasks are preserved even if raw audio is removed.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Consent and compliance */}
      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slateText-light dark:text-slateText-dark">
            Consent and compliance
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-2.5 text-xs text-slateText-light dark:text-slateText-dark cursor-pointer select-none">
            <input
              type="checkbox"
              checked={requireConsent}
              onChange={(e) => setRequireConsent(e.target.checked)}
              className="mt-0.5 rounded border-border-light text-primary focus:ring-accent"
            />
            <span>
              Enforce explicit attendee consent checkbox before the extension allows capture.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
