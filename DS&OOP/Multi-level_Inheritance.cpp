
#include <iostream>
using namespace std;

class Grand_Parent {

public:
	void MyGrandParent()
	{
		cout << "Grand Parent class" << endl;
	}
};


// Another base class
class Parent : public Grand_Parent {

public:
	void MyParent()
	{
		cout << "Parent class" << endl;
		
	}
};

class Child : public Parent {
public:
	void Me()
	{
		cout << "Child class" << endl;

	}
};

int main() {
	Child myObj;
	myObj.MyGrandParent();
	myObj.MyParent();
	myObj.Me();
	
	return 0;
}
