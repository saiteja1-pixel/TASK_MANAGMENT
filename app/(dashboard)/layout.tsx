import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#13151F] text-[var(--text-main)] transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area shifted right for sidebar on desktop */}
      <div className="md:pl-60 min-h-screen flex flex-col justify-between">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Main Content Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12 border-t border-[var(--shadow-dark)]/15 text-center">
          <p className="text-xs font-semibold text-[var(--text-main)] opacity-60">
            © {new Date().getFullYear()} TaskFlow. Built by Ramprasad. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
