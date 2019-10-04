
#include <iostream>
using namespace std;

class Rectangle {
	int *width, *height;
public:
	Rectangle();
	~Rectangle();
};

Rectangle::Rectangle() {
	cout << "Hey look I am in constructor" << endl;
	width = new int[10];
	height = new int[10];
}

Rectangle::~Rectangle() {
	cout << "Hey look I am in destructor" << endl;
	delete [] width;
	delete [] height;
}


int main() {
	Rectangle rect;
	
	return 0;
}





