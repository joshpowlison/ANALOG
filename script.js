'use strict';

///////////////////////
////// CONSTANTS //////
///////////////////////

// Elements
const BODY				= document.body;
const BUTTON			= document.getElementById('button');
const BUTTON_COLOR		= document.getElementById('button-coloration');
const COLUMN			= document.getElementById('column');
const COLUMN_COLOR		= document.getElementById('column-coloration');
const HOLDER			= document.getElementById('button-holder');
const HOLDER_COLOR		= document.getElementById('button-holder-coloration');
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
COMMENTARYEL.src		= 'assets/commentary.mp3';

// C99 Constants
const SETTING_ANALOG_READ_DISTANCE	= 0;
const SETTING_ANALOG_RADIUS			= 1;
const SETTING_X_ANGLE				= 2;
const SETTING_Y_ANGLE				= 3;
const SETTING_DISTANCE_FROM_TARGET	= 4;
const SETTING_DISTANCE				= 5;
const SETTING_A						= 6;
const SETTING_B						= 7;

const SCORE_COMMENTARY_START		= 50;

///////////////////////
////// VARIABLES //////
///////////////////////

var analogCenter			= [0, 0];
var pressPosition			= [0, 0];
var target					= [0, 0];
var targetTarget			= [0, 0];
var settings				= null;
var score					= 0;
var gamepadDefaultPosition	= [0,0];
var lastFrameTimestamp		= 0;
var gamepadInput			= false;
var commentaryMaxDistance	= 60;
var minScore				= null;
var playedThrough			= false;

// WASM Values
var WASM					= null;
var ePlayerPositionsX		= null;
var ePlayerPositionsY		= null;
var eTargetPositionsX		= null;
var eTargetPositionsY		= null;
var maxPoints				= 1024;

///////////////////////
////// FUNCTIONS //////
///////////////////////

