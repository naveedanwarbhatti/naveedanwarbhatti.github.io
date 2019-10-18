#include <iostream>
using namespace std;

class myclass {

	int x, y;
public:
	myclass() {};
	myclass(int, int);
	friend myclass operator+ (myclass param1, myclass param2);
	void print();
	
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

void myclass::print () {
	cout << x << ',' << y << '\n';
}

int main() {
	myclass foo(3, 1);
	myclass bar(1, 2);
	myclass result;
	result = foo + bar;
	result.print();
	return 0;
}