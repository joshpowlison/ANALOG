// Linear-feedback shift register value, for RNG. Don't worry about this.
unsigned short lfsr = 1234;

// Returns a float between 0 and 1. Randomizes using a linear-feedback shift register.
float rng(){
	lfsr = (lfsr >> 1) | ((((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5) ) & 1) << 15);
	return (float)lfsr / 65535.0f;
}

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