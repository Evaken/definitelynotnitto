import {describe,expect,it} from 'vitest';
import {shouldMirrorRaceArtwork,solidContactFraction} from './carSprite.js';

describe('race artwork orientation',()=>{
  it('turns left-pointing source art inward in the player left lane',()=>expect(shouldMirrorRaceArtwork('left',-1.8)).toBe(true));
  it('keeps right-pointing source art inward in the player left lane',()=>expect(shouldMirrorRaceArtwork('right',-1.8)).toBe(false));
  it('reverses the rule for a right-lane opponent',()=>{expect(shouldMirrorRaceArtwork('left',1.8)).toBe(false);expect(shouldMirrorRaceArtwork('right',1.8)).toBe(true);});
  it('never mirrors a straight rear view',()=>expect(shouldMirrorRaceArtwork('centre',-1.8)).toBe(false));
});


describe('where a car meets the road', () => {
  // Real artwork is 1200 wide, where the coverage guard needs six solid pixels.
  // At toy widths it rounds down to one and a stray pixel would count.
  const W = 1200;
  const image = (rows: { y: number; count: number; alpha: number }[], height = 100) => {
    const data = new Uint8ClampedArray(W * height * 4);
    for (const row of rows)
      for (let x = 0; x < row.count; x++) data[(row.y * W + x) * 4 + 3] = row.alpha;
    return { data, height };
  };

  it('finds the lowest row of real bodywork', () => {
    const { data, height } = image([{ y: 79, count: 400, alpha: 255 }]);
    expect(solidContactFraction(data, W, height)).toBeCloseTo(0.8, 6);
  });

  it('ignores a soft shadow reaching the bottom edge', () => {
    // The Evo's artwork does exactly this: its shadow runs to the last row, so
    // a naive alpha test puts the contact patch 20% too low and the car floats.
    const { data, height } = image([
      { y: 64, count: 400, alpha: 255 },
      { y: 99, count: 900, alpha: 60 },
    ]);
    expect(solidContactFraction(data, W, height)).toBeCloseTo(0.65, 6);
  });

  it('ignores a few stray antialiased pixels', () => {
    const { data, height } = image([
      { y: 50, count: 400, alpha: 255 },
      { y: 90, count: 3, alpha: 255 },
    ]);
    expect(solidContactFraction(data, W, height)).toBeCloseTo(0.51, 6);
  });

  it('leaves an image that really does reach its bottom edge alone', () => {
    const { data, height } = image([{ y: 99, count: 400, alpha: 255 }]);
    expect(solidContactFraction(data, W, height)).toBe(1);
  });

  it('falls back to the old behaviour on a blank image', () => {
    const { data, height } = image([]);
    expect(solidContactFraction(data, W, height)).toBe(1);
  });
});
