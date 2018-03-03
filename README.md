## set up environment

$ git clone https://github.com/paulhemmings/pwa-task-list.git

## compile

$ protoc -I=. --python_out=. ./taskapp.proto


## run

$ python app.py

## end points

GET
http://127.0.0.1:5000/api/tasks?assigned=[name]

POST
http://127.0.0.1:5000/api/tasks

BODY
````
{
  "assigned": "ali",
  "creator": "ali",
  "name": "buy scruffy a coat",
  "size": 10
}
````
