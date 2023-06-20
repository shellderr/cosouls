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

function ButtonMenu({dataArr, clickCb, label='params'}){
	return(
		<div style={{margin: 6, marginLeft: 0}}>
		{dataArr.map((el, i)=>{
			return <button 
						onClick={clickCb} 
						value={i} 
						key={i} 
						style={{margin: 6}}
					>
					{label+'_'+i}
					</button>
		})}
		</div>
	);
}

function DisplayDriver({}){
	const [params, setParams] = useState({});	
	return(
		<div style={{width: '100vw'}}>
			<ButtonMenu 
				dataArr={test_params} 
				clickCb={e => setParams(test_params[+e.target.value])}
			/>
			<p>{JSON.stringify(params)}</p>
			<CosoulDisplay 
				resolution={[600,600]} 
				params={params}
			/>
		</div>
	);
}

export default function Wrapper(){
	const [view, setView] = useState(0);	
	return(
		<div style={{width: '100vw'}}>
			<ButtonMenu 
				dataArr={[0,1]} 
				clickCb={e=>setView(+e.target.value)}
				label="view"
			/>
			{view == 0 ? <DisplayDriver /> : <div>hi</div>}
		</div>
	);
} 
