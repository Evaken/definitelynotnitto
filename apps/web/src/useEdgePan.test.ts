import {describe,expect,it} from 'vitest';
import {edgePanVelocity} from './useEdgePan.js';

describe('edge carousel velocity',()=>{
  it('stays still through the central inspection zone',()=>{expect(edgePanVelocity(250,1000)).toBe(0);expect(edgePanVelocity(500,1000)).toBe(0);expect(edgePanVelocity(700,1000)).toBe(0);});
  it('pans toward the side the pointer occupies',()=>{expect(edgePanVelocity(30,1000)).toBeLessThan(0);expect(edgePanVelocity(970,1000)).toBeGreaterThan(0);});
  it('accelerates toward the edges',()=>{expect(Math.abs(edgePanVelocity(0,1000))).toBeGreaterThan(Math.abs(edgePanVelocity(150,1000)));expect(edgePanVelocity(1000,1000)).toBeCloseTo(10);});
});
