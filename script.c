#include "utility.c"

///////////////////////
////// CONSTANTS //////
///////////////////////

const int X = 0;
const int Y = 1;
const int maxPoints = 1024;

const int SETTING_ANALOG_READ_DISTANCE	= 0;
const int SETTING_ANALOG_RADIUS			= 1;
const int SETTING_X_ANGLE				= 2;
const int SETTING_Y_ANGLE				= 3;
const int SETTING_DISTANCE_FROM_TARGET	= 4;
const int SETTING_DISTANCE				= 5;
const int SETTING_A						= 6;
const int SETTING_B						= 7;

///////////////////////
////// VARIABLES //////
///////////////////////

float ePlayerPositionsX[1024];
float ePlayerPositionsY[1024];
float eTargetPositionsX[1024];
float eTargetPositionsY[1024];

float target[2];
float targetTarget[2];

float settings[20];

float CANVAS_WIDTH = 100;
float CANVAS_HEIGHT = 100;

float lastPointDelay = 0;
float pointDelay = 60.0f / (float)maxPoints;
int currentPoint = 0;

float analogCenter[2];

///////////////////////
////// LIBRARIES //////
///////////////////////

void loop(float sDeltaTime, float analogStickPositionX, float analogStickPositionY, float distanceFromAnalogCenter)
{
	float analogStickPosition[2] = {analogStickPositionX, analogStickPositionY};
	
	rng();
	
	int gamepadExists = 0;
	//float distanceFromAnalogCenter = settings[SETTING_ANALOG_READ_DISTANCE] + 1;
	float distanceFromTarget = distanceFromAnalogCenter;
	
	// If the button is being targeted at all by the movement, angle it
	if(gamepadExists == 1 || distanceFromAnalogCenter <= settings[SETTING_ANALOG_READ_DISTANCE])
	{
		// Set button rotation angle
		// rotate3d(rotate left, rotate up, LEAVE 0, strongest amount)
		float xAngle = (analogStickPosition[X] - analogCenter[X]) / settings[SETTING_ANALOG_RADIUS];
		float yAngle = (analogStickPosition[Y] - analogCenter[Y]) / settings[SETTING_ANALOG_RADIUS] * -1;
		
		// Distance
		float a = analogStickPosition[X] - analogCenter[X];
		float b = analogStickPosition[Y] - analogCenter[Y];
		
		settings[SETTING_X_ANGLE] = xAngle;
		settings[SETTING_Y_ANGLE] = yAngle;
		
		settings[SETTING_DISTANCE] = getSquareRoot(a * a + b * b);
		
		// Update info
		distanceFromTarget = getDistance(analogStickPosition[X] - target[X], analogStickPosition[Y] - target[Y]);
		
		settings[SETTING_DISTANCE_FROM_TARGET] = distanceFromTarget;
	}
	
	if(getDistance(target[X] - targetTarget[X], target[Y] - targetTarget[Y]) < 3){
	// https://stackoverflow.com/questions/12959237/get-point-coordinates-based-on-direction-and-distance-vector
		/*var positionOut = Math.random() * settings[SETTING_ANALOG_READ_DISTANCE];
		var angle = Math.random() * 360;
		targetTarget[X] = analogCenter[X] + Math.cos(angle) * positionOut;
		targetTarget[Y] = analogCenter[Y] + Math.sin(angle) * positionOut;*/
		
		float positionOut = rng() * settings[SETTING_ANALOG_READ_DISTANCE];
		float angle = rng() * 360.0f;
		
		float padding = settings[SETTING_ANALOG_READ_DISTANCE] * 0.8f;
		
		targetTarget[X] = (analogCenter[X] - padding) + (rng() * padding * 2.0f);
		targetTarget[Y] = (analogCenter[Y] - padding) + (rng() * padding * 2.0f);
		/*targetTarget[X] = analogCenter[X] + Math.cos(angle) * positionOut;
		targetTarget[Y] = analogCenter[Y] + Math.sin(angle) * positionOut;*/
	}
	
	// Move target before updating info- then it's IMPOSSIBLE to be perfect
	float moveRelative[2] = {0, 0};
	moveRelative[X] = targetTarget[X] - target[X];
	moveRelative[Y] = targetTarget[Y] - target[Y];
	
	if(getAbsFloat(moveRelative[X]) > 3.0f)
		moveRelative[X] *= 0.5f * sDeltaTime;
	
	if(getAbsFloat(moveRelative[Y]) > 3.0f)
		moveRelative[Y] *= 0.5f * sDeltaTime;
	
	target[X] += moveRelative[X];
	target[Y] += moveRelative[Y];
	
	// Update points
	lastPointDelay -= sDeltaTime;
	if(lastPointDelay <= 0){
		lastPointDelay += pointDelay;
		
		// Line Points
		//eTargetPositionsX[currentPoint] = target[X] - analogCenter[X] + (CANVAS_WIDTH / 2);
		//eTargetPositionsY[currentPoint] = target[Y] - analogCenter[Y] + (CANVAS_HEIGHT / 2);
		eTargetPositionsX[currentPoint] = target[X];
		eTargetPositionsY[currentPoint] = target[Y];
		
		// Player Points
		//if(analogStickPosition != null){
			ePlayerPositionsX[currentPoint] = analogStickPosition[X];
			ePlayerPositionsY[currentPoint] = analogStickPosition[Y];
		//}
		
		currentPoint ++;
		if(currentPoint >= maxPoints)
			currentPoint = 0;
	}
}
