#include <iostream> 
#include <string>
using namespace std;

class Rectangle {
	int width, height;
public:
	void set_values(int, int);
	friend int area(Rectangle);
};

void Rectangle::set_values(int x, int y) {
	width = x;
	height = y;
}

int area(Rectangle a) {
	return a.width * a.height;
}

int main() {
	Rectangle rect;
	rect.set_values(3, 4);
	cout << "area: " << area(rect);
	return 0;
}


