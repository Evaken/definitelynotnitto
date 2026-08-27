/**
 * The seven screens of the game, in the order the original's navigation ran.
 *
 * PROJECT_SPEC 5:
 *   MAIN | CHALLENGE INFO | GARAGE | RACE TRACK | PARTS SHOP | CAR SHOWROOM | TEAM
 *
 * Six of them are placeholders in Stage 1. They exist now so navigation is
 * settled before the screens are built, rather than being retrofitted around a
 * race screen later.
 */
export declare const SCREENS: readonly ["main", "challenge", "garage", "track", "parts", "showroom", "team"];
export type ScreenId = (typeof SCREENS)[number];
export declare const SCREEN_LABELS: Record<ScreenId, string>;
/** The stage of the roadmap that fills each screen in. */
export declare const SCREEN_STAGE: Record<ScreenId, string>;
//# sourceMappingURL=screens.d.ts.map