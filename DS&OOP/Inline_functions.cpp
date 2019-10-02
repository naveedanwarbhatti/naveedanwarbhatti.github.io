#include <iostream> 
#include <string>
using namespace std;

class Rectangle {
private:
	int width, height;
public:
	void set_values(int a, int b)
	{
		width = a;
		height = b;
	}

	int area(void)
	{
		return width * height;
	}
};

int main()
{
	Rectangle rect;
	rect.set_values(3, 4);
	cout << "area: " << rect.area();
	return 0;
}