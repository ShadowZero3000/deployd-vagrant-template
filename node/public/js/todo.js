var todoApp = angular.module('todoApp',[]);

todoApp.controller('TodoController', function($scope, $http) {

  $scope.todos = [];

  // Get all todos
  $http.get('/todos')
    .success(function(todos) {
      $scope.loaded = true;
      $scope.todos = todos;
    }).error(function(err) {
      alert(err);
    });

  $scope.addTodo = function(title) {
    $http.post('/todos', {
      title: title
    }).success(function(todo) {
      $scope.newTodoTitle = '';
      //$scope.todos.push(todo);
      addOrUpdate(todo);
    }).error(function(err) {
      // Alert if there's an error
      return alert(err.message || "an error occurred");
    });
  };
  $scope.removeTodo = function(todo) {
    deleteTodo(todo);
  }
  $scope.changeCompleted = function(todo) {
    // Update the todo
    $http.put('/todos/' + todo.id, {
      completed: todo.completed
    }).error(function(err) {
      return alert(err.message || (err.errors && err.errors.completed) || "an error occurred");
    });
  };

  $scope.removeCompletedItems = function() {
    $http.get('/todos', {
      params: {
        completed: true
      }
    }).success(function(todos) {
      todos.forEach(function(t) { deleteTodo(t); });
    });
  };

  function deleteTodo(todo) {
    $http.delete('/todos/' + todo.id, {
    }).success(function() {
      removeTodo(todo);
    }).error(function(err) {
      alert(err.message || "an error occurred");
    });
  }
  function removeTodo(todo){
    // Find the index of an object with a matching id
    var index = $scope.todos.indexOf(
        $scope.todos.filter(function(t) {
          return t.id === todo.id;
        })[0]);
    if (index !== -1) {
      $scope.$apply($scope.todos.splice(index, 1));
    }
  } 
  dpd.todos.on('create', addOrUpdate);
  dpd.todos.on('update', addOrUpdate);
  dpd.todos.on('delete', removeTodo);
  dpd.todos.on('bingo',function(a,b,c){console.log('Awesome!');});

  function addOrUpdate(todo){
    var exists=false;
    $scope.todos.every(function(existing,index){
      if(todo.id===existing.id){
        exists=index;
        return false;
      }
      return true;
    });
    $scope.$apply(function(){
    if(exists!==false){
      $scope.todos[exists]=todo;
    }else{
      $scope.todos.push(todo);
    }
    });
  };


});
