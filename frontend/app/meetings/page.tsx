"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, FileText, AlertCircle, Clock } from "lucide-react";
import { api, Meeting } from "@/lib/api";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("browser");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await api.listMeetings();
      setMeetings(data);
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.createMeeting(newTitle.trim(), newPlatform);
      setNewTitle("");
      setIsModalOpen(false);
      await loadMeetings();
    } catch (err: any) {
      alert(err.message || "Could not create meeting");
    } finally {
      setCreating(false);
    }
  };

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
            Meetings
          </h1>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-0.5">
            Sessions recorded via the extension or uploaded for task extraction.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New meeting
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slateText-lightSec dark:text-slateText-darkSec" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings by title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="border border-border-light dark:border-border-dark rounded overflow-hidden bg-white dark:bg-[#171D25]">
        {loading ? (
          <div className="p-8 text-center text-xs text-slateText-lightSec dark:text-slateText-darkSec">
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs font-medium text-slateText-light dark:text-slateText-dark">
              No meetings found
            </p>
            <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
              Start capture from the Chrome extension or create a meeting session manually.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr className="bg-surface-light dark:bg-[#0F1419]">
                <th>Title</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Tasks</th>
                <th>Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="hover:bg-surface-light dark:hover:bg-[#1E2530] transition-colors"
                >
                  <td className="font-medium text-slateText-light dark:text-slateText-dark">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="hover:text-accent flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slateText-lightSec dark:text-slateText-darkSec" />
                      {meeting.title}
                    </Link>
                  </td>
                  <td className="text-slateText-lightSec dark:text-slateText-darkSec capitalize text-xs">
                    {meeting.platform}
                  </td>
                  <td>
                    <span className="inline-block px-2 py-0.5 text-xs rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-gray-800 text-slateText-light dark:text-slateText-dark font-mono text-[11px]">
                      {meeting.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slateText-light dark:text-slateText-dark font-medium">
                        {meeting.task_count || 0}
                      </span>
                      {(meeting.needs_review_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3" />
                          {meeting.needs_review_count} need review
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-xs text-slateText-lightSec dark:text-slateText-darkSec font-mono">
                    {new Date(meeting.meeting_date || meeting.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#171D25] border border-border-light dark:border-border-dark rounded p-6 w-full max-w-md shadow-sm">
            <h2 className="text-base font-semibold text-slateText-light dark:text-slateText-dark mb-4">
              Create meeting session
            </h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. Weekly architecture review"
                  className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
                  Platform
                </label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
                >
                  <option value="browser">Browser / Tab capture</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-border-light dark:border-border-dark text-slateText-light dark:text-slateText-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
