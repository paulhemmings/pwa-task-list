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

@app.route('/', methods=['GET'])
def home():
    return render_template('home.html')

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():

    taskApp = data.read()

    # GET
    if request.method == 'GET':
        result = filterTasks(taskApp.tasks, request)
        return fromBuffer(result, wantsJson(request))

    # POST branch
    task = taskapp_pb2.Task()
    newTask = toBuffer(request.data, task, gettingJson(request))
    newTask.time_created.GetCurrentTime()
    newTask.last_updated.GetCurrentTime()
    newTask.id = str(uuid.uuid4())
    taskApp.tasks.extend([newTask])
    data.write(taskApp)
    return fromBuffer(newTask, gettingJson(request))


def filterTasks(list, request):
    assigned = request.args.get('assigned')
    return taskapp_pb2.TaskSearchResult(
        tasks = [x for x in list if x.assigned == assigned]
    )

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

if __name__ == '__main__':
    app.run(debug=True)
