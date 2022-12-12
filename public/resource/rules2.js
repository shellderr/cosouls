const arr = [

{	
	name: 'rule1',
	axiom: 'F+F+F+F',
	theta: 60,
	delta: 8,
	F:'F+FXX--F-[XFF+F+F]-F',
	X:'-FFX+F[X+FF-F+]'
},
{	
	name: 'rule2',
	axiom: 'X++F',
	theta: 60,
	delta: 7,
	F: ['F++X-F', '-XX+F', '+XF+'],
	X:['-FFXF[X+FF-F+]', '-FF[X+XX]-F']
},
{	
	name: 'rule3',
	axiom: 'X++F',
	theta: 45,
	delta: 7,
	F: ['+X-F', '-XX+F', '+XF+'],
	X:['-FFXF[X+FF-F+]', '-FF[X+XX]-F']
},

{
	theta: 45,
	delta: 12,
    axiom: "[X]++[X]++[X]++[X]++[X]",
    W: "YF++ZF-XF[-YF-WF]++",
    X: ["+YF--[Z+XF]+", "+YF--[FX]+"],
    Y: "-WF++XF[++YF+ZF]-",
    Z: ["--WF[+ZF++XF]--XF", "--WF[+ZF]--XWF"],
},
{
	theta: 36,
	delta: 20,
    axiom:'+WF--XF---YF--ZF',
    F: '',
	W: 'YF++ZF----XF[-YF----WF]++',
	X: '+YF--ZF[---WF--XF]+',
	Y: '-WF++XF[+++YF++ZF]-',
	Z: '--YF++++WF[+ZF++++XF]--XF'
},
{
	theta: 45,
	delta: 10,
	axiom: '+WF--YF--ZF',
	W: 'YF++ZF----XF[-YF----WF]++',
	X: '+YF--ZF[---WF--XF]+',
	Y: ['-WF++XF[+++YF++ZF]-', '+XF[YFZF]-', 'XX-F'],
	Z: '--YF++++WF[+ZF++++XF]--XF',
	F: 'FF'
}
,
{
	theta: 36,
	delta: 10,
    axiom:'+WF--XF---YF--ZF',
    F: 'FF',
	W: ['YF++ZF----XF[+++]++', 'YF++ZF----XF[-YF----WF]++'],
	X: '+YF--ZF[---WF--XF]+',
	Y: ['-WF++XF[+++YF++ZF]-', '-XY[F++F]'],
	Z: '--YF++++WF[+ZF++++XF]--XF'
},
{
	theta: 60,
	delta: 10,
    axiom:'+WF--XF---YF--ZF',
    F: 'FF',
	W: ['YF++ZF----XF[+++]++', 'YF++ZF----XF[-YF----WF]++'],
	X: '+YF--ZF[---WF--XF]+',
	Y: ['-WF++XF[+++YF++ZF]-', '-XY[F++F]'],
	Z: '--YF++++WF[+ZF++++XF]--XF'
},
{
	theta: 60,
	delta: 10,
    axiom:'+WfXF--YF--ZF',
    F: 'F',
	W: ['YF++ZF--X[F++]Y'],
	X: '+YF--ZF[---WF--XF]+',
	Y: ['-WF++FF[+FF++ZF]-'],
	Z: ['--YFF-WF[+ZF++++XF]--XF', '--YFF--FWF[F++++XF]--XF']
},
{
	theta: 36,
	delta: 10,
    axiom:'[N]++[N]++[N]++[N]++[N]',
	M: 'OF++PF----NF[-OF----MF]++',
	N: '+OF--PF[---MF--NF]+',
	O: '-MF++NF[+++OF++PF]-',
	P: '--OF++++MF[+PF++++NF]--NF',
	F: ''
},
{
	theta: 45,
	delta: 18,
    axiom:'[N]FF++[N]-P',
	M: ['O[-OF----MF]++', 'OFF+'],
	N: '+OF--PF[---MF--NF]+',
	O: ['-MF++NF[+++OF++PF]-', '-MF++NF[+++OF++PF]-'],
	P: ['--OF++++MF[+PFF++++NF]--NF', '--OF++++MNF[+PF++++NF]--NF'],
},
{
	theta: 45,
	delta: 14,
    axiom:'[N]++[N]++[N]++[N]++[N]',
	M: ['OF++PF----NF[-OF----MF]++', 'OF++PF-NF[-OF----MF]++'],
	N: '+OF--PF[---MF--NF]+',
	O: ['-MF++NF[+++OF++PF]-', 'M+NF-'],
	P: '--OF++++MF[+PF++++NF]--NF',
	F: ['','FF','M']
},

{
	theta: 16,
	delta: 12,
	axiom: 'FXFXFX',
	F: '',
	X: ['[FX-FY][-FX-FY-FX][ZZ]-FY-FX+FY+FX', '[FX-FY]-FF+FY+FX'],
	Y: 'FY',
	Z: '-FX-FY-FX'
},
{
	theta: 45,
	delta: 6,
	axiom: 'F',
	// F: 'F[+FF]F[-FF]F'
	F: ['F[+FF]F[-FF]F', 'FF[+FF]F[-FFF]', 'F[+FFF]Z[-FF]F', 'F[+FFF]Z[-FF]F'],
	Z: ['', '-', 'F[ZF]-']
}

];

export default arr;