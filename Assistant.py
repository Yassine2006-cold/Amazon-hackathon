from tools import get_tasks


question = input("What can I help you with? ")

if "task" in question.lower() or "work" in question.lower():

    tasks = get_tasks()

    print("\nHere are your tasks:")

    for task in tasks:
        print(
            f"- {task['name']} | "
            f"Deadline: {task['deadline']} | "
            f"Priority: {task['priority']}"
        )

else:
    print("\nI don't know how to answer that yet.")