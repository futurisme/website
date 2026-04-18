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

type MathScope = Record<string, number>;
type MathFnName = 'clamp' | 'max' | 'min' | 'log10';
type OpToken = '+' | '-' | '*' | '/';
type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'op'; value: OpToken }
  | { type: 'fn'; value: MathFnName }
  | { type: 'comma' }
  | { type: 'paren'; value: '(' | ')' };

type RpnToken =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'op'; value: OpToken }
  | { type: 'fn'; value: MathFnName };

const ALLOWED_FUNCTIONS: Record<MathFnName, (...args: number[]) => number> = {
  clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  log10: (value) => Math.log10(value),
};

const OP_PRIORITY: Record<OpToken, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

const expressionCache = new Map<string, RpnToken[]>();

function tokenizeExpression(input: string) {
  const tokens: Token[] = [];
  const source = input.replace(/\s+/g, '');
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'comma' });
      i += 1;
      continue;
    }
    if (char === '+' || char === '*' || char === '/') {
      tokens.push({ type: 'op', value: char });
      i += 1;
      continue;
    }
    if (char === '-') {
      const prev = tokens[tokens.length - 1];
      const unary = !prev || prev.type === 'op' || prev.type === 'comma' || (prev.type === 'paren' && prev.value === '(');
      if (unary) {
        const numberMatch = source.slice(i).match(/^-?\d+(\.\d+)?/);
        if (numberMatch) {
          tokens.push({ type: 'number', value: Number(numberMatch[0]) });
          i += numberMatch[0].length;
          continue;
        }
      }
      tokens.push({ type: 'op', value: '-' });
      i += 1;
      continue;
    }

    const numberMatch = source.slice(i).match(/^\d+(\.\d+)?/);
    if (numberMatch) {
      tokens.push({ type: 'number', value: Number(numberMatch[0]) });
      i += numberMatch[0].length;
      continue;
    }

    const identifierMatch = source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifierMatch) {
      const value = identifierMatch[0];
      const nextChar = source[i + value.length];
      if (nextChar === '(' && value in ALLOWED_FUNCTIONS) {
        tokens.push({ type: 'fn', value: value as MathFnName });
      } else {
        tokens.push({ type: 'identifier', value });
      }
      i += value.length;
      continue;
    }

    throw new Error(`Unsupported math syntax near "${source.slice(i, i + 8)}"`);
  }

  return tokens;
}

function toRpn(tokens: Token[]) {
  const output: RpnToken[] = [];
  const stack: Array<Token> = [];

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'identifier') {
      output.push(token);
      continue;
    }
    if (token.type === 'fn') {
      stack.push(token);
      continue;
    }
    if (token.type === 'comma') {
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'paren' && top.value === '(') break;
        output.push(stack.pop() as RpnToken);
      }
      continue;
    }
    if (token.type === 'op') {
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'op' && OP_PRIORITY[top.value] >= OP_PRIORITY[token.value]) {
          output.push(stack.pop() as RpnToken);
          continue;
        }
        if (top.type === 'fn') {
          output.push(stack.pop() as RpnToken);
          continue;
        }
        break;
      }
      stack.push(token);
      continue;
    }
    if (token.type === 'paren' && token.value === '(') {
      stack.push(token);
      continue;
    }
    if (token.type === 'paren' && token.value === ')') {
      while (stack.length > 0) {
        const top = stack.pop() as Token;
        if (top.type === 'paren' && top.value === '(') break;
        output.push(top as RpnToken);
      }
      if (stack.length > 0 && stack[stack.length - 1]?.type === 'fn') {
        output.push(stack.pop() as RpnToken);
      }
    }
  }

  while (stack.length > 0) {
    const token = stack.pop() as Token;
    if (token.type !== 'paren') output.push(token as RpnToken);
  }

  return output;
}

function evalRpn(tokens: RpnToken[], scope: MathScope) {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(token.value);
      continue;
    }
    if (token.type === 'identifier') {
      stack.push(Number(scope[token.value] ?? 0));
      continue;
    }
    if (token.type === 'op') {
      const right = stack.pop() ?? 0;
      const left = stack.pop() ?? 0;
      if (token.value === '+') stack.push(left + right);
      if (token.value === '-') stack.push(left - right);
      if (token.value === '*') stack.push(left * right);
      if (token.value === '/') stack.push(right === 0 ? 0 : left / right);
      continue;
    }
    if (token.type === 'fn') {
      if (token.value === 'log10') {
        const value = stack.pop() ?? 0;
        stack.push(ALLOWED_FUNCTIONS.log10(Math.max(1e-9, value)));
        continue;
      }
      if (token.value === 'clamp') {
        const max = stack.pop() ?? 0;
        const min = stack.pop() ?? 0;
        const value = stack.pop() ?? 0;
        stack.push(ALLOWED_FUNCTIONS.clamp(value, min, max));
        continue;
      }
      if (token.value === 'max' || token.value === 'min') {
        const right = stack.pop() ?? 0;
        const left = stack.pop() ?? 0;
        stack.push(ALLOWED_FUNCTIONS[token.value](left, right));
      }
    }
  }
  return stack.pop() ?? 0;
}

export function evaluateGameMathExpression(expression: string, scope: MathScope) {
  const cached = expressionCache.get(expression);
  if (cached) return evalRpn(cached, scope);
  const rpn = toRpn(tokenizeExpression(expression));
  expressionCache.set(expression, rpn);
  return evalRpn(rpn, scope);
}

export const GAME_MATH_EXPRESSIONS = Object.freeze({
  releasedProductScore: 'max(1, cpuScore*scoreInnovationWeight + researchPerDay*scoreResearchWeight + releaseRating*scoreReleaseRatingWeight + fabricationCount*scoreFabricationWeight + marketingCount*scoreMarketingWeight + priceDiscipline)',
  releaseActionScore: 'urgentCashPressure*7.6 + cpuDelta*0.042 + staleness*1.65 + releaseCadencePressure*2.1 + normalCadenceBoost*1.6 + upgradeMomentumPressure*1.7 + marketNeed*1.4 + reputationNeed*0.8 + researchOverflow*0.32 + npcIntelligence*0.44 + launchRevenueSignal*0.9 + releaseRating*0.035 + crisisBoost - qualityGatePenalty - staleSpecPenalty - repeatedSpecPenalty',
});
