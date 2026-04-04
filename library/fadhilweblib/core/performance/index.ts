export { createAdaptiveHydrationEngine } from './adaptive-hydration';
export type { AdaptiveHydrationOptions, AdaptiveHydrationTarget } from './adaptive-hydration';

export { installGhostPlaceholder } from './ghost-placeholder';
export type { GhostPlaceholderController, GhostPlaceholderOptions } from './ghost-placeholder';

export { applyHeroPriorityHint, detectSmartMediaProfile, resolveSmartMediaSource } from './smart-media-bridge';
export type { NetworkTier, SmartMediaProfile } from './smart-media-bridge';

export { enableSpeculativeNavigation } from './speculative-navigation';
export type { SpeculativeNavigationOptions } from './speculative-navigation';

export { applyZeroJankMotion, createMotionStyle } from './zero-jank-motion';
export type { MotionConfig, MotionKeyframe } from './zero-jank-motion';

export { applyRenderBudgetHints, createFreedomStyleScope, createScopedTokenStyles, queueFreedomTask } from './freedom-runtime';
export type { FreedomScopeStyleInput, FreedomStyleScope, FreedomTaskOptions, FreedomTaskPriority, RenderBudgetHintOptions } from './freedom-runtime';

export {
  composeGradient,
  createCinematicBandGradient,
  createElegantSurfaceGradient,
  createGradientLayer,
  createPortfolioRibbonGradient,
  withOpacity,
} from './gradient-system';
export type { GradientBand, GradientKind, GradientLayer } from './gradient-system';
