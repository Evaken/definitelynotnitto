import {describe,expect,it} from 'vitest';
import {shouldMirrorRaceArtwork} from './carSprite.js';

describe('race artwork orientation',()=>{
  it('turns left-pointing source art inward in the player left lane',()=>expect(shouldMirrorRaceArtwork('left',-1.8)).toBe(true));
  it('keeps right-pointing source art inward in the player left lane',()=>expect(shouldMirrorRaceArtwork('right',-1.8)).toBe(false));
  it('reverses the rule for a right-lane opponent',()=>{expect(shouldMirrorRaceArtwork('left',1.8)).toBe(false);expect(shouldMirrorRaceArtwork('right',1.8)).toBe(true);});
  it('never mirrors a straight rear view',()=>expect(shouldMirrorRaceArtwork('centre',-1.8)).toBe(false));
});
