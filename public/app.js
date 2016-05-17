var socket = io();
var socket = io.connect();

var app = angular.module('myApp', []);

app.controller('mainCtrl', ['$scope', function($scope) {
  // config
  $scope.selection = {};

  socket.on('newConnection', function(data){
    $scope.connections = data;
  });

  socket.on('step', function(data){
    $scope.step = data;
    $scope.$apply();
    $scope.$emit($scope.step.name)
  });

  socket.on('selected', function(data) {
    console.log('selected' + data)
    $scope.selected = data.img;
  });

  $scope.next = function() {
    // gets & starts next event
    socket.emit("nextStep", $scope.step);
    // clears element with animated text
      $('.animation').html('<span class="element"></span>');
  }

  $scope.select = function(data) {
    $scope.selected = data;
    socket.emit("selected", $scope.selected);
  };

  $scope.$watch('step', function(){
    if ($scope.step.animatedText) {
      $(".element").typed({
          strings: $scope.step.animatedText,
          typeSpeed: 25
      });
    }
  }, true );

  $scope.$on('build', function(event){
    console.log('build');
    var term = new Terminal({
     cols: 80,
     rows: 24,
     screenKeys: true
    });

    term.open(document.getElementById('tty'));

    socket.on('ttyData', function(data) {
      console.log(data);
      term.write(data);
    });

    socket.on('ttyExit', function(data) {
      term.destroy();
      console.log("EXITED")
      $scope.next()
    });
  });

  $scope.$on('success', function(event){
    socket.emit('haltResinPoll');
  });

  $scope.$on('download', function(event){
    socket.on('devicesData', function(data) {
      $scope.devices = data;
      $scope.$apply();
      console.log(data);
    });
  });

}]).directive('resinSelection', function() {
  return {
    restrict: 'E',
    templateUrl: '/directives/selection.html'
  };
}).directive('resinTerminal', function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/terminal.html'
  };
}).directive('resinDevices', function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/devices.html'
  };
}).directive('resinVideo', function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/video.html'
  };
});
