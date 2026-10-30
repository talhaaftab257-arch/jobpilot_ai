import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Overview } from './pages/Overview';
import { DiscoverJobs } from './pages/DiscoverJobs';
import { JobDetails } from './pages/JobDetails';
import { MatchedJobs } from './pages/MatchedJobs';
import { Applications } from './pages/Applications';
import { ResumeLibrary } from './pages/ResumeLibrary';
import { AIAssistant } from './pages/AIAssistant';
import { Calendar } from './pages/Calendar';
import { EmailTemplates } from './pages/EmailTemplates';
import { Integrations } from './pages/Integrations';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AutomationCenter } from './pages/AutomationCenter';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { api, EMPTY_CONFIG, EMPTY_REPORT } from './services/api';
import {
  Region,
  Job,
  JobProfileConfig,
  DailyReport,
  Application,
  Resume,
  Integration
} from './types';

export function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab')) return params.get('tab') as NavTab;
    return 'overview' as NavTab;
  })();

  const [currentTab, setCurrentTab] = useState<NavTab>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [config, setConfig] = useState<JobProfileConfig>(EMPTY_CONFIG);
  const [report, setReport] = useState<DailyReport>(EMPTY_REPORT);
  const [regions, setRegions] = useState<Region[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('jobpilot_saved_jobs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      try {
        localStorage.setItem('jobpilot_saved_jobs', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
      return next;
    });
  };

  const refreshData = async () => {
    setLoadError(null);
    const results = await Promise.allSettled([
      api.getConfig(),
      api.getDailyReport(),
      api.getRegions(),
      // Pull per-region so PK/ASIA are not crowded out by EU remote feeds
      Promise.all([
        api.getJobs('limit=80&region=PK'),
        api.getJobs('limit=80&region=ASIA'),
        api.getJobs('limit=80&region=EU'),
        api.getJobs('limit=80&region=ARAB'),
        api.getJobs('limit=40'),
      ]).then((chunks) => {
        const byId = new Map<string, Job>();
        chunks.flat().forEach((j) => {
          if (j?.id) byId.set(j.id, j);
        });
        return Array.from(byId.values()).sort((a, b) => {
          const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
          const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
          return tb - ta;
        });
      }),
      api.getApplications(),
      api.getResumes(),
      api.getIntegrations(),
    ]);

    const [cfg, rpt, regs, jbs, apps, res, ints] = results;

    if (cfg.status === 'fulfilled' && cfg.value) setConfig(cfg.value);
    if (rpt.status === 'fulfilled' && rpt.value) setReport(rpt.value);
    if (regs.status === 'fulfilled') setRegions(Array.isArray(regs.value) ? regs.value : []);
    if (jbs.status === 'fulfilled') {
      const list = Array.isArray(jbs.value) ? jbs.value : [];
      setJobs(list);
      setSelectedJob((prev) => {
        if (prev && list.some((j) => j.id === prev.id)) {
          return list.find((j) => j.id === prev.id) || prev;
        }
        return list[0] ?? null;
      });
    }
    if (apps.status === 'fulfilled') {
      setApplications(Array.isArray(apps.value) ? apps.value : []);
    }
    if (res.status === 'fulfilled') setResumes(Array.isArray(res.value) ? res.value : []);
    if (ints.status === 'fulfilled') {
      setIntegrations(Array.isArray(ints.value) ? ints.value : []);
    }

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed === results.length) {
      setLoadError('Could not reach the API. Start the backend on port 8000.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        await refreshData();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTogglePause = async () => {
    const nextState = !config.is_emergency_paused;
    setConfig((prev) => ({ ...prev, is_emergency_paused: nextState }));
    try {
      if (nextState) await api.pauseAgent();
      else await api.resumeAgent();
    } catch (e) {
      console.warn('Pause toggle failed', e);
    }
  };

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryStatus('Scanning global feeds...');
    try {
      await api.triggerRunAndPoll((msg) => setDiscoveryStatus(msg));
      await refreshData();
    } catch (e) {
      console.warn('Discovery failed', e);
    } finally {
      setTimeout(() => {
        setIsDiscovering(false);
        setDiscoveryStatus('');
      }, 1500);
    }
  };

  const handleSaveConfig = async (updated: Partial<JobProfileConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
    try {
      const saved = await api.updateConfig(updated);
      if (saved) setConfig(saved);
    } catch (e) {
      console.warn('Config save failed', e);
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Overview';
      case 'jobs':
        return 'Discover Jobs';
      case 'details':
        return 'Job Details';
      case 'matched':
        return 'Matched Jobs';
      case 'applications':
        return 'Applications';
      case 'resumes':
        return 'Resume Library';
      case 'assistant':
        return 'AI Assistant';
      case 'calendar':
        return 'Calendar';
      case 'templates':
        return 'Email Templates';
      case 'analytics':
        return 'Analytics';
      case 'integrations':
        return 'Integrations';
      case 'automation':
        return 'Automation';
      case 'settings':
        return 'Settings';
      default:
        return 'JobPilot AI';
    }
  };

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <div className="flex h-screen bg-[#F6F3F4] text-[#202020] overflow-hidden font-sans selection:bg-[#F5E9ED] selection:text-[#641E32]">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        savedCount={savedJobIds.size}
        isPaused={config.is_emergency_paused}
        quotaUsed={report.used_quota || 0}
        quotaMax={report.max_quota || config.global_daily_cap || 30}
        candidateName={
          (() => {
            try {
              return localStorage.getItem('jobpilot_candidate_name') || 'Talha Alam';
            } catch {
              return 'Talha Alam';
            }
          })()
        }
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          pageTitle={getPageTitle()}
          currentTab={currentTab}
          isPaused={config.is_emergency_paused}
          onTogglePause={handleTogglePause}
          onTriggerDiscovery={handleRunDiscovery}
          isDiscovering={isDiscovering}
          discoveryStatus={discoveryStatus}
          dryRunMode={config.is_dry_run_mode}
          onNavigate={(tab) => setCurrentTab(tab)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isLoading && (
            <div className="mb-4 text-xs font-semibold text-[#737373]">
              Loading live data from API…
            </div>
          )}
          {loadError && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEE2E2] border border-red-200 text-[#C53030] text-xs font-semibold">
              {loadError}
            </div>
          )}

          {currentTab === 'overview' && (
            <Overview
              report={report}
              recentJobs={jobs}
              recentApps={applications}
              regions={regions}
              onNavigate={(tab) => setCurrentTab(tab)}
              onRunDiscovery={handleRunDiscovery}
              isDiscovering={isDiscovering}
            />
          )}

          {currentTab === 'jobs' && (
            <DiscoverJobs
              jobs={jobs}
              savedJobIds={savedJobIds}
              onToggleSaveJob={handleToggleSaveJob}
              onSelectJob={(job) => {
                setSelectedJob(job);
                setCurrentTab('details');
              }}
            />
          )}

          {currentTab === 'details' && selectedJob && (
            <JobDetails
              job={selectedJob}
              isSaved={savedJobIds.has(selectedJob.id)}
              onToggleSave={() => handleToggleSaveJob(selectedJob.id)}
              onApply={() => setCurrentTab('templates')}
              onBack={() => setCurrentTab('jobs')}
            />
          )}

          {currentTab === 'details' && !selectedJob && (
            <div className="bg-white rounded-2xl border border-[#E7E0E3] p-10 text-center text-sm text-[#737373]">
              No job selected. Discover jobs first.
            </div>
          )}

          {currentTab === 'matched' && (
            <MatchedJobs
              jobs={jobs}
              onPrepareApplication={(job) => {
                setSelectedJob(job);
                setCurrentTab('details');
              }}
            />
          )}

          {currentTab === 'applications' && (
            <Applications
              applications={applications}
              onRetry={() => {}}
              onNavigateToJobs={() => setCurrentTab('jobs')}
            />
          )}

          {currentTab === 'resumes' && (
            <ResumeLibrary regions={regions} resumes={resumes} />
          )}

          {currentTab === 'assistant' && (
            <AIAssistant
              jobs={jobs}
              applications={applications}
              onTriggerDiscovery={handleRunDiscovery}
              isDiscovering={isDiscovering}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
            />
          )}

          {currentTab === 'calendar' && <Calendar applications={applications} />}

          {currentTab === 'templates' && (
            <EmailTemplates config={config} onSaveConfig={handleSaveConfig} />
          )}

          {currentTab === 'integrations' && (
            <Integrations
              integrations={integrations}
              onUpdateIntegration={(id, updated) => {
                setIntegrations((prev) =>
                  prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
                );
              }}
            />
          )}

          {currentTab === 'analytics' && (
            <Analytics report={report} applications={applications} jobs={jobs} />
          )}

          {currentTab === 'automation' && (
            <AutomationCenter
              isPaused={config.is_emergency_paused}
              onTogglePause={handleTogglePause}
              onTriggerDiscovery={handleRunDiscovery}
              isDiscovering={isDiscovering}
              report={report}
            />
          )}

          {currentTab === 'settings' && (
            <Settings config={config} onSaveConfig={handleSaveConfig} regions={regions} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