function getCenter(){
	var buttonRect		= BUTTON.getBoundingClientRect();
	settings[SETTING_ANALOG_RADIUS]		= buttonRect.width / 2;
	settings[SETTING_ANALOG_READ_DISTANCE]	= settings[SETTING_ANALOG_RADIUS] * 1.4;
	
	CANVAS.width		= settings[SETTING_ANALOG_READ_DISTANCE] * 2;
	CANVAS.height		= settings[SETTING_ANALOG_READ_DISTANCE] * 2;
	
	analogCenter[X]		= buttonRect.left	+ settings[SETTING_ANALOG_RADIUS];
	analogCenter[Y]		= buttonRect.top	+ settings[SETTING_ANALOG_RADIUS];
	target[X]			= analogCenter[X];
	target[Y]			= analogCenter[Y];
	targetTarget[X]		= analogCenter[X];
	targetTarget[Y]		= analogCenter[Y];
	
	pressPosition = analogCenter;
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

// On moving a pointer
function move(event){
	// Don't register this if the menu's open
	if(document.getElementById('menu').style.display === 'block') return;
	
	// Get the position of pressing
	pressPosition = [0,0];
	
	// Need to add support for multiple touches tho?
	if(event.touches){
		var touchPoints = [];
		
		// Get all the touches on the button and add them to the list
		for(var i = 0; i < event.touches.length; i ++){
			// Add the touch to the touchPoints list if it's on the button
			if(getDistance(event.touches[i].clientX - analogCenter[X], event.touches[i].clientY - analogCenter[Y]) <= settings[SETTING_ANALOG_READ_DISTANCE])
				touchPoints.push([event.touches[i].clientX,event.touches[i].clientY]);
		}
		
		// Get the centroid of the polygon- which, um, may be glitchy, but we'll see!
		if(touchPoints.length == 1)			pressPosition = touchPoints[0];
		else if(touchPoints.length == 2)	pressPosition = getMidpoint(touchPoints);
		else if(touchPoints.length > 2)		pressPosition = getPolygonCentroid(touchPoints);
		
		// If we're touching the analog stick, then don't scroll
		if(touchPoints.length > 0 && event.type == 'touchmove')
			event.preventDefault();
	}
	// If it's clicking
	else{
		pressPosition = [event.clientX, event.clientY];
	}
	
	// Set pressPosition to the center if we're far off it (the center)
	var distanceFromAnalogCenter = getDistance(pressPosition[X] - analogCenter[X], pressPosition[Y] - analogCenter[Y]);
	
	console.log(event);
	// If the cursor is not in position, set the pressing position to nothing!
	if(settings == null
		|| (event.type == 'touchend' && !event.touches)
		|| distanceFromAnalogCenter > settings[SETTING_ANALOG_READ_DISTANCE]
	)
		pressPosition = analogCenter;
}

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

function onAnimationFrame(frameTimestamp){
	var sDeltaTime = (frameTimestamp - lastFrameTimestamp) / 1000;

	var distanceFromAnalogCenter = settings[SETTING_ANALOG_READ_DISTANCE] + 1;
	var distanceFromTarget = distanceFromAnalogCenter;
	
	var analogStickPosition = null;
	var gamepadPosition = getGamepadAxes();
	if(gamepadPosition == null)
		analogStickPosition = pressPosition;
	else
		analogStickPosition = [
			analogCenter[X] + (gamepadPosition[X] * settings[SETTING_ANALOG_READ_DISTANCE]),
			analogCenter[Y] + (gamepadPosition[Y] * settings[SETTING_ANALOG_READ_DISTANCE])
		];

	distanceFromAnalogCenter = getDistance(analogStickPosition[X] - analogCenter[X], analogStickPosition[Y] - analogCenter[Y]);
	
	var buttonTransform, columnTransform;
	
	// Read cursor position, if it's set
	if(gamepadPosition != null || (analogStickPosition != null && distanceFromAnalogCenter <= settings[SETTING_ANALOG_READ_DISTANCE])){
	
		WASM.processMovement(sDeltaTime, analogStickPosition[X], analogStickPosition[Y]);
		
		// Ripped from: https://stackoverflow.com/questions/15653801/rotating-object-to-face-mouse-pointer-on-mousemove
		var columnAngle = Math.atan2(analogStickPosition[X] - analogCenter[X], analogStickPosition[Y] - analogCenter[Y]) * (180 / Math.PI);
		
		var translateY = (distanceFromAnalogCenter / settings[SETTING_ANALOG_RADIUS] * 85);
		if(translateY > settings[SETTING_ANALOG_RADIUS] * 1.15)
			translateY = settings[SETTING_ANALOG_RADIUS] * 1.15;
		
		// Move items in "3D space"
		buttonTransform = 'rotate3d(' + settings[SETTING_Y_ANGLE] + ',' + settings[SETTING_X_ANGLE] + ',0,' + (settings[SETTING_DISTANCE] * .7) + 'deg)';
		columnTransform = 'rotate(' + (-columnAngle) + 'deg) scale(1, ' + (distanceFromAnalogCenter / settings[SETTING_ANALOG_RADIUS] * .7) + ') translate(0%, ' + translateY + '%)';
		
		// If we are not doing anything with the ANALOG stick, then move it to base position
	}
	else
	{
		buttonTransform = 'rotate3d(0,0,0,0deg) translate(0px,0px) scale(1)';
		columnTransform = 'rotate(0deg) scale(1,1) translate(0%,0%)';
	}
	
	WASM.updatePoints(sDeltaTime, analogStickPosition[X], analogStickPosition[Y]);
	
	// Update styles
	BUTTON.style.transform = buttonTransform;
	COLUMN.style.transform = columnTransform;
	
	// More precise to move within full circle
	// Update targetTarget if it's moved too close
	/*while(getDistance(target[X] - targetTarget[X], target[Y] - targetTarget[Y]) < 3){
	// https://stackoverflow.com/questions/12959237/get-point-coordinates-based-on-direction-and-distance-vector
		var positionOut = Math.random() * settings[SETTING_ANALOG_READ_DISTANCE];
		var angle = Math.random() * 360;
		targetTarget[X] = analogCenter[X] + Math.cos(angle) * positionOut;
		targetTarget[Y] = analogCenter[Y] + Math.sin(angle) * positionOut;
	}*/
	
	// If we have a lower average score, save it!
	if(eTargetPositionsX[maxPoints - 1] != 0)
		if(minScore == null || minScore > score)
			minScore = score;
	
	// Try playing more developer commentary if we have unlocked more
	checkDeveloperCommentary();
	
	//////////////
	//// DRAW ////
	//////////////
	
	CTX.clearRect(0,0,CANVAS.width,CANVAS.height);
	
	// Line positions
	CTX.fillStyle = 'rgba(255,0,0.5)';
	for(var e = 0; e < maxPoints; ++ e){
		if(eTargetPositionsX[e] > 0)
		{
			// Draw the target and current player position on the canvas
			CTX.beginPath();
			CTX.arc(
				eTargetPositionsX[e] - analogCenter[X] + (CANVAS.width / 2)
				,eTargetPositionsY[e] - analogCenter[Y] + (CANVAS.height / 2)
				,CANVAS.width / 75
				,0
				,2 * Math.PI
			);
			CTX.fill();
		}
	}
	
	// Draw the target and current player position on the canvas
	CTX.fillStyle = 'red';
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
	CTX.fillStyle = 'rgba(0,128,0,.5)';
	for(var e = 0; e < maxPoints; ++ e){
		if(ePlayerPositionsX[e] > 0)
		{
			// Draw the target and current player position on the canvas
			CTX.beginPath();
			CTX.arc(
				ePlayerPositionsX[e] - analogCenter[X] + (CANVAS.width / 2)
				,ePlayerPositionsY[e] - analogCenter[Y] + (CANVAS.height / 2)
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
	var percentFromTarget = Math.floor((1 - distanceFromTarget / settings[SETTING_ANALOG_RADIUS]) * 100);
	if(percentFromTarget > 100)
		percentFromTarget = 100;
	
	if(percentFromTarget < 0)
		percentFromTarget = 0;
	
	//>>-- ACCURACY -->//
	var count = 0;
	for(var e = 0; e < maxPoints; ++ e){
		count += Math.abs(eTargetPositionsX[e] - ePlayerPositionsX[e]);
	}
	
	score = count / maxPoints;
	
	var html = '<strong>IMPERFECTION RATING</strong><br>' + padDecimal(score) + '<br><strong>MIN SCORE</strong><br>' + ((minScore != null) ? padDecimal(minScore) : 'Will score once trail is longer...');
	
	MEASURE.innerHTML = html;
	
	lastFrameTimestamp = frameTimestamp;
	window.requestAnimationFrame(onAnimationFrame);
}

function padDecimal(value){
	value = ((Math.round(value * 100)) / 100);
	
	var decimal = String(value).split('.');
	var display = decimal[0].padStart(3,'0') + '.' + (decimal.length == 1 ? '0' : decimal[1]).padEnd(2,'0');
	
	return display;
}

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
	
	BUTTON_COLOR.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.4))';
	
	var columnDarkness = 40;
	var columnDarknessTop = 60;
	COLUMN_COLOR.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.4))';
	
	HOLDER_COLOR.style.background = 'rgb(' + R.value + ',' + G.value + ',' + B.value + ') linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.4))';
	
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

