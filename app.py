from flask import Flask
from flask import request
from flask import render_template
from google.protobuf.json_format import MessageToJson
from google.protobuf import json_format

import json
import taskapp_pb2
import data
import uuid

app = Flask(__name__)

# Given -> root
# Return -> home page

@app.route('/', methods=['GET'])
def home():
    return render_template('home.html')

# Given -> a task
# Return -> new task or existing task edited

@app.route('/api/task', methods=['POST'])
def task():

    taskApp = data.read()
    task = taskapp_pb2.Task()
    newTask = toBuffer(request.data, task, gettingJson(request))

    matchingTasks = filterById(taskApp.tasks, newTask.id)
    if len(matchingTasks) > 0:
        data.update(matchingTasks[0], newTask)
        data.write(taskApp)
    else:
        newTask.time_created.GetCurrentTime()
        newTask.last_updated.GetCurrentTime()
        newTask.id = str(uuid.uuid4())
        taskApp.tasks.extend([newTask])
        data.write(taskApp)

    return fromBuffer(newTask, gettingJson(request))

# Given -> a name
# Return -> all associated tasks

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    taskApp = data.read()
    if request.method == 'GET':
        result = filterByName(taskApp.tasks, request.args.get('name'))
        return fromBuffer(result, wantsJson(request))

## Helper functions

def filterById(tasks, id):
    return [x for x in tasks if x.id == id]

def filterByName(tasks, name):
    return taskapp_pb2.TaskSearchResult(
        tasks = [x for x in tasks if x.assigned == name or x.creator == name])

def fromBuffer(data, toJson):
    if toJson:
        return MessageToJson(data)
    return data.SerializeToString()

def toBuffer(data, instance, fromJson):
    if fromJson:
        return json_format.Parse(data, instance, ignore_unknown_fields=False)
    return instance.ParseFromString(data)

def wantsJson(request):
    return request.headers['Accept'] == "application/json"

def gettingJson(request):
    return request.headers['Content-Type'] == "application/json"

## start

if __name__ == '__main__':
    app.run(debug=True)
