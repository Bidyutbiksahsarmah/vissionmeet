"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, User, LogOut } from "lucide-react";
import { api, User as UserType } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check dark mode
    if (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    // Check auth
    const savedUser = localStorage.getItem("vm_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    router.push("/login");
  };

  const navItems = [
    { href: "/meetings", label: "Meetings" },
    { href: "/tasks/assigned-to-me", label: "Assigned to me" },
    { href: "/tasks/assigned-by-me", label: "Assigned by me" },
    { href: "/insights", label: "Insights", experimental: true },
    { href: "/settings", label: "Settings" },
  ];

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/meetings" className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border-2 border-primary dark:border-blue-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary dark:bg-blue-400 rounded-full"></div>
            </div>
            <span className="font-semibold text-base tracking-tight text-primary dark:text-slateText-dark">
              VisionMeet
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-surface-light dark:bg-gray-800 text-primary dark:text-white"
                      : "text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.experimental && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">
                      Experimental
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User and Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-slateText-lightSec dark:text-slateText-darkSec hover:text-slateText-light dark:hover:text-white rounded hover:bg-surface-light dark:hover:bg-gray-800"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-surface-light dark:bg-gray-800 border border-border-light dark:border-border-dark flex items-center justify-center text-xs font-medium text-slateText-light dark:text-slateText-dark">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-slateText-light dark:text-slateText-dark font-medium hidden sm:inline">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-slateText-lightSec dark:text-slateText-darkSec hover:text-red-600 dark:hover:text-red-400 p-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium px-3 py-1.5 bg-primary text-white hover:bg-primary-hover rounded"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
