#include<iostream>
using namespace std;

class Square;

class Rectangle {
	int width, height;
public:
	void set_values(Square);

};

class Square {
	int width, height;
public:
	void set_values(int x, int y);
	friend class Rectangle;
};


void Rectangle::set_values(Square x) {
	width = x.width;
	height = x.height;
}



void Square::set_values(int x, int y) {
	width = x;
	height = y;
}

int main() {
	Square sq;
	sq.set_values(3, 4);
	Rectangle rect;
	rect.set_values(sq);
	return 0;
}
