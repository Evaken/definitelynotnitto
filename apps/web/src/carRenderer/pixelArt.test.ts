import {describe,expect,it} from 'vitest';
import {quantiseChannel} from './pixelArt.js';

describe('pixel-art palette conversion',()=>{
  it('snaps channels to a restricted palette',()=>{
    expect(quantiseChannel(143,32)).toBe(128);
    expect(quantiseChannel(145,32)).toBe(160);
  });

  it('clamps values and tolerates a bad palette step',()=>{
    expect(quantiseChannel(-9,32)).toBe(0);
    expect(quantiseChannel(300,32)).toBe(255);
    expect(quantiseChannel(24,0)).toBe(24);
  });
});
