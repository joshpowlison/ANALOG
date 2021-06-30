float ePlayerPositionsX[1024];
float ePlayerPositionsY[1024];
float eTargetPositionsX[1024];
float eTargetPositionsY[1024];

const int X = 0;
const int Y = 1;
const int maxPoints = 1024;

float CANVAS_WIDTH = 100;
float CANVAS_HEIGHT = 100;

float lastPointDelay = 0;
float pointDelay = 60.0f / (float)maxPoints;
int currentPoint = 0;

float getAbsFloat(float num){
	if(num < 0)
		num *= -1;

	return num;
}

float getSquareFloat(float num){
	return num * num;
}

// Stolen from: https://ourcodeworld.com/articles/read/884/how-to-get-the-square-root-of-a-number-without-using-the-sqrt-function-in-c
float getSquareRoot(float number)
{
    // store the half of the given number e.g from 256 => 128
    float sqrt = number / 2;
    float temp = 0;

    // Iterate until sqrt is different of temp, that is updated on the loop
    while(sqrt != temp){
        // initially 0, is updated with the initial value of 128
        // (on second iteration = 65)
        // and so on
        temp = sqrt;

        // Then, replace values (256 / 128 + 128 ) / 2 = 65
        // (on second iteration 34.46923076923077)
        // and so on
        sqrt = ( number/temp + temp) / 2;
    }

	return sqrt;
}

float getDistance(a,b){
	return getSquareRoot(getSquareFloat(a) + getSquareFloat(b));
}


void loop(float sDeltaTime)
{
	float analogReadDistance = 25; // TODO: make tie in with JS
	
	int gamepadExists = 0;
	float distanceFromAnalogCenter = analogReadDistance + 1;
	float distanceFromTarget = distanceFromAnalogCenter;
	
	float analogStickPosition[2];
	float analogCenter[2];
	float analogRadius;
	
	float targetTarget[2];
	float target[2];
	
	// If the button is being targeted at all by the movement, angle it
	if(gamepadExists == 1 || distanceFromAnalogCenter <= analogReadDistance)
	{
		// Set button rotation angle
		// rotate3d(rotate left, rotate up, LEAVE 0, strongest amount)
		float xAngle = (analogStickPosition[X] - analogCenter[X]) / analogRadius;
		float yAngle = (analogStickPosition[Y] - analogCenter[Y]) / analogRadius * -1;
		
		// Distance
		float a = analogStickPosition[X] - analogCenter[X];
		float b = analogStickPosition[Y] - analogCenter[Y];
		
		// Update info
		distanceFromTarget = getDistance(analogStickPosition[X] - target[X], analogStickPosition[Y] - target[Y]);
	}
	
	// Move target before updating info- then it's IMPOSSIBLE to be perfect
	float moveRelative[2] = {0, 0};
	moveRelative[X] = targetTarget[X] - target[X];
	moveRelative[Y] = targetTarget[Y] - target[Y];
	
	if(getAbsFloat(moveRelative[X]) > 3)
		moveRelative[X] *= 0.5f * sDeltaTime;
	
	if(getAbsFloat(moveRelative[Y]) > 3)
		moveRelative[Y] *= 0.5f * sDeltaTime;
	
	target[X] += moveRelative[X];
	target[Y] += moveRelative[Y];
	
	// Update points
	lastPointDelay -= sDeltaTime;
	if(lastPointDelay <= 0){
		lastPointDelay += pointDelay;
		
		// Line Points
		eTargetPositionsX[currentPoint] = target[X] - analogCenter[X] + (CANVAS_WIDTH / 2);
		eTargetPositionsY[currentPoint] = target[Y] - analogCenter[Y] + (CANVAS_HEIGHT / 2);
		
		// Player Points
		//if(analogStickPosition != null){
			ePlayerPositionsX[currentPoint] = analogStickPosition[X] - analogCenter[X] + (CANVAS_WIDTH / 2);
			ePlayerPositionsY[currentPoint] = analogStickPosition[Y] - analogCenter[Y] + (CANVAS_HEIGHT / 2);
		//}
		
		currentPoint ++;
		if(currentPoint >= maxPoints)
			currentPoint = 0;
	}
}
