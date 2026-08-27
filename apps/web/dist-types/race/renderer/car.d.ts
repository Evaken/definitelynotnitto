export interface CarRender {
    /** Screen x of the front of the car. */
    readonly noseX: number;
    /** Driven-wheel angle in radians, for visible wheel rotation. */
    readonly wheelAngle: number;
    /** Body pitch in radians; squats under power, rises when lifting. */
    readonly pitch: number;
    readonly drivenAxle: 'front' | 'rear' | 'both';
    /** Draws tyre smoke when the driven wheels are past their grip peak. */
    readonly wheelspin: boolean;
}
export declare function drawCar(ctx: CanvasRenderingContext2D, car: CarRender): void;
//# sourceMappingURL=car.d.ts.map