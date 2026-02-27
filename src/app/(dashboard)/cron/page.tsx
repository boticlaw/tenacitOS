"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, AlertCircle, LayoutGrid, CalendarDays, Zap, Plus } from "lucide-react";
import { CronJobCard, type CronJob } from "@/components/CronJobCard";
import { CronWeeklyTimeline } from "@/components/CronWeeklyTimeline";
import { CronJobModal } from "@/components/CronJobModal";

type ViewMode = "cards" | "timeline";

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [runToast, setRunToast] = useState<{ id: string; status: "success" | "error"; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [saveToast, setSaveToast] = useState<{ status: "success" | "error"; message: string } | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/cron");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/cron", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update job");
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? { ...job, enabled } : job))
      );
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update job status");
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      const res = await fetch(`/api/cron?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs((prev) => prev.filter((job) => job.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete job");
    }
  };

  const handleRun = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    const res = await fetch("/api/cron/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setRunToast({ id, status: "error", name: job?.name || id });
      setTimeout(() => setRunToast(null), 4000);
      throw new Error(data.error || "Trigger failed");
    }

    setRunToast({ id, status: "success", name: job?.name || id });
    setTimeout(() => setRunToast(null), 4000);
  };

  const handleEdit = (job: CronJob) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleSave = async (jobData: Partial<CronJob>) => {
    try {
      const isEditing = !!editingJob?.id;
      const url = "/api/cron";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: jobData.name,
        schedule: typeof jobData.schedule === "string" ? jobData.schedule : undefined,
        timezone: jobData.timezone || "UTC",
        message: jobData.description,
      };

      if (isEditing) {
        body.id = editingJob.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save job");
      }

      setSaveToast({
        status: "success",
        message: isEditing ? `Job "${jobData.name}" updated!` : `Job "${jobData.name}" created!`,
      });
      setTimeout(() => setSaveToast(null), 4000);

      setIsModalOpen(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save job";
      setSaveToast({ status: "error", message });
      setTimeout(() => setSaveToast(null), 4000);
      throw err;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const activeJobs = jobs.filter((j) => j.enabled).length;
  const pausedJobs = jobs.length - activeJobs;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ 
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading)'
          }}>
            Cron Jobs
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Scheduled tasks from OpenClaw Gateway
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Create Job button */}
          <button
            onClick={handleCreateNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: '#000',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'opacity 0.2s'
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Job</span>
          </button>

          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '3px',
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: viewMode === "cards" ? 'var(--accent)' : 'transparent',
                color: viewMode === "cards" ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: viewMode === "timeline" ? 'var(--accent)' : 'transparent',
                color: viewMode === "timeline" ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          <button
            onClick={() => { setIsLoading(true); fetchJobs(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'opacity 0.2s'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-8">
        <div style={{
          backgroundColor: 'color-mix(in srgb, var(--card) 50%, transparent)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'color-mix(in srgb, var(--info) 20%, transparent)', borderRadius: '0.5rem' }}>
            <Clock className="w-6 h-6" style={{ color: 'var(--info)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{jobs.length}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Jobs</p>
          </div>
        </div>
        <div style={{
          backgroundColor: 'color-mix(in srgb, var(--card) 50%, transparent)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'color-mix(in srgb, var(--success) 20%, transparent)', borderRadius: '0.5rem' }}>
            <RefreshCw className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeJobs}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active</p>
          </div>
        </div>
        <div style={{
          backgroundColor: 'color-mix(in srgb, var(--card) 50%, transparent)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'color-mix(in srgb, var(--warning) 20%, transparent)', borderRadius: '0.5rem' }}>
            <AlertCircle className="w-6 h-6" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{pausedJobs}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Paused</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
          <span style={{ color: 'var(--error)' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{
            width: '2rem', height: '2rem',
            border: '2px solid var(--accent)', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Clock className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No cron jobs found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Create your first cron job to get started
          </p>
          <button
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: '#000',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
      ) : viewMode === "timeline" ? (
        /* Timeline View */
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <CalendarDays className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              7-Day Schedule Overview
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--card-elevated)',
                padding: '0.25rem 0.6rem',
                borderRadius: '0.35rem',
              }}
            >
              All times in local timezone
            </span>
          </div>
          <CronWeeklyTimeline jobs={jobs} />
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {jobs.map((job) => (
            <div key={job.id} style={{ position: 'relative' }}>
              <CronJobCard
                job={job}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRun={handleRun}
              />
              {deleteConfirm === job.id && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(12, 12, 12, 0.9)',
                  borderRadius: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  zIndex: 10,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Delete &quot;{job.name}&quot;?</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button onClick={() => setDeleteConfirm(null)}
                        style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)', background: 'none', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(job.id)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--error)', color: 'var(--text-primary)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CronJobModal */}
      <CronJobModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingJob={editingJob}
      />

      {/* Run toast notification */}
      {runToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '1.5rem',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(12px)',
            backgroundColor: runToast.status === "success"
              ? 'color-mix(in srgb, var(--success) 15%, rgba(12,12,12,0.95))'
              : 'color-mix(in srgb, var(--error) 15%, rgba(12,12,12,0.95))',
            border: `1px solid ${runToast.status === "success" ? 'color-mix(in srgb, var(--success) 40%, transparent)' : 'color-mix(in srgb, var(--error) 40%, transparent)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            animation: 'slideInRight 0.3s ease',
          }}
        >
          <Zap
            className="w-4 h-4"
            style={{ color: runToast.status === "success" ? 'var(--success)' : 'var(--error)' }}
          />
          {runToast.status === "success"
            ? `✓ "${runToast.name}" triggered!`
            : `✗ Failed to trigger "${runToast.name}"`}
        </div>
      )}

      {/* Save toast notification */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '1.5rem',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(12px)',
            backgroundColor: saveToast.status === "success"
              ? 'color-mix(in srgb, var(--success) 15%, rgba(12,12,12,0.95))'
              : 'color-mix(in srgb, var(--error) 15%, rgba(12,12,12,0.95))',
            border: `1px solid ${saveToast.status === "success" ? 'color-mix(in srgb, var(--success) 40%, transparent)' : 'color-mix(in srgb, var(--error) 40%, transparent)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            animation: 'slideInRight 0.3s ease',
          }}
        >
          {saveToast.status === "success" ? "✓" : "✗"} {saveToast.message}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(2rem); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