function checkDeveloperCommentary(){
	if(COMMENTARYVOLUME.value == 0)
		return;
	
	if(playedThrough)
		return;
	
	var newDistance = 0;
	
	// If we have a higher average score, play more commentary!
	if(minScore != null)
		newDistance = COMMENTARYEL.duration * (1 - (minScore / SCORE_COMMENTARY_START));
	
	if(newDistance > commentaryMaxDistance)
		commentaryMaxDistance = newDistance;
	
	// If we've gone further than score threshold, increase the commentary max distance
	
	if(COMMENTARYEL.currentTime <= commentaryMaxDistance)
		COMMENTARYEL.play();
	else
		COMMENTARYEL.pause();
}

///////////////////////
/// EVENT LISTENERS ///
///////////////////////

// Adjust button data when we change the window's size, etc (so that the center stays correct)
window.addEventListener('resize',getCenter);

window.addEventListener('mousemove',move);
window.addEventListener('touchstart',move);
window.addEventListener('touchend',move);
window.addEventListener('touchmove',move,{passive:false});

// Colors
R.addEventListener('input',function(){setColor();});
G.addEventListener('input',function(){setColor();});
B.addEventListener('input',function(){setColor();});

document.getElementById('menu-button').addEventListener('click',function(){
	document.getElementById('menu').style.display = (document.getElementById('menu').style.display === 'block') ? 'none' : 'block';
});

document.getElementById('menu-close-button').addEventListener('click',function(){
	document.getElementById('menu').style.display = 'none';
});

COMMENTARYVOLUME.addEventListener('input',function(event){
	COMMENTARYEL.volume = COMMENTARYVOLUME.value;
	
	// If we've set the volume to 0, pause the commentary
	if(COMMENTARYVOLUME.value == 0)
		COMMENTARYEL.pause();
	// If we've surpassed it, play it
	else
		checkDeveloperCommentary();
});

COMMENTARYEL.addEventListener('ended',function(event){
	playedThrough = true;
});

///////////////////////
//////// START ////////
///////////////////////

(function(){
	setColor();
	
	fetch('script.wasm',{headers:{'Content-Type':'application/wasm'}}).then(response => response.arrayBuffer()).then(bits => WebAssembly.instantiate(bits)).then(obj => {
		WASM = obj.instance.exports;
		
		ePlayerPositionsX		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.ePlayerPositionsX.value,maxPoints);
		ePlayerPositionsY		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.ePlayerPositionsY.value,maxPoints);
		eTargetPositionsX		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.eTargetPositionsX.value,maxPoints);
		eTargetPositionsY		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.eTargetPositionsY.value,maxPoints);
		
		target			= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.target.value,2);
		targetTarget	= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.targetTarget.value,2);

		analogCenter	= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.analogCenter.value,2);
		
		settings		= new Float32Array(obj.instance.exports.memory.buffer,obj.instance.exports.settings.value,20);
	
		getCenter();
		
		window.requestAnimationFrame(onAnimationFrame);
	});
	
})();