const PORTRAIT_ART: Readonly<Record<string,string>> = {
  'civic-si':'garage-civic-ek.webp','rsx-type-s':'garage-rsx-type-s.webp','evo-vii':'garage-evo-vii.webp',
  'supra-tt':'garage-supra-tt.webp','mustang-cobra':'garage-mustang-cobra.webp','skyline-gtr':'garage-skyline-gtr.webp',
  'neon-srt4':'garage-neon-srt4.webp',rx8:'garage-rx8.webp',nsx:'garage-nsx.webp','viper-srt10':'garage-viper-srt10.webp',
  'mopar-drag':'special-mopar-drag.webp','f-type-drag':'special-f-type-drag.webp','funny-car':'special-funny-car.webp',
};

export type RaceArtworkDirection='left'|'right'|'centre';
const RACE_REAR_ART: Readonly<Record<string,{file:string;baseHue:number;sourceNose:RaceArtworkDirection}>> = {
  'civic-si':{file:'race-civic-ek-rear-v2.webp',baseHue:48,sourceNose:'centre'},'rsx-type-s':{file:'race-rsx-type-s-rear.webp',baseHue:220,sourceNose:'left'},
  'evo-vii':{file:'race-evo-vii-rear.webp',baseHue:220,sourceNose:'left'},'supra-tt':{file:'race-supra-tt-rear.webp',baseHue:220,sourceNose:'left'},
  'mustang-cobra':{file:'race-mustang-cobra-rear.webp',baseHue:220,sourceNose:'right'},'skyline-gtr':{file:'race-skyline-gtr-rear.webp',baseHue:220,sourceNose:'left'},
  'neon-srt4':{file:'race-neon-srt4-rear.webp',baseHue:220,sourceNose:'left'},rx8:{file:'race-rx8-rear.webp',baseHue:220,sourceNose:'left'},
  nsx:{file:'race-nsx-rear.webp',baseHue:220,sourceNose:'left'},'viper-srt10':{file:'race-viper-srt10-rear.webp',baseHue:220,sourceNose:'left'},
};

export function vehiclePortraitUrl(carId:string):string {const file=PORTRAIT_ART[carId]??PORTRAIT_ART['civic-si']!;return `${import.meta.env.BASE_URL}assets/${file}`;}
export function raceRearArt(carId:string):{url:string;baseHue:number;sourceNose:RaceArtworkDirection}|null {const art=RACE_REAR_ART[carId];return art?{url:`${import.meta.env.BASE_URL}assets/${art.file}`,baseHue:art.baseHue,sourceNose:art.sourceNose}:null;}
