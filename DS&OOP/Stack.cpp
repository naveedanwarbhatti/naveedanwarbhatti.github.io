#include <iostream> //header file
using namespace std; //standard namespace

struct Node {
	int data;
	Node* next = NULL;

};

class Stack {

	Node* top = NULL;

public:

	void push(int value);
	int pop();
	int peek();
	void printStack();
};



void Stack::push(int value)
{

	Node* temp = new Node;
	temp->data = value;

	if (top == NULL)
	{
		top = temp;
	}

	else
	{
		temp->next = top;
		top = temp;
	}

}




int Stack::pop()
{
	if (top == NULL)
	{
		return 0;
	}

	else
	{
		Node* temp = top;
		top = top->next;
		int data = temp->data;
		delete temp;
		return data;
	}

}

int Stack::peek()
{
	if (top == NULL)
	{
		exit(1);
	}

	else
	{
		return top->data;
	}

}

void Stack::printStack()
{
	Node* n = top;
	while (n != NULL) {
		cout << n->data << " ";
		n = n->next;
	}
}


int main()
{
	Stack myStack;

	myStack.push(8);
	myStack.push(11);
	myStack.push(3);
	myStack.push(9);

	myStack.printStack();
	cout << endl;

	myStack.pop();
	myStack.pop();

	myStack.printStack();
	cout << endl;


	myStack.pop();
	myStack.pop();

	myStack.printStack();
	myStack.peek();
	cout << endl;

	return 0;
}

