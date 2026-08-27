import { COLORS, PX_PER_M, TRACK_Y } from './layout.js';
/**
 * Side-on car sprite.
 *
 * Drawn from paths at the world scale, so its proportions stay honest against
 * the track scrolling past.  Stage 8 replaces this with layered artwork for
 * paint and wheels; the shape of the function -- position, wheel angle, pitch
 * in, pixels out -- is what needs to survive that.
 */
/** Overall length and height of a compact hatchback, metres. */
const BODY_LENGTH_M = 4.35;
const BODY_HEIGHT_M = 1.0;
const WHEEL_RADIUS_M = 0.3;
/** Axle positions measured back from the nose, metres. */
const FRONT_AXLE_M = 0.95;
const REAR_AXLE_M = 3.5;
export function drawCar(ctx, car) {
    const length = BODY_LENGTH_M * PX_PER_M;
    const height = BODY_HEIGHT_M * PX_PER_M;
    const wheelRadius = WHEEL_RADIUS_M * PX_PER_M;
    const frontAxleX = car.noseX - FRONT_AXLE_M * PX_PER_M;
    const rearAxleX = car.noseX - REAR_AXLE_M * PX_PER_M;
    const axleY = TRACK_Y - wheelRadius;
    if (car.wheelspin) {
        drawSmoke(ctx, car.drivenAxle === 'front' ? frontAxleX : rearAxleX, TRACK_Y);
    }
    ctx.save();
    // Pitch about the middle of the wheelbase so the nose lifts and tail squats.
    ctx.translate((frontAxleX + rearAxleX) / 2, axleY);
    ctx.rotate(car.pitch);
    ctx.translate(-(frontAxleX + rearAxleX) / 2, -axleY);
    drawBody(ctx, car.noseX, axleY, length, height);
    ctx.restore();
    drawWheel(ctx, frontAxleX, axleY, wheelRadius, car.wheelAngle);
    drawWheel(ctx, rearAxleX, axleY, wheelRadius, car.wheelAngle);
}
function drawBody(ctx, noseX, axleY, length, height) {
    const tailX = noseX - length;
    const sillY = axleY + 6;
    const beltY = sillY - height * 0.55;
    const roofY = beltY - height * 0.45;
    const paint = ctx.createLinearGradient(0, roofY, 0, sillY);
    paint.addColorStop(0, COLORS.bodyLight);
    paint.addColorStop(1, COLORS.bodyDark);
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.moveTo(tailX, sillY);
    ctx.lineTo(tailX - 2, beltY + 4);
    ctx.lineTo(tailX + length * 0.16, roofY);
    ctx.lineTo(tailX + length * 0.56, roofY);
    ctx.lineTo(tailX + length * 0.8, beltY);
    ctx.lineTo(noseX, beltY + 3);
    ctx.lineTo(noseX + 2, sillY - 3);
    ctx.lineTo(noseX, sillY);
    ctx.closePath();
    ctx.fill();
    // Glasshouse
    ctx.fillStyle = COLORS.glass;
    ctx.beginPath();
    ctx.moveTo(tailX + length * 0.19, roofY + 2);
    ctx.lineTo(tailX + length * 0.55, roofY + 2);
    ctx.lineTo(tailX + length * 0.76, beltY + 1);
    ctx.lineTo(tailX + length * 0.14, beltY + 1);
    ctx.closePath();
    ctx.fill();
    // Shut lines and lamps, for a little period detail.
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tailX + length * 0.42, beltY + 1);
    ctx.lineTo(tailX + length * 0.4, sillY - 1);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(noseX - 6, beltY + 6, 5, 4);
    ctx.fillStyle = '#d8483a';
    ctx.fillRect(tailX + 1, beltY + 6, 4, 5);
}
function drawWheel(ctx, x, y, radius, angle) {
    ctx.fillStyle = COLORS.tyre;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.rim;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // Spokes make rotation -- and therefore wheelspin -- visible.
    ctx.strokeStyle = COLORS.tyre;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
        const spoke = angle + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(spoke) * radius * 0.5, y + Math.sin(spoke) * radius * 0.5);
        ctx.stroke();
    }
}
function drawSmoke(ctx, x, groundY) {
    ctx.fillStyle = 'rgba(210, 214, 222, 0.16)';
    for (let i = 0; i < 4; i++) {
        const spread = 7 + i * 9;
        ctx.beginPath();
        ctx.arc(x - i * 11, groundY - 3 - i * 3, spread, 0, Math.PI * 2);
        ctx.fill();
    }
}
//# sourceMappingURL=car.js.map