#include <iostream> //header file
using namespace std; //standard namespace

struct Node {
	int data;
	Node* next = NULL;
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
	temp->next = head;
	head = temp;
	
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
	check->next = temp;

}


void LinkedList::delete_start()
{
	if (head == NULL)
	{
		return;
	}
		
	else 
	{
		Node* temp = head;
		head = temp->next;
		delete temp;
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
		Node* count = head->next;
		Node* previous = head;
		while (count->next != NULL)
		{
			count = count->next;
			previous = previous->next;
		}
		delete count;
		previous->next = NULL;
		
	}
}


void LinkedList::delete_after(int n)
{
	
	Node* check = head;
	while (check->data != n)
	{
		check = check->next;
		if (check == NULL)
			return;
	}

	Node* temp = check->next;
	check->next = check->next->next;
	delete temp;

}

int main()
{
	LinkedList list;

	list.insert_start(1);
	list.insert_end(2);
	list.insert_end(4);
	list.insert_after(2,3);
	
	list.printList();

	
	
	list.delete_after(6);
	cout << endl;
	list.printList();


	return 0;
}

