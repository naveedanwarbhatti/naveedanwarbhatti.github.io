#include <iostream>
using namespace std;

struct Address
{
	int HouseNo;
	char City[25];
	int PinCode;

};

struct Employee
{
	int Id;
	char Name[25];
	char Job[25];
	Address Add;

};

int main()
{
	Employee E;

	cout << "Enter Employee ID : ";
	cin >> E.Id;

	cout << "Enter Employee Name : ";
	cin >> E.Name;

	cout << "Enter Employee Job : ";
	cin >> E.Job;

	cout << "Enter Employee House No. : ";
	cin >> E.Add.HouseNo;

	cout << "Enter Employee City : ";
	cin >> E.Add.City;

	cout << "Enter Employee Pin Code : ";
	cin >> E.Add.PinCode;


	cout << endl << "Details of Employee : ";
	cout << endl << "Employee ID: "<< E.Id;
	cout << endl << "Employee Name: " << E.Name;
	cout << endl << "Employee Job: " << E.Job;
	cout << endl << "Employee House No.: " << E.Add.HouseNo;
	cout << endl << "Employee City: " << E.Add.City;
	cout << endl << "Employee Pin Code: " << E.Add.PinCode;
	cout << endl;

	return(0);
}
