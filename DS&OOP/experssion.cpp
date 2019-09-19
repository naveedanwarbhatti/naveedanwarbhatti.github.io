#include <iostream> 
#include <string>
using namespace std;



int main()
{
	int x = 10;

	float y = 4.1;

	cout << "Output = " << x + y << endl;

	cout << "Type = " << typeid(x + y).name() << endl;
}

