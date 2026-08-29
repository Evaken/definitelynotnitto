export type CivicViewId='garage'|'race-rear';
export type Point=readonly [number,number];
export type Quad=readonly [Point,Point,Point,Point];

export interface WheelSlot {readonly x:number;readonly y:number;readonly radius:number;readonly squash:number;readonly rotation:number;}
export interface CivicViewManifest {
  readonly width:number;
  readonly height:number;
  readonly bodyAsset:string;
  readonly paintMaskAsset:string;
  readonly baseHue:number;
  readonly contactY:number;
  readonly wheels:readonly WheelSlot[];
  readonly surfaces:Readonly<Record<'hood'|'left-door'|'right-door'|'roof'|'rear-quarter',Quad>>;
}

export interface CivicAssetPack {
  readonly id:'civic-si';
  readonly schemaVersion:1;
  readonly assetVersion:1;
  readonly views:Readonly<Record<CivicViewId,CivicViewManifest>>;
}

const hidden:Quad=[[0,0],[0,0],[0,0],[0,0]];

/**
 * The renderer is generic; this manifest is the authored data for one car.
 * Coordinates are normalised so a future in-game authoring tool can export the
 * same structure without changing application code.
 */
export const CIVIC_ASSET_PACK:CivicAssetPack={
  id:'civic-si',schemaVersion:1,assetVersion:1,
  views:{
    garage:{
      width:768,height:512,bodyAsset:'assets/cars/civic-si/v1/garage-body.webp',paintMaskAsset:'assets/cars/civic-si/v1/garage-paint-mask.png',baseHue:220,contactY:.84,
      wheels:[{x:.551,y:.648,radius:.111,squash:.96,rotation:-.03},{x:.933,y:.56,radius:.083,squash:.9,rotation:-.025}],
      surfaces:{
        hood:[[.12,.55],[.52,.39],[.61,.51],[.31,.66]],
        'left-door':[[.61,.43],[.84,.39],[.88,.61],[.61,.67]],
        'right-door':hidden,
        roof:[[.43,.2],[.78,.18],[.86,.3],[.54,.31]],
        'rear-quarter':[[.84,.36],[.96,.34],[.98,.54],[.88,.58]],
      },
    },
    'race-rear':{
      width:768,height:512,bodyAsset:'assets/cars/civic-si/v1/race-body.webp',paintMaskAsset:'assets/cars/civic-si/v1/race-paint-mask.png',baseHue:48,contactY:.86,wheels:[],
      surfaces:{
        hood:hidden,
        'left-door':hidden,
        'right-door':hidden,
        roof:[[.35,.15],[.65,.15],[.68,.31],[.32,.31]],
        'rear-quarter':[[.27,.37],[.73,.37],[.76,.69],[.24,.69]],
      },
    },
  },
};

export function civicAssetUrl(relative:string):string{return `${import.meta.env.BASE_URL}${relative}`;}
