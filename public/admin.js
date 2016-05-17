'use strict';
var socket = io();
var socket = io.connect();

var app = angular.module('admin', ['ngFileUpload'])
.controller('settingsCtrl', ['$scope', 'apiService', 'Upload', '$timeout', function ($scope, apiService, Upload, $timeout) {
  $scope.settings = 'global'
  $scope.nextStep = "start"

  $scope.next = function() {
    getStep($scope.nextStep);
  }

  $scope.save = function() {
    apiService.save($scope.data, $scope.settings).success(function(data){
      console.log(data);
      $scope.saved = true;
      setInterval(function(){
        $scope.saved = false;
        $scope.$apply()
      }, 2000)
    })
  }

  $scope.$watch('settings', function() {
    console.log($scope.settings)
    if ($scope.settings == 'global') {
      apiService.global().success(function(data){
        $scope.data = data;
      })
    } else {
      if (!$scope.data.name) {
        getStep($scope.nextStep);
      } else {
        getStep($scope.data);
      }
    }

  }, true);

  apiService.gallery().success(function(data){
    console.log(data)
    console.log('success')
    $scope.gallery = data
  })

  $scope.removeImage = function(index){
    apiService.removeImage($scope.gallery[index]).success(function(data){
      $scope.gallery.splice(index, 1);
    });
  }
  $scope.gallery = [];

  socket.on('imageAdded', function(path){
    console.log(path)
    $scope.gallery.push(path);
    $scope.$apply();
  });

  $scope.$watch('files', function () {
        $scope.upload($scope.files);
  });

  $scope.log = '';

  $scope.upload = function (files) {
      if (files && files.length) {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.$error) {
              Upload.upload({
                  url: '/api/upload',
                  data: {
                    file: file
                  }
              }).then(function (resp) {
                  $timeout(function() {
                      $scope.log = 'file: ' +
                      resp.config.data.file.name +
                      ', Response: ' + JSON.stringify(resp.data) +
                      '\n' + $scope.log;
                  });
              }, null, function (evt) {
                  var progressPercentage = parseInt(100.0 *
                      evt.loaded / evt.total);
                  $scope.log = 'progress: ' + progressPercentage +
                    '% ' + evt.config.data.file.name + '\n' +
                    $scope.log;
              });
            }
          }
      }
  };
  $scope.checkType = function(value) {
    if(value === null) {
        return "null";
    }
    if(Array.isArray(value)) {
        return "array";
    }
    return typeof value;
  }

  function getStep(step) {
    apiService.steps(step).success(function(data){
      $scope.data = data[0]
      $scope.nextStep = data[1]
    })
  }
}]).directive('resinForm', function() {
  return {
    restrict: 'E',
    replace: 'true',
    templateUrl: '/directives/form.html'
  };
}).directive('resinUpload', function() {
  return {
    restrict: 'E',
    templateUrl: '/directives/uploader.html'
  };
}).directive('resinGallery', function() {
  return {
    restrict: 'E',
    templateUrl: '/directives/gallery.html'
  };
});
