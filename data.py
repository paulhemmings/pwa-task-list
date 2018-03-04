
import taskapp_pb2
import sys
import uuid

def create():
    write(taskapp_pb2.TaskApp(
        users = [taskapp_pb2.User(
          name = 'paul',
          devices = ['laptop', 'phone'],
          email = 'paul@paul.com'
        ),taskapp_pb2.User(
          name = 'aiden',
          devices = ['phone'],
          email = 'aiden@home.com'
        )],
        tasks = [taskapp_pb2.Task(
            name = 'clean dishes',
            description = '',
            size = 10,
            taskState = 0,
            creator = 'paul',
            assigned = 'aiden',
            confirmer = '',
            id = str(uuid.uuid4())
        ),taskapp_pb2.Task(
            name = 'clean car',
            description = '',
            size = 10,
            taskState = 0,
            creator = 'ali',
            assigned = 'paul',
            confirmer = '',
            id = str(uuid.uuid4())
        )]
    ));

def update(existing, new):
    existing.size = new.size
    existing.taskState = new.taskState
    existing.confirmer = new.confirmer
    existing.last_updated.GetCurrentTime()
    return existing

def read():
    try:
      with open('my-task-list-store', "rb") as f:
        taskList = taskapp_pb2.TaskApp()
        taskList.ParseFromString(f.read())
        return taskList
    except IOError:
        create()
        print('my-task-list-store' + ": Error Occurred.")

def write(taskApp):
    with open('my-task-list-store', "wb") as f:
      f.write(taskApp.SerializeToString())
      return taskApp
