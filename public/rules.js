const arr = [

{	
	name: 'rule1',
	axiom: 'F+F+F+F',
	theta: 90,
	F:'F+F-F-FF+F+F-F'
}
,
{
	name: 'rule2',
	axiom: 'X',
	theta: 24,
	delta: 5,
	F:'FF',
	X: 'F-[[X]+X]+F[+FX]-X'
}
,
{
	name: 'rule3',
	axiom: 'F',
	theta: 28,
	delta: 9,
	F: 'FF+[+F-F-F]-[-F+F+F]'
}
,
{
	name: 'rule4',
	axiom: 'VZFFF',
	theta: 20,
	V: '[+++W][---W]YV',
	W: '+X[-W]Z',
	X: '-W[+X]Z',
	Y: 'YZ',
	Z: '[-FFF][+FFF]F'
}
,
{
	name: 'rule5',
	axiom: 'F',
	theta: 60,
	delta: 5,
	F: 'FF-[XY]+[XY]',
	X: '+FY',
	Y: '-FX'
}
,
{
	name: 'rule6',
	axiom: 'X',
	theta: 90,
	delta: 10,
	X:'^\\XF^\\XFX-F^//XFX&F+//XFX-F/X-/'
}
,
{
	axiom: 'F',
	theta: 60,
	delta: 5,
	F: ['FF-[XY]+[XY]', 'FYF-[XY]+[--XY]'],
	// X: '+F++++++Y',
	X: ['+F++++++Y', '+F++Y'],
	Y: ['-FX', '-FXX']
}
,
{
	axiom: 'F',
	theta: 30,
	delta: 5,
	F: 'FF-[FY]+[XY]',
	X: '+F--Y',
	Y: 'Y-Y'
}
,
{
	axiom: 'F',
	theta: 40,
	delta: 5,
	F: 'FF-[XY]+[XY]',
	X: '+F+--X+Y',
	Y: '-FX'
}

];

export default arr;