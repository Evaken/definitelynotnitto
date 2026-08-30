export type CivicViewId='garage'|'race-rear';
export type Point=readonly [number,number];
export type Quad=readonly [Point,Point,Point,Point];

export interface WheelSlot {readonly x:number;readonly y:number;readonly radius:number;readonly squash:number;readonly rotation:number;}
export interface CivicViewManifest {
  readonly width:number;
  readonly height:number;
  readonly bodyAsset:string;
  readonly paintMaskAsset:string;
  readonly wheelAsset?:string;
  readonly baseHue:number;
  readonly contactY:number;
  readonly wheels:readonly WheelSlot[];
  readonly surfaces:Readonly<Record<'hood'|'left-door'|'right-door'|'roof'|'rear-quarter',Quad>>;
}

export interface CivicAssetPack {
  readonly id:'civic-si';
  readonly schemaVersion:1;
  readonly assetVersion:number;
  readonly views:Readonly<Record<CivicViewId,CivicViewManifest>>;
}

const hidden:Quad=[[0,0],[0,0],[0,0],[0,0]];

/**
 * The renderer is generic; this manifest is the authored data for one car.
 * Coordinates are normalised so a future in-game authoring tool can export the
 * same structure without changing application code.
 */
export const CIVIC_ASSET_PACK:CivicAssetPack={
  id:'civic-si',schemaVersion:1,assetVersion:2,
  views:{
    garage:{
      width:768,height:512,bodyAsset:'assets/cars/civic-si/v2/garage-body.webp',paintMaskAsset:'assets/cars/civic-si/v2/garage-paint-mask.png',wheelAsset:'assets/cars/civic-si/v2/wheel-mesh.webp',baseHue:220,contactY:.86,
      wheels:[{x:.548,y:.696,radius:.126,squash:.75,rotation:0},{x:.922,y:.58,radius:.096,squash:.73,rotation:0}],
      surfaces:{
        hood:[[.128,.523],[.365,.383],[.612,.393],[.453,.563]],
        'left-door':[[.623,.426],[.838,.397],[.858,.596],[.608,.642]],
        'right-door':hidden,
        roof:[[.535,.164],[.744,.158],[.803,.184],[.582,.191]],
        'rear-quarter':[[.838,.355],[.956,.34],[.976,.535],[.874,.574]],
      },
    },
    'race-rear':{
      width:768,height:512,bodyAsset:'assets/cars/civic-si/v2/race-body.webp',paintMaskAsset:'assets/cars/civic-si/v2/race-paint-mask.png',baseHue:48,contactY:.86,wheels:[],
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
