import React, {useRef, useState, useMemo, useEffect} from 'react';
import {urlParams, jsonParams, genParamsObj} from './mainparams.js';
import initDisplay from './initdisplay.js';

var glview = undefined;

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
			if(!window.initGuard){
				console.log('INIT');
				let p = genParamsObj(params);
				glview = initDisplay(fgRef.current, bgRef.current, resolution, p);
				window.initGuard = true;
			}else{
				console.log('2nd init attempted');
			}
		}
	},[]);

	// on params
	useEffect(()=>{
		if(glview){
			let p = genParamsObj(params);
			glview.setParams(p, true);
		}
	},[params]);

	return(
		<div>
		{useMemo(()=>{return(
			<div style={{position: 'relative'}}>
				<canvas ref={fgRef} style={{...cstyle, zIndex: 1}}></canvas>
				<canvas ref={bgRef} style={{...cstyle, zIndex: 0}}></canvas>
			</div>
		)},[])}
		</div>
	);
};