#include <iostream> 
#include <string>
using namespace std;


int main()
{
	int rowCount, colCount;

	cout << "Enter number of rows :";
	cin >> rowCount;

	cout << "Enter number of columns :";
	cin >> colCount;

	int **a = new int*[rowCount];
	for (int i = 0; i < rowCount; i++)
	{
		a[i] = new int[colCount];
	}

	// initializing Values //

	for (int i = 0; i < rowCount; i++)
	{
		for (int j = 0; j < colCount; j++)
		{
			cout << "Please enter value for index[" << i << "][" << j << "]: ";
			cin >> a[i][j];
		}
	}

	///////////////////////


	// printing Values //

	for (int i = 0; i < rowCount; i++)
	{
		for (int j = 0; j < colCount; j++)
		{
			cout << "Value for index[" << i << "][" << j << "]: ";
			cout << a[i][j] << endl;
		}
	}

	///////////////////////

	for (int i = 0; i < rowCount; i++)
	{
		delete[] a[i];
	}

	delete a;

	return 0;
}