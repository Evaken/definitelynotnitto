import {describe,expect,it} from 'vitest';
import {CIVIC_ASSET_PACK} from './civicPack.js';
import {canonicalPaintRgb,isRaceBodyColourPixel,quadPoint} from './civicCompositor.js';

describe('Civic layered asset pack',()=>{
  it('is versioned and has independent fixed views',()=>{expect(CIVIC_ASSET_PACK).toMatchObject({id:'civic-si',schemaVersion:1,assetVersion:4});expect(Object.keys(CIVIC_ASSET_PACK.views)).toEqual(['garage','race-rear']);expect(CIVIC_ASSET_PACK.views.garage.bodyAsset).toContain('/v4/garage-body.webp');expect(CIVIC_ASSET_PACK.views.garage.paintMaskAsset).toContain('/v4/garage-paint-mask.png');});
  it('keeps the replacement rim in the current cache-safe pack',()=>{expect(CIVIC_ASSET_PACK.views.garage.wheelAsset).toContain('/v2/wheel-mesh.webp');});
  it('keeps authored coordinates normalised',()=>{for(const view of Object.values(CIVIC_ASSET_PACK.views)){expect(view.contactY).toBeGreaterThan(0);expect(view.contactY).toBeLessThanOrEqual(1);for(const slot of view.wheels)for(const value of [slot.x,slot.y,slot.radius,slot.squash]){expect(value).toBeGreaterThan(0);expect(value).toBeLessThanOrEqual(1);}}});
  it('maps a decal into a perspective quad',()=>{const quad=CIVIC_ASSET_PACK.views.garage.surfaces['left-door'];expect(quadPoint(quad,0,0)).toEqual(quad[0]);expect(quadPoint(quad,1,1)).toEqual(quad[2]);const centre=quadPoint(quad,.5,.5);expect(centre[0]).toBeGreaterThan(.6);expect(centre[0]).toBeLessThan(.9);});
  it('extends rear paint across yellow body trim without tinting amber lamp centres',()=>{
    expect(isRaceBodyColourPixel(224,176,20,255,350,75)).toBe(true);
    expect(isRaceBodyColourPixel(224,176,20,255,150,350)).toBe(true);
    expect(isRaceBodyColourPixel(224,176,20,255,194,230)).toBe(true);
    expect(isRaceBodyColourPixel(224,176,20,255,145,230)).toBe(false);
    expect(isRaceBodyColourPixel(220,38,25,255,350,75)).toBe(false);
  });
  it('builds every hue from one source-independent paint ramp',()=>{
    const red=canonicalPaintRgb(0,78,.5),purple=canonicalPaintRgb(285,78,.5),wrappedPurple=canonicalPaintRgb(-75,78,.5);
    expect(red[0]).toBeGreaterThan(red[1]);expect(red[1]).toBe(red[2]);
    expect(purple[0]).toBeGreaterThan(purple[1]);expect(purple[2]).toBeGreaterThan(purple[1]);
    expect(wrappedPurple).toEqual(purple);
    expect(canonicalPaintRgb(285,78,-2)).toEqual(canonicalPaintRgb(285,78,0));
    expect(canonicalPaintRgb(285,78,3)).toEqual(canonicalPaintRgb(285,78,1));
    for(let hue=0;hue<=360;hue++)for(const channel of canonicalPaintRgb(hue,78,.5)){expect(channel).toBeGreaterThanOrEqual(0);expect(channel).toBeLessThanOrEqual(255);}
  });
});
