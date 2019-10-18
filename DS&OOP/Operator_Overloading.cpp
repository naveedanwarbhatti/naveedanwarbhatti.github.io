#include <iostream>
using namespace std;

class myclass {
public:
	int x, y;
	myclass() {};
	myclass(int, int);
	
};

myclass::myclass(int a, int b)
{
	x = a;
	y = b;
}

myclass operator+ (myclass param1, myclass param2) {
	myclass temp;
	temp.x = param1.x + param2.x;
	temp.y = param1.y + param2.y;
	return temp;
}

int main() {
	myclass foo(3, 1);
	myclass bar(1, 2);
	myclass result;
	result = foo + bar;
	cout << result.x << ',' << result.y << '\n';
	return 0;
}