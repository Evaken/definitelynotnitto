import {describe,expect,it} from 'vitest';
import {CIVIC_ASSET_PACK} from './civicPack.js';
import {quadPoint} from './civicCompositor.js';

describe('Civic layered asset pack',()=>{
  it('is versioned and has independent fixed views',()=>{expect(CIVIC_ASSET_PACK).toMatchObject({id:'civic-si',schemaVersion:1,assetVersion:2});expect(Object.keys(CIVIC_ASSET_PACK.views)).toEqual(['garage','race-rear']);});
  it('keeps the replacement rim in the current cache-safe pack',()=>{expect(CIVIC_ASSET_PACK.views.garage.wheelAsset).toContain('/v2/wheel-mesh.webp');});
  it('keeps authored coordinates normalised',()=>{for(const view of Object.values(CIVIC_ASSET_PACK.views)){expect(view.contactY).toBeGreaterThan(0);expect(view.contactY).toBeLessThanOrEqual(1);for(const slot of view.wheels)for(const value of [slot.x,slot.y,slot.radius,slot.squash]){expect(value).toBeGreaterThan(0);expect(value).toBeLessThanOrEqual(1);}}});
  it('maps a decal into a perspective quad',()=>{const quad=CIVIC_ASSET_PACK.views.garage.surfaces['left-door'];expect(quadPoint(quad,0,0)).toEqual(quad[0]);expect(quadPoint(quad,1,1)).toEqual(quad[2]);const centre=quadPoint(quad,.5,.5);expect(centre[0]).toBeGreaterThan(.6);expect(centre[0]).toBeLessThan(.9);});
});
