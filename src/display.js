import React, {useRef, useState, useMemo, useEffect} from 'react';
import {urlParams, jsonParams, genParamsObj} from './mainparams.js';
import initDisplay from './initdisplay.js';

var glview = undefined;
const animate = true; // <keep this locked to true for now.
const useGui = true;

export default function Display({resolution=[500,500], params={}}){
	const cstyle = {
		position: 'absolute', 
		width: resolution[0], 
		height: resolution[1], 
		left: 0, 
		top: 0
	};
	
	const fgRef = useRef(null);
	const bgRef = useRef(null);

	// on init
	useEffect(()=>{
		if(fgRef.current && bgRef.current){
			let p = genParamsObj(params);
			glview = initDisplay(fgRef.current, bgRef.current, resolution, p, useGui);
		}
		return ()=>{
			glview.stop();
		}
	},[]);

	// on params
	useEffect(()=>{
		if(glview){
			let p = genParamsObj(params);
			glview.setParams(p, animate);
		}
	},[params]);

	return(
		<div>
			<div style={{position: 'relative'}}>
				<canvas ref={fgRef} style={{...cstyle, zIndex: 1}}></canvas>
				<canvas ref={bgRef} style={{...cstyle, zIndex: 0}}></canvas>
			</div>
		</div>
	);
};