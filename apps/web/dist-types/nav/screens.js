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
export const SCREENS = [
    'main',
    'challenge',
    'garage',
    'track',
    'parts',
    'showroom',
    'team',
];
export const SCREEN_LABELS = {
    main: 'Main',
    challenge: 'Challenge Info',
    garage: 'Garage',
    track: 'Race Track',
    parts: 'Parts Shop',
    showroom: 'Car Showroom',
    team: 'Team',
};
/** The stage of the roadmap that fills each screen in. */
export const SCREEN_STAGE = {
    main: 'Stage 6',
    challenge: 'Stage 10',
    garage: 'Stage 3',
    track: 'Stage 1',
    parts: 'Stage 3',
    showroom: 'Stage 7',
    team: 'Stage 12',
};
//# sourceMappingURL=screens.js.map