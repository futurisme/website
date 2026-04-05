import { createRepairPlan, type RepairPlan } from './repair-planner.ts';
import { diagnoseSystemHealth, type DiagnosticReport, type DiagnosticSignal } from './diagnostics.ts';

export type DebugSessionInput = {
  signals: DiagnosticSignal[];
  context?: {
    subsystem?: string;
    releaseTag?: string;
  };
};

export type DebugSessionReport = {
  contextLabel: string;
  diagnostics: DiagnosticReport;
  repairPlan: RepairPlan;
};

export function runDebugSession(input: DebugSessionInput): DebugSessionReport {
  const diagnostics = diagnoseSystemHealth(input.signals);
  const repairPlan = createRepairPlan(diagnostics);
  const contextLabel = [input.context?.subsystem, input.context?.releaseTag].filter(Boolean).join(' @ ') || 'global';

  return {
    contextLabel,
    diagnostics,
    repairPlan,
  };
}
