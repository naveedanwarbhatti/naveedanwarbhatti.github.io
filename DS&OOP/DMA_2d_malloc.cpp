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

	int **a = (int**)malloc(rowCount*sizeof(int*));
	for (int i = 0; i < rowCount; i++)
	{
		a[i] = (int*)malloc(colCount * sizeof(int));
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
		free(a[i]);
	}

	free(a);

	return 0;
}
