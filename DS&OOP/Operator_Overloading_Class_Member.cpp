#include <iostream>
using namespace std;

class myclass {

	int x, y;
public:
	myclass() {};
	myclass(int, int);
	myclass operator+ (myclass param2);
	void print();

};

myclass::myclass(int a, int b)
{
	x = a;
	y = b;
}

myclass myclass::operator+ (myclass param2) {
	myclass temp;
	temp.x = x + param2.x;
	temp.y = y + param2.y;
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