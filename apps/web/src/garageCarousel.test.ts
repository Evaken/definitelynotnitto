import{describe,expect,it}from'vitest';
import{garageBrowseDirection,garageGlideProgress,nextGarageIndex}from'./garageCarousel.js';

describe('focused garage browsing',()=>{
  it('reserves the centre for a stationary focused bay',()=>{expect(garageBrowseDirection(50,100)).toBe(0);expect(garageBrowseDirection(19,100)).toBe(-1);expect(garageBrowseDirection(81,100)).toBe(1);});
  it('sticks at the first and last owned cars',()=>{expect(nextGarageIndex(0,5,-1)).toBe(0);expect(nextGarageIndex(2,5,1)).toBe(3);expect(nextGarageIndex(4,5,1)).toBe(4);});
  it('keeps the glide slow through the middle before settling exactly',()=>{expect(garageGlideProgress(0)).toBe(0);expect(garageGlideProgress(.25)).toBeCloseTo(.0625);expect(garageGlideProgress(.5)).toBe(.5);expect(garageGlideProgress(.75)).toBeCloseTo(.9375);expect(garageGlideProgress(1)).toBe(1);});
});
