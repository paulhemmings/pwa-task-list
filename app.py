from flask import Flask
from flask import request
from flask import render_template
from google.protobuf.json_format import MessageToJson
from google.protobuf import json_format

import json
import taskapp_pb2
import data

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('home.html')

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():

    taskApp = data.read()

    # GET
    if request.method == 'GET':
        print "value is =>",taskApp.tasks
        assigned = request.args.get('assigned')
        result = taskapp_pb2.TaskSearchResult(
            tasks = [x for x in taskApp.tasks if x.assigned == assigned]
        )

        if wantsJson(request):
            return MessageToJson(result)

        return result.SerializeToString()
        # json.dumps(taskApp.tasks)
        # return taskApp.tasks[0].SerializeToString();

    # POST branch
    task = taskapp_pb2.Task()

    if gettingJson(request):
        newTask = json_format.Parse(request.data, task, ignore_unknown_fields=False)
        taskApp.tasks.extend([newTask])
        data.write(taskApp)
        return MessageToJson(newTask)

    task.ParseFromString(request.data)
    taskApp.tasks.extend([task])
    data.write(taskApp)
    return task.SerializeToString()

@app.route('/api/users', methods=['GET', 'POST'])
def users():

    taskApp = data.read()

    # GET
    if request.method == 'GET':
        return taskApp.users

    # POST branch
    user = taskapp_pb2.User()
    user.ParseFromString(request.data)
    taskApp.users.extend([user])
    data.write(taskApp)
    return taskApp

def wantsJson(request):
    return request.headers['Accept'] == "application/json"

def gettingJson(request):
    return request.headers['Content-Type'] == "application/json"

if __name__ == '__main__':
    app.run(debug=True)
