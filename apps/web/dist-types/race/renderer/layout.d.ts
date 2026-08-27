/**
 * Fixed geometry for the race canvas.
 *
 * A bounded, fixed-size playfield rather than a responsive layout
 * (PROJECT_SPEC 5): the canvas renders at these dimensions and CSS scales the
 * whole thing, so the scene never reflows and proportions never shift.
 */
export declare const CANVAS_WIDTH = 960;
export declare const CANVAS_HEIGHT = 440;
/**
 * One world metre in pixels.
 *
 * Everything -- car, wheels, distance markers, beam spacing -- is drawn at this
 * single scale, so the wheels turn at a rate that matches the ground going by
 * and wheelspin is visible rather than implied.
 */
export declare const PX_PER_M = 26;
/** Where the car sits on screen; the world scrolls past it. */
export declare const CAR_SCREEN_X = 300;
export declare const HUD_HEIGHT = 56;
export declare const HORIZON_Y = 236;
/** Ground level: where the tyres meet the track. */
export declare const TRACK_Y = 330;
export declare const TRACK_BOTTOM = 368;
export declare const COLORS: {
    readonly hudBg: "#12151b";
    readonly skyTop: "#1b2433";
    readonly skyBottom: "#39404f";
    readonly distant: "#242b38";
    readonly trackTop: "#3a3f48";
    readonly trackBottom: "#22262d";
    readonly laneLine: "#5a616d";
    readonly marker: "#8b93a1";
    readonly markerMajor: "#e8a317";
    readonly text: "#d8dce3";
    readonly textDim: "#8b93a1";
    readonly accent: "#e8a317";
    readonly amber: "#ffb400";
    readonly green: "#3fd35a";
    readonly red: "#e5462f";
    readonly bulbOff: "#2a2f38";
    readonly bodyLight: "#c8ccd4";
    readonly bodyDark: "#7d838e";
    readonly glass: "#2c3746";
    readonly tyre: "#15181d";
    readonly rim: "#9aa2b0";
};
/** Screen x for a world position, given where the camera is. */
export declare function worldToScreen(worldM: number, cameraM: number): number;
//# sourceMappingURL=layout.d.ts.map