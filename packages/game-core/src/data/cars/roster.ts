import type { Car,DrivetrainType } from '../../types/car.js';

interface CarSeed {id:string;displayName:string;manufacturer:string;year:number;price:number;drivetrain:DrivetrainType;mass:number;torque:number;peakRpm:number;redline:number;gears:readonly number[];finalDrive:number;grip:number;drag:number;area:number;frontBias:number;unlockWins?:number;special?:boolean;}
function car(seed:CarSeed):Car{const idle=800;const r=seed.redline,p=seed.peakRpm,t=seed.torque;return{id:seed.id,displayName:seed.displayName,manufacturer:seed.manufacturer,year:seed.year,price:seed.price,...(seed.unlockWins===undefined?{}:{unlockWins:seed.unlockWins}),...(seed.special?{special:true}:{}),drivetrain:seed.drivetrain,engine:{code:`${seed.manufacturer.slice(0,2).toUpperCase()}-${seed.id.slice(0,4).toUpperCase()}`,idleRpm:idle,redlineRpm:r,inertiaKgM2:.16,curve:[{rpm:idle,torqueNm:t*.56},{rpm:Math.round(p*.45),torqueNm:t*.76},{rpm:Math.round(p*.7),torqueNm:t*.91},{rpm:p,torqueNm:t},{rpm:Math.round((p+r)/2),torqueNm:t*.94},{rpm:r,torqueNm:t*.76}]},gearbox:{gearRatios:seed.gears,reverseRatio:3.1,finalDrive:seed.finalDrive,driveEfficiency:seed.drivetrain==='AWD'?.84:.89},tyres:{radiusM:.315,peakGrip:seed.grip,peakSlipRatio:.14,slidingGripFraction:.84,inertiaKgM2:1.55},chassis:{massKg:seed.mass,wheelbaseM:2.65,cgHeightM:.52,frontWeightBias:seed.frontBias,dragCoefficient:seed.drag,frontalAreaM2:seed.area,rollingResistance:.013}};}
function specialCar(seed:CarSeed):Car{const base=car(seed);return{...base,gearbox:{...base.gearbox,clutchCapacityNm:seed.torque*2.5}};}

const five=[3.27,1.89,1.28,.95,.74] as const;const six=[3.27,2.13,1.52,1.15,.92,.74] as const;
export const CORE_ROSTER:readonly Car[]=[
 car({id:'rsx-type-s',displayName:'RSX Type-S',manufacturer:'Acura',year:2002,price:18500,drivetrain:'FWD',mass:1265,torque:193,peakRpm:6000,redline:8000,gears:six,finalDrive:4.39,grip:1.06,drag:.32,area:2.0,frontBias:.63}),
 car({id:'evo-vii',displayName:'Lancer Evolution VII',manufacturer:'Mitsubishi',year:2001,price:28500,drivetrain:'AWD',mass:1400,torque:383,peakRpm:3500,redline:7000,gears:five,finalDrive:4.53,grip:1.13,drag:.35,area:2.12,frontBias:.58}),
 car({id:'supra-tt',displayName:'Supra Twin Turbo',manufacturer:'Toyota',year:1998,price:34000,drivetrain:'RWD',mass:1560,torque:427,peakRpm:4000,redline:6800,gears:six,finalDrive:3.13,grip:1.08,drag:.32,area:2.05,frontBias:.53}),
 car({id:'mustang-cobra',displayName:'Mustang SVT Cobra',manufacturer:'Ford',year:2003,price:36500,drivetrain:'RWD',mass:1660,torque:529,peakRpm:3500,redline:6500,gears:six,finalDrive:3.55,grip:1.06,drag:.36,area:2.2,frontBias:.57}),
 car({id:'skyline-gtr',displayName:'Skyline GT-R',manufacturer:'Nissan',year:1999,price:42000,drivetrain:'AWD',mass:1560,torque:392,peakRpm:4400,redline:8000,gears:six,finalDrive:3.54,grip:1.14,drag:.35,area:2.1,frontBias:.56}),
 car({id:'neon-srt4',displayName:'Neon SRT-4',manufacturer:'Dodge',year:2003,price:20500,drivetrain:'FWD',mass:1320,torque:339,peakRpm:3200,redline:6500,gears:five,finalDrive:3.55,grip:1.04,drag:.34,area:2.08,frontBias:.64}),
 car({id:'rx8',displayName:'RX-8',manufacturer:'Mazda',year:2004,price:23500,drivetrain:'RWD',mass:1370,torque:216,peakRpm:5500,redline:9000,gears:six,finalDrive:4.44,grip:1.09,drag:.31,area:2.02,frontBias:.5}),
 car({id:'nsx',displayName:'NSX',manufacturer:'Acura',year:2002,price:62000,drivetrain:'RWD',mass:1430,torque:304,peakRpm:5300,redline:8000,gears:six,finalDrive:4.06,grip:1.12,drag:.3,area:1.86,frontBias:.42}),
 car({id:'viper-srt10',displayName:'Viper SRT-10',manufacturer:'Dodge',year:2003,price:78000,drivetrain:'RWD',mass:1530,torque:678,peakRpm:4200,redline:6200,gears:six,finalDrive:3.07,grip:1.1,drag:.39,area:1.96,frontBias:.49}),
].map(base=>({...base,gearbox:{...base.gearbox,clutchCapacityNm:Math.max(...base.engine.curve.map(point=>point.torqueNm))*1.35}}));

/** Clean-room endgame stand-ins based on the documented special-car classes. */
export const SPECIAL_ROSTER:readonly Car[]=[
 specialCar({id:'mopar-drag',displayName:'Mopar Drag Car',manufacturer:'Dodge',year:2003,price:180000,unlockWins:25,special:true,drivetrain:'RWD',mass:1120,torque:980,peakRpm:6200,redline:8200,gears:[2.2,1.42,1],finalDrive:3.5,grip:1.65,drag:.3,area:1.95,frontBias:.43}),
 specialCar({id:'f-type-drag',displayName:'F-Type Drag Special',manufacturer:'Nitto Works',year:2004,price:350000,unlockWins:60,special:true,drivetrain:'RWD',mass:980,torque:1450,peakRpm:6800,redline:9000,gears:[1.95,1.18],finalDrive:3.25,grip:1.85,drag:.27,area:1.82,frontBias:.4}),
 specialCar({id:'funny-car',displayName:'Funny Car',manufacturer:'Nitto Works',year:2004,price:750000,unlockWins:100,special:true,drivetrain:'RWD',mass:1050,torque:2600,peakRpm:7200,redline:9500,gears:[1.65,1],finalDrive:3.1,grip:2.15,drag:.42,area:2.05,frontBias:.38}),
];
