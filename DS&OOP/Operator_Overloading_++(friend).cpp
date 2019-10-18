#include <iostream>
using namespace std;

class myclass {

	int x, y;
public:
	myclass() {};
	myclass(int, int);
	friend void operator++ (myclass&);
	void print();

};

myclass::myclass(int a, int b)
{
	x = a;
	y = b;
}

void operator++ (myclass& a) {
	++a.x;
	++a.y;
}

void myclass::print() {
	cout << x << ',' << y << '\n';
}

int main() {
	myclass foo(3, 1);
	++foo;
	foo.print();
	return 0;
}