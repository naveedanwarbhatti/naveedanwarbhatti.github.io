#include <iostream> //header file
using namespace std; //standard namespace

struct Node {
	int data;
	Node* next = NULL;
};

class CircularLinkedList {

	Node* last = NULL;

public:
	void printList();

	void insert_start(int value);
	void insert_end(int value);
	void insert_after(int n, int value);

	void delete_start();
	void delete_end();
	void delete_after(int n);


};



void CircularLinkedList::printList()
{
	Node* n = last->next;
	if (n == NULL)
	{
		return;
	}
	else
	{
		
		do
		{
			cout << n->data << " ";
			n = n->next;
		} 
		while (n != last->next);

	}
}

void CircularLinkedList::insert_start(int value)
{
	Node* temp = new Node;
	temp->data = value;

	if (last == NULL)
	{
		last=temp; 
		last->next = last;
	}

	else
	{
		temp->next = last->next;
		last->next = temp;
	}

}

void CircularLinkedList::insert_end(int value)
{
	Node* temp = new Node;
	temp->data = value;

	if (last == NULL)
	{
		last = temp;
		last->next = last;
	}

	else
	{
		temp->next = last->next;
		last->next = temp;
		last = temp;
	}
}


void CircularLinkedList::insert_after(int n, int value)
{
	Node* temp = new Node;
	temp->data = value;

	Node* check = last;
	while (check->data != n)
	{
		check = check->next;
		if (check == last)
			return;
	}

	temp->next = check->next;
	check->next = temp;

}


void CircularLinkedList::delete_start()
{
	if (last == NULL)
	{
		return;
	}

	else
	{
		Node* temp = last->next;
		last->next = temp->next;
		delete temp;
	}

}

void CircularLinkedList::delete_end()
{

	if (last == NULL)
	{
		return;
	}

	else
	{
		Node* count = last->next;
		
		while (count->next != last)
		{
			count = count->next;
		}
		count->next=last->next;
		delete last;
		last = count;
		

	}
}


void CircularLinkedList::delete_after(int n)
{

	Node* check = last;
	while (check->data != n)
	{
		check = check->next;
		if (check == last)
			return;
	}

	Node* temp = check->next;
	check->next = check->next->next;
	delete temp;

}

int main()
{
	CircularLinkedList list;

	list.insert_start(1);
	list.insert_end(2);
	list.insert_end(4);
	list.insert_after(2, 3);

	list.printList();
	cout << endl;

	list.delete_after(1);
	list.delete_after(7);
	
	list.printList();


	return 0;
}
