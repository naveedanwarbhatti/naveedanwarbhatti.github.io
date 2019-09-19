#include <iostream> 
#include <string>
using namespace std;

struct StudentRecord
{
	string Name;
	int      id;
	float   CGPA;
};

bool compare_name(StudentRecord a, StudentRecord b)
{
	if (a.Name == b.Name)
		return true;
	else
		return false;
}

int main()
{
	StudentRecord Students[2];
	
	Students[0].Name ="Naveed";
	Students[0].id = 7;
	Students[0].CGPA =3.9;

	Students[0].Name = "Ali";
	Students[0].id = 8;
	Students[0].CGPA = 4;

	if (compare_name(Students[0], Students[1]))
		cout << "Name Matched" << endl;
	else
		cout << "Name not Matched" << endl;
	
	return 0;
}
