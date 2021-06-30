'use strict';

///////////////////////
////// VARIABLES //////
///////////////////////

// Elements
const BODY				= document.body;
const BUTTON			= document.getElementById('button');
const COLUMN			= document.getElementById('column');
const HOLDER			= document.getElementById('button-holder');
const MEASURE			= document.getElementById('measure');

const R					= document.getElementById('r');
const G					= document.getElementById('g');
const B					= document.getElementById('b');

const X					= 0;
const Y					= 1;

const CANVAS			= document.getElementById('canvas');
const CTX				= CANVAS.getContext('2d');

const COMMENTARYVOLUME	= document.getElementById('commentary');
const COMMENTARYEL		= document.createElement('audio');
COMMENTARYEL.autoplay	= true;
COMMENTARYEL.volume		= COMMENTARYVOLUME.value

var analogCenter		= [0, 0];
var analogRadius		= 0;
var target				= [0, 0];
var targetTarget		= [0, 0];
var analogReadDistance	= 0;

///////////////////////
////// FUNCTIONS //////
///////////////////////

function getCenter(){
	var buttonRect		= BUTTON.getBoundingClientRect();
	analogRadius		= buttonRect.width / 2;
	analogCenter[X]		= buttonRect.left	+ analogRadius;
	analogCenter[Y]		= buttonRect.top	+ analogRadius;
	analogReadDistance	= analogRadius * 1.4;
	
	CANVAS.width		= analogReadDistance * 2;
	CANVAS.height		= analogReadDistance * 2;
	
	// Required to copy values, not references
	target				= [ ...analogCenter];
	targetTarget		= [ ...analogCenter];
}

// Yes, I did shamelessly take code from StackOverflow, don't @ me I'm bad at maths: https://stackoverflow.com/a/9939071/5006449
function getPolygonCentroid(pts) {
	var first = pts[0], last = pts[pts.length-1];
	if (first[0] != last[0] || first[1] != last[1]) pts.push(first);
	var twicearea=0,
		x=0, y=0,
		nPts = pts.length,
		p1, p2, f;
	for ( var i=0, j=nPts-1 ; i<nPts ; j=i++ ) {
		p1 = pts[i]; p2 = pts[j];
		f = p1[0]*p2[1] - p2[0]*p1[1];
		twicearea += f;          
		x += ( p1[0] + p2[0] ) * f;
		y += ( p1[1] + p2[1] ) * f;
	}
	f = twicearea * 3;
	return [x/f, y/f];
}

function getMidpoint(pts){
	return [
		// X
		(pts[0][0] + pts[1][0])/2
		// Y
		,(pts[0][1] + pts[1][1])/2
	];
}

function getDistance(a,b){
	return Math.sqrt(a*a + b*b);
}

var buttonTransform = 'rotate3d(0,0,0,0deg) translate(0px,0px) scale(1)';
var columnTransform = 'rotate(0deg) scale(1,1) translate(0%,0%)';
var distanceFromTarget = 0;
var pressPosition = null;

// On moving a pointer
function move(event){
	// Don't register this if the menu's open
	if(document.getElementById('menu').style.display === 'block') return;
	
	// Get the position of pressing
	pressPosition = null;
	
	// Need to add support for multiple touches tho?
	if(event.touches){
		var touchPoints = [];
		
		// Get all the touches on the button and add them to the list
		for(var i = 0; i < event.touches.length; i ++){
			// Add the touch to the touchPoints list if it's on the button
			if(getDistance(event.touches[i].clientX - analogCenter[X], event.touches[i].clientY - analogCenter[Y]) <= analogRadius) touchPoints.push([event.touches[i].clientX,event.touches[i].clientY]);
		}
		
		// Get the centroid of the polygon- which, um, may be glitchy, but we'll see!
		if(touchPoints.length == 1)			pressPosition = touchPoints[0];
		else if(touchPoints.length == 2)	pressPosition = getMidpoint(touchPoints);
		else if(touchPoints.length > 2)		pressPosition = getPolygonCentroid(touchPoints);
	}
	// If it's clicking
	else{
		pressPosition = [event.clientX, event.clientY];
	}
}

var gamepadDefaultPosition = [0,0];

function getGamepadAxes(){
	var deadzone = 0;
	var maxDistance = 0.95;
	var gamepad = navigator.getGamepads()[0]; // TODO: track a specific gamepad
	
	if(gamepad == null)
		return null;
	
	return [gamepad.axes[0], gamepad.axes[1]];
}

function SetRange(value, min, max){
	if(value < min)
		return min;
	
	if(value > max)
		return max;
	
	return value;
}

