import type { DiagnosticReport } from './diagnostics.ts';

export type RepairStep = {
  id: string;
  title: string;
  owner: 'ai-agent' | 'platform' | 'developer';
  priority: 1 | 2 | 3 | 4;
  estimatedMinutes: number;
};

export type RepairPlan = {
  profile: 'maintenance' | 'stabilization' | 'incident';
  steps: RepairStep[];
  totalMinutes: number;
};

export function createRepairPlan(report: DiagnosticReport): RepairPlan {
  const steps: RepairStep[] = [];

  if (report.riskBand === 'stable') {
    steps.push({
      id: 'maintenance-observe',
      title: 'Run routine smoke diagnostics',
      owner: 'ai-agent',
      priority: 4,
      estimatedMinutes: 5,
    });
  }

  if (report.riskBand === 'watch') {
    steps.push(
      {
        id: 'watch-trace',
        title: 'Capture performance traces for hot paths',
        owner: 'ai-agent',
        priority: 3,
        estimatedMinutes: 12,
      },
      {
        id: 'watch-review',
        title: 'Review top regressions and validate guardrails',
        owner: 'developer',
        priority: 3,
        estimatedMinutes: 20,
      }
    );
  }

  if (report.riskBand === 'degraded' || report.riskBand === 'failure') {
    steps.push(
      {
        id: 'incident-isolate',
        title: 'Isolate high-risk modules and disable unstable features',
        owner: 'platform',
        priority: 1,
        estimatedMinutes: 10,
      },
      {
        id: 'incident-repair',
        title: 'Apply AI-generated repair patch and rerun deterministic checks',
        owner: 'ai-agent',
        priority: 1,
        estimatedMinutes: 18,
      },
      {
        id: 'incident-verify',
        title: 'Run targeted verification and rollout with canary controls',
        owner: 'developer',
        priority: 2,
        estimatedMinutes: 25,
      }
    );
  }

  const totalMinutes = steps.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const profile: RepairPlan['profile'] = report.riskBand === 'stable' ? 'maintenance' : report.riskBand === 'watch' ? 'stabilization' : 'incident';

  return {
    profile,
    steps,
    totalMinutes,
  };
}
