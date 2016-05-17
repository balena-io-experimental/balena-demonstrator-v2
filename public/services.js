app.factory('apiService', function($http) {
    return {
      global: function() {
        return $http.get('/api/settings/global/');
      },
      steps: function(step) {
        return $http.get('/api/settings/steps/' + step);
      },
      save: function(data, settings) {
        return $http.post('/api/settings/save/', { "data": data, "settings": settings });
      },
      gallery: function() {
        return $http.get('/api/gallery/');
      },
      removeImage: function(image) {
        return $http.get('/api/gallery/remove/' + image);
      }
    };
});
