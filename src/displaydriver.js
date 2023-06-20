import React, {useRef, useState, useMemo, useEffect} from 'react';
import {urlParams, jsonParams} from './mainparams.js';
import CosoulDisplay from './display.js';

const test_params = [
	{
		id: 'asdf5555',
		pgive: 2180
	},
	{
		id: 'qwer4444',
		pgive: 550
	},
	{
		id: 'fghj2222',
		pgive: 3000
	},
];

function ButtonMenu({dataArr, clickCb}){
	return(
		<div style={{margin: 6, marginLeft: 0}}>
		{dataArr.map((el, i)=>{
			return <button onClick={clickCb} value={i} key={i} style={{margin: 6}}>{'params_'+i}</button>
		})}
		</div>
	);
}

export default function DisplayDriver({}){
	const [params, setParams] = useState({});	
	return(
		<div style={{width: '100vw'}}>
			<ButtonMenu dataArr={test_params} clickCb={ e => setParams(test_params[+e.target.value]) }/>
			<p>{JSON.stringify(params)}</p>
			<CosoulDisplay params={params}/>
		</div>
	);
} 
