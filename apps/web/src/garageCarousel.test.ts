import{describe,expect,it}from'vitest';
import{GARAGE_EDGE_DWELL_MS,GARAGE_EDGE_REPEAT_MS,GARAGE_GLIDE_MS,garageBrowseDirection,garageGlideProgress,nextGarageIndex}from'./garageCarousel.js';

describe('focused garage browsing',()=>{
  it('reserves the centre for a stationary focused bay',()=>{expect(garageBrowseDirection(50,100)).toBe(0);expect(garageBrowseDirection(19,100)).toBe(-1);expect(garageBrowseDirection(81,100)).toBe(1);});
  it('sticks at the first and last owned cars',()=>{expect(nextGarageIndex(0,5,-1)).toBe(0);expect(nextGarageIndex(2,5,1)).toBe(3);expect(nextGarageIndex(4,5,1)).toBe(4);});
  it('uses one continuous glide with a clean start and finish',()=>{expect(garageGlideProgress(0)).toBe(0);expect(garageGlideProgress(.25)).toBeCloseTo(.146447);expect(garageGlideProgress(.5)).toBeCloseTo(.5);expect(garageGlideProgress(.75)).toBeCloseTo(.853553);expect(garageGlideProgress(1)).toBe(1);});
  it('finishes each glide before edge browsing repeats',()=>{expect(GARAGE_EDGE_DWELL_MS).toBeGreaterThan(100);expect(GARAGE_GLIDE_MS).toBeLessThan(GARAGE_EDGE_REPEAT_MS);});
});
