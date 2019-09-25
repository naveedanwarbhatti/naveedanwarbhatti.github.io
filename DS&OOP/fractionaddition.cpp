#include <iostream> 
#include <string>
using namespace std;

struct Fraction
{
	float numerator;
	float denominator;
};

Fraction add(Fraction a, Fraction b)
{
	Fraction temp;
	temp.numerator = (a.numerator * b.denominator) + (a.denominator * b.numerator);
	temp.denominator = (a.denominator * b.denominator);
	return temp;
}

int main()
{
	Fraction num1, num2, result;

	cout << "For 1st fraction," << endl;
	cout << "Enter numerator and denominator:" << endl;
	cin >> num1.numerator >> num1.denominator;

	cout << endl << "For 2nd fraction," << endl;
	cout << "Enter numerator and denominator:" << endl;
	cin >> num2.numerator >> num2.denominator;

	result = add(num1, num2);
	cout << "Sum = " << result.numerator << '/' << result.denominator << endl;

	return 0;
}