import {useEffect,useRef,useState} from 'react';
import type {Appearance} from '@nitto/game-core';
import {renderCivicToCanvas} from './civicCompositor.js';

export function CivicLayeredPortrait({appearance,className=''}:{appearance:Appearance;className?:string}){
  const canvasRef=useRef<HTMLCanvasElement>(null);const [ready,setReady]=useState(false);
  useEffect(()=>{let current=true;const canvas=canvasRef.current;if(!canvas)return;setReady(false);void renderCivicToCanvas(canvas,'garage',appearance).then(()=>current&&setReady(true));return()=>{current=false;};},[appearance]);
  return <div className={`garage-car-art layered-car-portrait${ready?' layered-car-portrait--ready':''} ${className}`} aria-label="Customised Honda Civic preview"><canvas ref={canvasRef} width={768} height={512}/></div>;
}