var lastFrameTimestamp	= 0;
function onAnimationFrame(frameTimestamp){
	var sDeltaTime = (frameTimestamp - lastFrameTimestamp) / 1000;

	var distanceFromAnalogCenter = analogReadDistance + 1;
	var distanceFromTarget = distanceFromAnalogCenter;
	
	var analogStickPosition = null;
	var gamepadPosition = getGamepadAxes();
	if(gamepadPosition == null)
		analogStickPosition = pressPosition;
	else
		analogStickPosition = [
			analogCenter[X] + (gamepadPosition[X] * analogReadDistance),
			analogCenter[Y] + (gamepadPosition[Y] * analogReadDistance)
		];

	// Read cursor position, if it's set
	if(analogStickPosition != null)
		distanceFromAnalogCenter = getDistance(analogStickPosition[X] - analogCenter[X], analogStickPosition[Y] - analogCenter[Y]);
	
	// I WANT THIS IN JS
	var distance = Math.sqrt(a*a + b*b);  // TODO: get square root or fake it!
	
	buttonTransform = 'rotate3d(' + yAngle + ',' + xAngle + ',0,' + (distance * .7) + 'deg)';
	
	// Ripped from: https://stackoverflow.com/questions/15653801/rotating-object-to-face-mouse-pointer-on-mousemove
	var columnAngle = Math.atan2(analogStickPosition[X] - analogCenter[X], analogStickPosition[Y] - analogCenter[Y]) * (180 / Math.PI);
	
	columnTransform = 'rotate(' + (-columnAngle) + 'deg) scale(1, ' + (distanceFromAnalogCenter / analogRadius * .7) + ') translate(0%, ' + (distanceFromAnalogCenter / analogRadius * 85) + '%)';
	
	// If we are not doing anything with the ANALOG stick, then move it to base position
	/*
	else
	{
		buttonTransform = 'rotate3d(0,0,0,0deg) translate(0px,0px) scale(1)';
		columnTransform = 'rotate(0deg) scale(1,1) translate(0%,0%)';
	}
	*/
	
	// Update styles
	BUTTON.style.transform = buttonTransform;
	COLUMN.style.transform = columnTransform;
	
	// Update targetTarget if it's moved too close
	while(getDistance(target[X] - targetTarget[X], target[Y] - targetTarget[Y]) < 3){
	// https://stackoverflow.com/questions/12959237/get-point-coordinates-based-on-direction-and-distance-vector
		var positionOut = Math.random() * analogReadDistance;
		var angle = Math.random() * 360;
		targetTarget[X] = analogCenter[X] + Math.cos(angle) * positionOut;
		targetTarget[Y] = analogCenter[Y] + Math.sin(angle) * positionOut;
	}
	
	WASM.loop(sDeltaTime);
	
	//////////////
	//// DRAW ////
	//////////////
	
	CTX.clearRect(0,0,CANVAS.width,CANVAS.height);
	
	// Line positions
	CTX.fillStyle = 'red';
	for(var e = 0; e < maxPoints; ++ e){
		if(eTargetPositionsX[e] > 0)
		{
			// Draw the target and current player position on the canvas
			CTX.beginPath();
			CTX.arc(
				eTargetPositionsX[e]
				,eTargetPositionsY[e]
				,CANVAS.width / 75
				,0
				,2 * Math.PI
			);
			CTX.fill();
		}
	}
	
	// Draw the target and current player position on the canvas
	CTX.beginPath();
	CTX.arc(
		target[X] - analogCenter[X] + (CANVAS.width / 2)
		,target[Y] - analogCenter[Y] + (CANVAS.height / 2)
		,CANVAS.width / 15
		,0
		,2 * Math.PI
	);
	CTX.fill();
	
	// Player positions
	for(var e = 0; e < maxPoints; ++ e){
		if(ePlayerPositionsX[e] > 0)
		{
			CTX.fillStyle = 'green';
			// Draw the target and current player position on the canvas
			CTX.beginPath();
			CTX.arc(
				ePlayerPositionsX[e]
				,ePlayerPositionsY[e]
				,CANVAS.width / 75
				,0
				,2 * Math.PI
			);
			CTX.fill();
		}
	}
	
	if(analogStickPosition != null)
	{
		CTX.fillStyle = 'green';
		// Draw the target and current player position on the canvas
		CTX.beginPath();
		CTX.arc(
			analogStickPosition[X] - analogCenter[X] + (CANVAS.width / 2)
			,analogStickPosition[Y] - analogCenter[Y] + (CANVAS.height / 2)
			,CANVAS.width / 25
			,0
			,2 * Math.PI
		);
		CTX.fill();
	}
	
	// How much are we succeeding- err, failing?
	var percentFromTarget = Math.floor((1 - distanceFromTarget / analogRadius) * 100);
	if(percentFromTarget > 100)
		percentFromTarget = 100;
	
	if(percentFromTarget < 0)
		percentFromTarget = 0;
	
	//>>-- ACCURACY -->//
	var count = 0;
	for(var e = 0; e < maxPoints; ++ e){
		count += Math.abs(eTargetPositionsX[e] - ePlayerPositionsX[e]);
	}
	
	var average = count / maxPoints;
	MEASURE.innerHTML = 'IMPERFECTION RATING:<br>' + ((Math.round(average * 100)) / 100);
	
	lastFrameTimestamp = frameTimestamp;
	window.requestAnimationFrame(onAnimationFrame);
}

// Check for gamepad input
var gamepadInput = false;

