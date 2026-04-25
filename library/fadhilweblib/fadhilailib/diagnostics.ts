export type DiagnosticSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DiagnosticSignal = {
  key: string;
  value: number;
  weight?: number;
};

export type DiagnosticReport = {
  score: number;
  severity: DiagnosticSeverity;
  riskBand: 'stable' | 'watch' | 'degraded' | 'failure';
  recommendations: string[];
};

function normalize(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeWeight(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(0.1, value);
}

export function diagnoseSystemHealth(signals: DiagnosticSignal[]): DiagnosticReport {
  if (signals.length === 0) {
    return {
      score: 0,
      severity: 'low',
      riskBand: 'stable',
      recommendations: ['No signals provided. Add latency/error/resource telemetry.'],
    };
  }

  let weightedSum = 0;
  let weightTotal = 0;

  for (const signal of signals) {
    const weight = normalizeWeight(signal.weight);
    weightedSum += normalize(signal.value) * weight;
    weightTotal += weight;
  }

  const score = weightedSum / weightTotal;
  const severity: DiagnosticSeverity = score >= 0.85 ? 'critical' : score >= 0.65 ? 'high' : score >= 0.35 ? 'medium' : 'low';

  const riskBand: DiagnosticReport['riskBand'] =
    score >= 0.85 ? 'failure' : score >= 0.65 ? 'degraded' : score >= 0.35 ? 'watch' : 'stable';

  const recommendations: string[] = [];

  if (score >= 0.65) {
    recommendations.push('Apply emergency repair plan and isolate unstable modules.');
  }

  if (score >= 0.35) {
    recommendations.push('Increase observability granularity and capture hot-path traces.');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is stable. Continue routine verification.');
  }

  return {
    score: Number(score.toFixed(4)),
    severity,
    riskBand,
    recommendations,
  };
}
