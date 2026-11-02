"use client";

import React, { useState } from "react";
import { Info, BarChart2 } from "lucide-react";

export default function InsightsPage() {
  const [optIn, setOptIn] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
          Meeting engagement trends
        </h1>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">
          Experimental
        </span>
      </div>
      <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mb-6">
        Aggregated participation cadence across recorded team syncs. Strictly opt-in.
      </p>

      {/* Opt-in banner */}
      <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-primary dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <h2 className="text-xs font-semibold text-slateText-light dark:text-slateText-dark">
              Privacy and engagement metrics
            </h2>
            <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec leading-relaxed">
              VisionMeet does not monitor attendee desktop activity, gaze, or screen content. Engagement data is derived solely from verbal participation distribution and shown as neutral trends on a sequential monochrome scale.
            </p>
            <label className="flex items-center gap-2 text-xs font-medium text-slateText-light dark:text-slateText-dark cursor-pointer select-none">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="rounded border-border-light text-primary focus:ring-accent"
              />
              <span>Enable experimental engagement trend analysis for this workspace</span>
            </label>
          </div>
        </div>
      </div>

      {/* Graphs / Trends container */}
      {optIn ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
            <h3 className="text-xs font-semibold text-slateText-light dark:text-slateText-dark mb-1">
              Verbal participation cadence (single-hue scale)
            </h3>
            <p className="text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-6">
              Distribution of speaking turns across meeting segments.
            </p>

            {/* Neutral blue sequential scale bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-1">
                  <span>Segment 00:00 - 00:15</span>
                  <span className="font-mono">18%</span>
                </div>
                <div className="w-full h-2 bg-surface-light dark:bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-300 dark:bg-blue-900 rounded" style={{ width: "18%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-1">
                  <span>Segment 00:15 - 00:30 (Q&A)</span>
                  <span className="font-mono">54%</span>
                </div>
                <div className="w-full h-2 bg-surface-light dark:bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 dark:bg-blue-700 rounded" style={{ width: "54%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-1">
                  <span>Segment 00:30 - 00:45 (Action items)</span>
                  <span className="font-mono">38%</span>
                </div>
                <div className="w-full h-2 bg-surface-light dark:bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-400 dark:bg-blue-800 rounded" style={{ width: "38%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#171D25] p-6">
            <h3 className="text-xs font-semibold text-slateText-light dark:text-slateText-dark mb-1">
              Action item resolution rate
            </h3>
            <p className="text-[11px] text-slateText-lightSec dark:text-slateText-darkSec mb-6">
              Percentage of extracted tasks confirmed and marked done within 7 days.
            </p>

            <div className="space-y-2">
              <div className="text-2xl font-mono font-semibold text-primary dark:text-blue-400">
                84.2%
              </div>
              <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec">
                21 out of 25 extracted tasks resolved on schedule across the last 5 sessions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border-light dark:border-border-dark rounded p-12 text-center bg-white dark:bg-[#171D25]">
          <BarChart2 className="w-6 h-6 text-slateText-lightSec dark:text-slateText-darkSec mx-auto mb-2" />
          <p className="text-xs font-medium text-slateText-light dark:text-slateText-dark">
            Engagement analysis is disabled
          </p>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
            Check the consent box above if your organization allows trend analytics.
          </p>
        </div>
      )}
    </div>
  );
}
