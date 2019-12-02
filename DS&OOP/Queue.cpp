#include <iostream> //header file
using namespace std; //standard namespace

struct Node {
	int data;
	Node* next = NULL;

};

class queue {

	Node* top = NULL;
	Node* end = NULL;

public:

	void enqueue(int value);
	int dequeue();
	int front();
	
};



void queue::enqueue(int value)
{

	Node* temp = new Node;
	temp->data = value;

	if (end == NULL)
	{
		end = top = temp;
	}

	else
	{
		end->next = temp;
		end = temp;
	}

}




int queue::dequeue()
{
	if (top == NULL)
	{
		return 0;
	}

	else
	{
		Node* temp = top;
		top = top->next;

		if (top == NULL)
			end = NULL;
		int data = temp->data;
		delete temp;
		return data;
	}

}

int queue::front()
{
	if (top == NULL)
	{
		return 0;
	}

	else
	{
		return top->data;
	}

}




int main()
{
	queue myqueue;

	myqueue.enqueue(8);
	myqueue.enqueue(5);
	myqueue.enqueue(3);
		
	cout << myqueue.dequeue() <<endl;

	myqueue.enqueue(7);
	
	cout << myqueue.dequeue() << endl;

	cout << myqueue.dequeue() << endl;

	cout << myqueue.dequeue() << endl;
	
	

	return 0;
}

