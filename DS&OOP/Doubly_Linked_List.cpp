#include <iostream> //header file
using namespace std; //standard namespace

struct Node {
	int data;
	Node* next = NULL;
	Node* previous = NULL;
};

class LinkedList {

	Node *head=NULL;

public:
	void printList();

	void insert_start(int value);
	void insert_end(int value);
	void insert_after(int n, int value);

	void delete_start();
	void delete_end();
	void delete_after(int n);


};



void LinkedList::printList()
{
	Node* n = head;
	while (n != NULL) {
		cout << n->data << " ";
		n = n->next;
	}
}

void LinkedList::insert_start(int value)
{

	Node* temp = new Node;
	temp->data = value;

	if (head == NULL)
	{
		head = temp;
	}

	else
	{
		temp->next = head;
		head->previous = temp;
		head = temp;
	}
	
}

void LinkedList::insert_end(int value)
{
	Node* temp = new Node;
	temp->data = value;

	if (head == NULL)
	{
		head = temp;
	}

	else
	{
		Node* count = head;
		while (count->next != NULL)
		{
			count = count->next;
		}
		count->next = temp;
		temp->previous = count;
	}
}


void LinkedList::insert_after(int n, int value)
{
	Node* temp = new Node;
	temp->data = value;

	Node* check = head;
	while (check->data != n)
	{
		check = check->next;
		if (check == NULL)
			return;
	}

	temp->next = check->next;
	check->next->previous = temp;
	check->next = temp;
	temp->previous = check;

}


void LinkedList::delete_start()
{
	if (head == NULL)
	{
		return;
	}
		
	else 
	{
		head=head->next;
		delete head->previous;
		head->previous = NULL;
		
	}
	
}

void LinkedList::delete_end()
{
	
	if (head == NULL)
	{
		return;
	}

	else
	{
		Node* check = head->next;
		while (check->next != NULL)
		{
			check = check->next;
		}
		
		check->previous->next = NULL;
	    delete check;
		
	}
}


void LinkedList::delete_after(int n)
{
	if (head == NULL)
	{
		return;
	}
	
	else
	{
		Node* check = head;
		while (check->data != n)
		{
			check = check->next;
			if (check == NULL)
				return;
		}

		Node* temp = check->next;
		check->next->next->previous = check;
		check->next = check->next->next;
		delete temp;
	}

}

int main()
{
	LinkedList list;

	list.insert_start(1);
	list.insert_end(2);
	list.insert_end(3);
	list.insert_end(4);
	
	
	list.printList();


	list.delete_after(1);
	cout << endl;
	list.printList();


	return 0;
}

