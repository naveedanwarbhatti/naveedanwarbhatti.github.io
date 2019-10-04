
#include <iostream>
using namespace std;

class Rectangle {
	int width, height;
public:
	Rectangle();
	~Rectangle();
};

Rectangle::Rectangle() {
	cout << "Hey look I am in constructor" << endl;
}

Rectangle::~Rectangle() {
	cout << "Hey look I am in destructor" << endl;
}


int main() {
	Rectangle *rect= new Rectangle;
	delete rect;
	return 0;
}





