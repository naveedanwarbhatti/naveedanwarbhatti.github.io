#include <iostream>
using namespace std;

class myclass {

	int x, y;
public:
	myclass() {};
	myclass(int, int);
	void operator++ ();
	void print();

};

myclass::myclass(int a, int b)
{
	x = a;
	y = b;
}

void myclass::operator++ () {
	myclass temp;
	x++;
	y++;
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