import { parseSyntaxInput } from '../core/syntax';

type NumericVars = Record<`--${string}`, string | number | boolean | undefined>;

export type GameReleaseSyntaxProfile = {
  qualityVariantHigh: number;
  qualityVariantMid: number;
  variantChanceLow: number;
  variantChanceMid: number;
  variantChanceHigh: number;
  staleDaysThreshold: number;
  staleDeltaThreshold: number;
  stalePenalty: number;
  qualityPenaltyBase: number;
  qualityPenaltyFactor: number;
  qualityVariantMidGate: number;
  qualityVariantHighGate: number;
  scoreInnovationWeight: number;
  scoreResearchWeight: number;
  scoreReleaseRatingWeight: number;
  scoreFabricationWeight: number;
  scoreMarketingWeight: number;
};

const DEFAULT_RELEASE_PROFILE: GameReleaseSyntaxProfile = Object.freeze({
  qualityVariantHigh: 72,
  qualityVariantMid: 56,
  variantChanceLow: 10,
  variantChanceMid: 20,
  variantChanceHigh: 32,
  staleDaysThreshold: 24,
  staleDeltaThreshold: 6,
  stalePenalty: 3.2,
  qualityPenaltyBase: 58,
  qualityPenaltyFactor: 0.52,
  qualityVariantMidGate: 56,
  qualityVariantHighGate: 72,
  scoreInnovationWeight: 0.52,
  scoreResearchWeight: 18,
  scoreReleaseRatingWeight: 28,
  scoreFabricationWeight: 12,
  scoreMarketingWeight: 9,
});

const RELEASE_PROFILE_SYNTAX = `vars(
  qualityVariantHigh:72,
  qualityVariantMid:56,
  variantChanceLow:10,
  variantChanceMid:20,
  variantChanceHigh:32,
  staleDaysThreshold:24,
  staleDeltaThreshold:6,
  stalePenalty:3.2,
  qualityPenaltyBase:58,
  qualityPenaltyFactor:0.52,
  qualityVariantMidGate:56,
  qualityVariantHighGate:72,
  scoreInnovationWeight:0.52,
  scoreResearchWeight:18,
  scoreReleaseRatingWeight:28,
  scoreFabricationWeight:12,
  scoreMarketingWeight:9
);`;

function readNumericVar(vars: NumericVars | undefined, key: keyof GameReleaseSyntaxProfile, fallback: number) {
  const value = vars?.[`--${key}`];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function buildReleaseSyntaxProfile() {
  try {
    const parsed = parseSyntaxInput(RELEASE_PROFILE_SYNTAX);
    const vars = parsed.vars as NumericVars | undefined;
    const profile: GameReleaseSyntaxProfile = {
      qualityVariantHigh: readNumericVar(vars, 'qualityVariantHigh', DEFAULT_RELEASE_PROFILE.qualityVariantHigh),
      qualityVariantMid: readNumericVar(vars, 'qualityVariantMid', DEFAULT_RELEASE_PROFILE.qualityVariantMid),
      variantChanceLow: readNumericVar(vars, 'variantChanceLow', DEFAULT_RELEASE_PROFILE.variantChanceLow),
      variantChanceMid: readNumericVar(vars, 'variantChanceMid', DEFAULT_RELEASE_PROFILE.variantChanceMid),
      variantChanceHigh: readNumericVar(vars, 'variantChanceHigh', DEFAULT_RELEASE_PROFILE.variantChanceHigh),
      staleDaysThreshold: readNumericVar(vars, 'staleDaysThreshold', DEFAULT_RELEASE_PROFILE.staleDaysThreshold),
      staleDeltaThreshold: readNumericVar(vars, 'staleDeltaThreshold', DEFAULT_RELEASE_PROFILE.staleDeltaThreshold),
      stalePenalty: readNumericVar(vars, 'stalePenalty', DEFAULT_RELEASE_PROFILE.stalePenalty),
      qualityPenaltyBase: readNumericVar(vars, 'qualityPenaltyBase', DEFAULT_RELEASE_PROFILE.qualityPenaltyBase),
      qualityPenaltyFactor: readNumericVar(vars, 'qualityPenaltyFactor', DEFAULT_RELEASE_PROFILE.qualityPenaltyFactor),
      qualityVariantMidGate: readNumericVar(vars, 'qualityVariantMidGate', DEFAULT_RELEASE_PROFILE.qualityVariantMidGate),
      qualityVariantHighGate: readNumericVar(vars, 'qualityVariantHighGate', DEFAULT_RELEASE_PROFILE.qualityVariantHighGate),
      scoreInnovationWeight: readNumericVar(vars, 'scoreInnovationWeight', DEFAULT_RELEASE_PROFILE.scoreInnovationWeight),
      scoreResearchWeight: readNumericVar(vars, 'scoreResearchWeight', DEFAULT_RELEASE_PROFILE.scoreResearchWeight),
      scoreReleaseRatingWeight: readNumericVar(vars, 'scoreReleaseRatingWeight', DEFAULT_RELEASE_PROFILE.scoreReleaseRatingWeight),
      scoreFabricationWeight: readNumericVar(vars, 'scoreFabricationWeight', DEFAULT_RELEASE_PROFILE.scoreFabricationWeight),
      scoreMarketingWeight: readNumericVar(vars, 'scoreMarketingWeight', DEFAULT_RELEASE_PROFILE.scoreMarketingWeight),
    };
    return Object.freeze(profile);
  } catch {
    return DEFAULT_RELEASE_PROFILE;
  }
}

export const GAME_RELEASE_SYNTAX_PROFILE = buildReleaseSyntaxProfile();

