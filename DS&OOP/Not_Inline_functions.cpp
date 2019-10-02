#include <iostream> 
#include <string>
using namespace std;

class Rectangle {
	int width, height;
public:
	void set_values(int, int);
	int area();
};

void Rectangle::set_values(int x, int y) {
	width = x;
	height = y;
}

int Rectangle::area(void) {
	return width * height;
}

int main() {
	Rectangle rect;
	rect.set_values(3, 4);
	cout << "area: " << rect.area();
	return 0;
}