setInterval(function(){
	// Get the first gamepad, if gamepads are connected
	var gamepads = navigator.getGamepads();
	if(gamepads[0]){
		// Only reads button 0, which should be the primary one on most controllers
		if(gamepadInput === false && gamepads[0].buttons[0].pressed){
			gamepadInput = true;
			//press({gamepad:true});
		} else if(gamepadInput === true && !gamepads[0].buttons[0].pressed){
			gamepadInput = false;
			//unpress({gamepad:true});
		}
		
		
	}
},16);

/// SET COLOR ///
function setColor(passedColor = null){
	// If a value was passed, we update the forms with it
	if(passedColor !== null){
		var values = passedColor.split(',');
		R.value = values[0];
		G.value = values[1];
		B.value = values[2];
	}
	
	BUTTON.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.4))';
	//BUTTON.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.4)), radial-gradient(circle, rgba(0,0,0,0) 20%, rgba(0,0,0,.4) 25%, rgba(0,0,0,0) 30%)';
	
	var columnDarkness = 40;
	var columnDarknessTop = 60;
	COLUMN.style.background = 'linear-gradient(rgba(' + (R.value - columnDarkness) + ',' + (G.value - columnDarkness) + ',' + (B.value - columnDarkness) + ',0), rgba(' + (R.value - columnDarkness) + ',' + (G.value - columnDarkness) + ',' + (B.value - columnDarkness) + ',0) 20%, rgba(' + (R.value - columnDarkness) + ',' + (G.value - columnDarkness) + ',' + (B.value - columnDarkness) + ',1) 30%, rgba(' + (R.value - columnDarknessTop) + ',' + (G.value - columnDarknessTop) + ',' + (B.value - columnDarknessTop) + ',1) 100%)';
	
	HOLDER.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') radial-gradient(rgba(0, 0, 0, .1), rgba(0, 0, 0, .25) 60%, rgba(0, 0, 0, .9) 63%, #b1b1b1 50%)';
	
	// Change the favicon's color
	var canvas				= document.createElement('canvas');
	canvas.width			= 64;
	canvas.height			= 64;
	
	var ctx					= canvas.getContext('2d');
	
	// Outer gray
	ctx.fillStyle			= '#bfbfbf';
	ctx.beginPath();
	ctx.arc(32,32,32,0,Math.PI * 2);
	ctx.fill();
	
	// Inner button
	ctx.fillStyle			= 'rgb(' + R.value + ',' + G.value + ',' + B.value + ')';
	ctx.beginPath();
	ctx.arc(32,32,25,0,Math.PI * 2);
	ctx.fill();
	
	var gradient			= ctx.createLinearGradient(32,0,32,64);
	gradient.addColorStop(0,'rgba(0,0,0,0)');
	gradient.addColorStop(1,'rgba(0,0,0,.4)');
	
	ctx.fillStyle			= gradient;
	ctx.beginPath();
	ctx.arc(32,32,25,0,Math.PI * 2);
	ctx.fill();
	
	canvas.toBlob(function(blob){
		document.getElementById('dynamic-favicon').href = URL.createObjectURL(blob);
	});
}

document.getElementById('menu-button').addEventListener('click',function(){
	document.getElementById('menu').style.display = (document.getElementById('menu').style.display === 'block') ? 'none' : 'block';
});

document.getElementById('menu-close-button').addEventListener('click',function(){
	document.getElementById('menu').style.display = 'none';
});

///////////////////////
/// EVENT LISTENERS ///
///////////////////////

// Adjust button data when we change the window's size, etc (so that the center stays correct)
window.addEventListener('resize',getCenter);

window.addEventListener('mousemove',move);
window.addEventListener('touchmove',move,{passive:false});

// Colors
R.addEventListener('input',function(){setColor();});
G.addEventListener('input',function(){setColor();});
B.addEventListener('input',function(){setColor();});

COMMENTARYVOLUME.addEventListener('input',function(event){
	COMMENTARYEL.volume = COMMENTARYVOLUME.value;
});

///////////////////////
//////// START ////////
///////////////////////

var WASM = null;
var ePlayerPositionsX = null;
var ePlayerPositionsY = null;
var eTargetPositionsX = null;
var eTargetPositionsY = null;
var maxPoints = 1024;

//obj.instance.exports.loop((frameTimestamp - lastFrameTimestamp) / 1000);

(function(){
	getCenter();
	setColor();
	
	fetch('script.wasm',{headers:{'Content-Type':'application/wasm'}}).then(response => response.arrayBuffer()).then(bits => WebAssembly.instantiate(bits)).then(obj => {
		WASM = obj.instance.exports;
		
		ePlayerPositionsX		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.ePlayerPositionsX.value,maxPoints);
		ePlayerPositionsY		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.ePlayerPositionsY.value,maxPoints);
		eTargetPositionsX		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.eTargetPositionsX.value,maxPoints);
		eTargetPositionsY		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.eTargetPositionsY.value,maxPoints);
	
		window.requestAnimationFrame(onAnimationFrame);
	});
	
})();