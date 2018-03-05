(function() {
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedTask: null,
    selectedTasks: [],
    spinner: document.querySelector('.loader'),
    taskTemplate: document.querySelector('.taskTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container')
  };

  /*****************************************************************************
   *
   * Events
   *
   ****************************************************************************/

   document.querySelector('.main').addEventListener('click', function(e) {
     app.updateTaskState(e);
   });

  document.getElementById('butRefresh').addEventListener('click', function() {
    app.refreshTasks();
  });

  document.getElementById('butAdd').addEventListener('click', function() {
    app.toggleAddDialog(true);
  });

  document.getElementById('butAddTask').addEventListener('click', function() {
    app.toggleAddDialog(false);
    app.saveNewTask({
      "assigned": document.querySelector('.new-task-assigned').value,
      "creator": document.querySelector('.new-task-assigner').value,
      "name": document.querySelector('.new-task-name').value,
      "description": "",
      "size": document.querySelector('.new-task-size').value
    });
  });

  document.getElementById('butSetPerson').addEventListener('click', function() {
    app.toggleAddDialog(false);
    app.turnOnTaskDialog();
    localStorage.selectedPerson = document.querySelector('.person-name').value;
    app.loadCards();
  });

  document.getElementById('butSetConfirmer').addEventListener('click', function() {
    app.toggleAddDialog(false);
    app.turnOnTaskDialog();
    if (app.selectedTask) {
      app.selectedTask.confirmer = document.querySelector('.confirmer-name').value;
      if (app.selectedTask.confirmer) {
        app.selectedTask.taskState = 2; // COMPLETE
        app.saveNewTask(app.selectedTask);
        app.selectedTask = null;
      }
    }
  });


  document.querySelectorAll('.butAddCancel').forEach(function(but) {
    but.addEventListener('click', function() {
      app.toggleAddDialog(false);
    });
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  app.turnOnTaskDialog = function() {
    document.querySelector('.new-task').removeAttribute('hidden');
    document.querySelector('.set-person').setAttribute('hidden', true);
    document.querySelector('.set-confirmer').setAttribute('hidden', true);
  }

  app.turnOnConfirmerDialog = function() {
    document.querySelector('.set-confirmer').removeAttribute('hidden');
    document.querySelector('.set-person').setAttribute('hidden', true);
    document.querySelector('.new-task').setAttribute('hidden', true);
  }

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a task card with the latest details for that task. If the card
  // doesn't already exist, it's cloned from the template.

  app.updateTaskCard = function(task) {
    var dataLastUpdated = new Date(task.lastUpdated);

    var card = app.visibleCards[task.id];
    if (!card) {
      card = app.taskTemplate.cloneNode(true);
      card.classList.remove('taskTemplate');
      card.querySelector('.task-name').textContent = task.name;
      card.querySelector('.task-key').textContent = task.id;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[task.id] = card;

      var association;
      if (localStorage.selectedPerson == task.creator) {
        association = 'assigner';
      } else if (localStorage.selectedPerson == task.assigned) {
        association = 'assigned';
      } else if (localStorage.selectedPerson == task.confirmer) {
        association = 'confirmer';
      }
      if (association) {
        card.classList.add(association);
      }
    }

    // Verifies the data provide is newer than what's already visible
    // on the card, if it's not bail, if it is, continue and update the
    // time saved in the card

    var cardLastUpdatedElem = card.querySelector('.task-last-updated');
    var cardLastUpdated = cardLastUpdatedElem.textContent;
    if (cardLastUpdated) {
      cardLastUpdated = new Date(cardLastUpdated);
      // Bail if the card has more recent data then the data
      if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
        return;
      }
    }

    cardLastUpdatedElem.textContent = task.lastUpdated;

    card.querySelector('.task-name').textContent = task.name;
    card.querySelector('.task-assigner').textContent = task.creator;
    card.querySelector('.task-assigned').textContent = task.assigned;
    card.querySelector('.task-confirmer').textContent = task.confirmer;
    card.querySelector('.task-state').textContent = task.taskState;
    card.querySelector('.task-size').textContent = task.size;
    card.querySelector('.task-completed').textContent = task.completed;

    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

    // remove old card

    app.removeOldCards = function(tasks) {
      var keys = Object.keys(app.visibleCards);
      var ids = tasks.map(function(task) {
        return task.id;
      });
      keys.forEach(function(key) {
        if(ids.filter(id => id == key).length <1) {
          card = app.visibleCards[key]
          card.parentNode.remove(card);
        }
      });
    }


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  /*
   * Gets a forecast for a specific city and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   */
  app.refreshTasks = function() {

    var url = 'http://127.0.0.1:5000/api/tasks?name=' + localStorage.selectedPerson
    if ('caches' in window) {

      /*
       * Check if the service worker has already cached tasks data.
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */

      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(json) {
            json.forEach(function(task) {
              app.updateTaskCard(task);
            });
          });
        }
      });
    }

    // Fetch the latest data.

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.tasks.forEach(function(task) {
            app.updateTaskCard(task);
          });
          app.selectedTasks = JSON.parse(request.response).tasks;
          localStorage.selectedTasks = JSON.stringify(app.selectedTasks);

          // app.removeOldCards(response.tasks);
        }
      }

    };
    request.open('GET', url);
    request.setRequestHeader("Accept", "application/json");
    request.send();
  };


  // save the new card

  app.saveNewTask = function(task) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          app.updateTaskCard(JSON.parse(request.response));
        }
      }
    }
    request.open('POST', 'http://127.0.0.1:5000/api/task')
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(task));
  }

  // update the task

  app.updateTaskState = function(e) {
    var card = e.target.closest('.task-list');
    var id = card ? card.querySelector('.task-key').textContent : '';
    var task = app.selectedTasks.filter(function(task) {
      return task.id == id;
    })
    task = task.length > 0 ? task[0] : null;
    if (task) {
      app.progressTaskState(card, task);
    }
  }

  app.progressTaskState = function(card, task) {
    var states = ['NEW','IN_PROGRESS','COMPLETE','BLOCKED','CLOSED']
    var possible = [];
    if (card.classList.contains('assigned')) {
      possible = ['IN_PROGRESS','COMPLETE','BLOCKED'];
    } else if (card.classList.contains('assigner')) {
      possible = ['IN_PROGRESS','COMPLETE','BLOCKED','CLOSED'];
    } else if (card.classList.contains('confirmer')) {
      possible = ['IN_PROGRESS'];
    }
    var currentState = card.querySelector('.task-state').textContent;
    var nextState = possible[possible.indexOf(currentState) > possible.length -2 ? 0 : possible.indexOf(currentState) +1];
    var stateIndex = states.indexOf(nextState);

    if (nextState == 'COMPLETE') {
      app.selectedTask = task;
      app.turnOnConfirmerDialog();
      app.toggleAddDialog(true);
      return;
    }

    task.taskState = stateIndex;
    app.saveNewTask(task);
  }

  /************************************************************************
   * TODO:
   *   IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  app.clearStorage = function() {
    app.visibleCards = {};
    localStorage.selectedTasks = app.selectedTasks = [];
  }

  app.loadCards = function() {
    app.selectedTasks = localStorage.selectedTasks;
    if (app.selectedTasks) {
      app.selectedTasks = JSON.parse(app.selectedTasks);
      app.selectedTasks.forEach(function(task) {
        app.updateTaskCard(task);
      });
    } else {
      app.clearStorage();
      app.refreshTasks();
    }
  }

  app.registerWorker = function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
               .register('./static/service-worker.js')
               .then(function() { console.log('Service Worker Registered'); });
    }
  }

  app.begin = function() {

    if (!localStorage.selectedPerson) {
      app.clearStorage();
      app.toggleAddDialog(true);
    } else {
      app.turnOnTaskDialog();
      app.loadCards();
    }

    app.registerWorker();
  }

  app.begin();


})();
