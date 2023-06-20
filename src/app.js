import {createRoot} from 'react-dom/client';
import React, {useState, memo} from 'react';
import Display from './displaydriver.js';


function App(){	
	return <Display />;
} 

const root = createRoot(document.getElementById('root'));
root.render(<App/>);