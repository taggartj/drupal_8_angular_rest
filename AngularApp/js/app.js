// @todo move lodgic in to services ect.
var app = angular.module('app', ['ngRoute', 'ngCookies', 'ngSanitize']);
app.config(function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/AngularApp/templates/home.html',
      controller: 'HomeCtrl'
    }).
    when('/login', {
      templateUrl: '/AngularApp/templates/loginform.html',
      controller: 'LoginCtrl'
    }).
    when('/logout', {
      template: '<h2>You are logged out</h2>',
      controller: 'logoutCtrl'
    }).
    when('/protected', {
      templateUrl: '/AngularApp/templates/protected.html',
      controller: 'ProtectedCtrl'
    }).
    when('/register', {
      templateUrl: '/AngularApp/templates/register.html',
      controller: 'RegisterCtrl'
    }).
    when('/create/article', {
      templateUrl: '/AngularApp/templates/create.html',
      controller: 'CreateCtrl'
    }).
    when('/article/:uuid', {
      templateUrl: '/AngularApp/templates/article-view.html',
      controller: 'nodeDetailCtrl'
    }).
    when('/edit/:uuid', {
      templateUrl: '/AngularApp/templates/edit.html',
      controller: 'nodeEditCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
});

app.run(function ($rootScope, $http, $location, SessionService) {
  // $rootScope.baceUrl = 'http://where-youput-drupal.com/' // need the traling /
  $rootScope.baceUrl = 'http://yoursite.com/';
  $rootScope.XCSRFToken = null;
  $rootScope.userData = {};
  var tokenPoint = $rootScope.baceUrl + 'session/token?_format=json';
  function getToken($http, url) {
    $http.get(url).then(function (data) {
      $rootScope.XCSRFToken = data.data;
      console.log($rootScope.XCSRFToken);
      $http.defaults.headers['X-CSRF-Token'] = $rootScope.XCSRFToken;
      $http.defaults.headers.post['X-CSRF-Token'] = $rootScope.XCSRFToken;
      return data;
    });
  };

  // get user uuid
  function getUserUuid($http, url) {
    $http.get(url).then(function (data) {
      $rootScope.userUUID = data.data.uuid[0].value;
      SessionService.set('userUUID', data.data.uuid[0].value);
    });
  };

  // set the right X-CSRF-Token if has session.
  if (SessionService.getObject('userData') !== null) {
    var userData = SessionService.getObject('userData');
    $http.defaults.headers.post['X-CSRF-Token'] = userData.csrf_token;
    $http.defaults.headers.patch['X-CSRF-Token'] = userData.csrf_token;
    $http.defaults.headers['X-CSRF-Token'] = userData.csrf_token;
    var uid = userData.current_user.uid;
    // get and store the users uuid.
    if (SessionService.get('userUUID') == null) {
      var url = $rootScope.baceUrl + 'user/'+ uid +'?_format=json';
      getUserUuid($http, url);
    }

  }
  else {
    // Get the Annon token.
    if ($rootScope.XCSRFToken === null) {
      getToken($http, tokenPoint);
    }
  }
});

// Session Service for page refresh.
app.service('SessionService', function($window) {
  var service = this;
  var sessionStorage = $window.sessionStorage;

  service.get = function(key) {
      return sessionStorage.getItem(key);
  };
  service.getObject = function(key) {
     var value = sessionStorage.getItem(key);
     return JSON.parse(value);
  };
  service.setObject = function(key, value) {
    // Check if type object JSON.parse(value);
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    sessionStorage.setItem(key, value);
  };
  service.set = function(key, value) {
    // Check if type object JSON.parse(value);
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    sessionStorage.setItem(key, value);
  };
  service.unset = function(key) {
      sessionStorage.removeItem(key);
  };
});

// HOME PAGE.
app.controller('HomeCtrl', function ($scope, $http, $rootScope, SessionService) {
  $scope.errorMessage = '';
  $scope.dataLoading = true;
  $scope.authFailed = false;
  $scope.authSucess = false;
  $scope.token = 'beer';
  var uid = 0;

  var sessionName = SessionService.get('userName');
  if (SessionService.getObject('userData') !== null) {
    var sessionData = SessionService.getObject('userData');
    $scope.drupalUserName = sessionData.current_user.name;
    $rootScope.userData = sessionData;
    uid = sessionData.current_user.uid;
    $scope.dataLoading = false;
    $scope.authSucess = true;
  }
  else {
    $scope.dataLoading = false;
    $scope.authSucess = false;
    $scope.authFailed = true;
  }
  // or can set root scope.
  if ($rootScope.userData.current_user && $rootScope.userData.current_user.name) {
    $scope.drupalUserName = $rootScope.userData.current_user.name;
  }
});

// Log in PAGE
app.controller('LoginCtrl', function ($scope, $http, $rootScope, $httpParamSerializer, $location, SessionService) {
  if ($rootScope.userData.current_user && $rootScope.userData.current_user.name) {
    $location.path('/');
  }
  $scope.password = '';
  $scope.name = '';
  $scope.message = '';
  $scope.messageClass = '';
  $scope.currentUser = {};

  $scope.login = function () {
    if ($scope.name && $scope.password) {
      $scope.message = 'name ' + $scope.name + ' Pass ' + $scope.password;
      var url = $rootScope.baceUrl + 'user/login?_format=json';
      var parameters = JSON.stringify({name:$scope.name, pass: $scope.password});
      $http.post(url, parameters).then(function (data) {
        $rootScope.userData = data.data;
        $scope.currentUser = data.data.current_user;
        $scope.message = 'Welcome'  + data.data.current_user.name;
        $scope.messageClass = 'alert-success';
        // SET SOME STUFF in Session so page refresh
        SessionService.setObject('userData', data.data);
        SessionService.set('userName', data.data.current_user.name);
        $rootScope.XCSRFToken = data.data.csrf_token;
        $http.defaults.headers.csrf_token = data.data.csrf_token;
        $http.defaults.headers.post['X-CSRF-Token'] = data.data.csrf_token;
        $http.defaults.headers.patch['X-CSRF-Token'] = data.data.csrf_token;
        $http.defaults.headers['X-CSRF-Token'] = data.data.csrf_token;

        // kick them to some where else.
        $location.path('/protected');
      }, function (error) {
        $scope.message = error.data.message;
        $scope.messageClass = 'alert-danger';
      });
    }
    else {
      // Set Required message
      $scope.message = 'User name and password are required.';
    }
  };

});

// Protected page.
app.controller('ProtectedCtrl', function ($scope, $http, $rootScope, SessionService, $location) {
  if (SessionService.getObject('userData') !== null) {
    var sessionData = SessionService.getObject('userData');
    $scope.drupalUserName = sessionData.current_user.name;
    $scope.drupalUserId = sessionData.current_user.uid;

    // This Api Endpoint is not realy protected its just an example.
    var url = $rootScope.baceUrl + '/jsonapi/node/article';
    $scope.articles = '';

    $http.get(url).then(function (data) {
      $scope.articles = data.data.data;
      console.log($scope.articles);
    });
  }
  else {
    $location.path('/login');
  }
});

// Article page.
app.controller('nodeDetailCtrl', function ($scope, $routeParams, $http, $rootScope, SessionService) {
  $scope.hasData = false;
  $scope.article = '';
  $scope.dataLoading = true;
  $scope.articleBody = '';
  $scope.isAuthor = false;
  var uuid = $routeParams.uuid;
  var url = $rootScope.baceUrl + '/jsonapi/node/article/' + uuid;
  $http.get(url).then(function (data) {
    $scope.article = data.data.data;
    $scope.userUUID = $scope.article.relationships.uid.data.id;
    $scope.dataLoading = false;
    $scope.hasData = true;
    $scope.articleBody = data.data.data.attributes.body.value;
    // Account stuff.
    if (SessionService.getObject('userData') !== null) {
      $scope.authSucess = true;
      var uuid = SessionService.get('userUUID');
      if (uuid !== null) {
        if ($scope.userUUID === uuid) {
          $scope.isAuthor = true;
        }
      }
    }
  });
});

// create new article
// Article page.
app.controller('CreateCtrl', function ($scope, $routeParams, $http, $rootScope, SessionService, $location) {
  $scope.authSucess = false;
  $scope.message = '';
  $scope.messageClass = '';

  // Account stuff.
  if (SessionService.getObject('userData') !== null) {
    var userData = SessionService.getObject('userData');
    console.log(userData);
    $scope.authSucess = true;
  }
  else {
    $location.path('/login');
  }
  $scope.formData = {};
  $scope.createArticle = function () {
    if ($scope.formData.title && $scope.formData.body) {
      // @ todo make this safer.
      var body = JSON.stringify($scope.formData.body);
      var title = JSON.stringify($scope.formData.title);
      // Post this stuff.
      var dataToPost = '{"title": [{"value": ' + title + '}], "body": [{"value": ' + body + '}], "type": [{"target_id": "article"}]}';
      var url = $rootScope.baceUrl + 'entity/node?_format=json';

      $http.post(url, dataToPost).then(function(data) {
        //console.log(data);
        $scope.message = 'Artical Posted';
        $scope.messageClass = 'alert-success';
        var uuid = data.data.uuid[0].value;
        // set time out redirect.
        $location.path('/article/' + uuid );

      }, function(error) {
        $scope.message = error.data.message;
        $scope.messageClass = 'alert-danger';
      });
    }
  };
});

// RegisterCtrl
app.controller('RegisterCtrl', function ($scope, $routeParams, $http, $rootScope, SessionService, $location) {
  $scope.nonUser = true;
  $scope.message = '';
  $scope.messageClass = '';
  if (SessionService.getObject('userData') !== null) {
    $location.path('/protected');
  }
  else {
    $scope.formData = {};
    $scope.register = function () {
      if ($scope.formData.email && $scope.formData.username && $scope.formData.password) {

        var dataToPost = '{"name": {"value": "' + $scope.formData.username + '"}, "mail": {"value": "' + $scope.formData.email + '"}, "pass": {"value": "'+ $scope.formData.password+'"}}';
        var url = $rootScope.baceUrl + 'user/register?_format=json';
        $http.post(url, dataToPost).then(function(data) {
          //console.log(data);
          $scope.message = 'Success You may now log in';
          $scope.messageClass = 'alert-success';
          console.log(data);
          //var uuid = data.data.uuid[0].value;
          //// set time out redirect.
          //$location.path('/article/' + uuid );
        }, function(error) {
          $scope.message = error.data.message;
          $scope.messageClass = 'alert-danger';
        });
      }
    }
  }
});
// Log out.
app.controller('logoutCtrl', function ($scope, $routeParams, $http, $rootScope, SessionService, $location) {
  if (SessionService.getObject('userData') !== null) {
    var sessionData = SessionService.getObject('userData');
    // Clear session data.
    var url = $rootScope.baceUrl + 'user/logout';
    $http.get(url).then(function(data) {
      didLogout();
    }, function (error) {
      didLogout();
    });

    function didLogout() {
      SessionService.set('userData', null);
      // redirect to home.
      $location.path('/');
    };

  }
  else {
    // yep there is a user session.
    $location.path('/');
  }
});

// edit

app.controller('nodeEditCtrl', function ($scope, $routeParams, $http, $rootScope, SessionService, $location) {
  $scope.authSucess = false;
  $scope.message = '';
  $scope.messageClass = '';
  $scope.dataLoading = true;

  // Account stuff.
  if (SessionService.getObject('userData') !== null) {
    var userData = SessionService.getObject('userData');
    $scope.authSucess = true;
  }
  else {
    $location.path('/login');
  }
  $scope.formData = {};
  $scope.nodeId = '';

  // get the data.
  var uuid = $routeParams.uuid;
  var url = $rootScope.baceUrl + '/jsonapi/node/article/' + uuid;
  $http.get(url).then(function (data) {
    $scope.article = data.data.data;
    $scope.dataLoading = false;
    $scope.hasData = true;
    $scope.formData.body = data.data.data.attributes.body.value;
    $scope.formData.title = data.data.data.attributes.title;
    $scope.nodeId = data.data.data.attributes.nid;
  });

  $scope.updateArticle = function () {

    if ($scope.formData.title && $scope.formData.body) {
      // @ todo make this safer.
      var body = JSON.stringify($scope.formData.body);
      var title = JSON.stringify($scope.formData.title);
      // Post this stuff.
      var dataToPost = '{"title": [{"value": ' + title + '}], "body": [{"value": ' + body + '}], "type": [{"target_id": "article"}]}';
      var url = $rootScope.baceUrl + '/node/'+ $scope.nodeId +'?_format=json';

      $http.patch(url, dataToPost).then(function(data) {
        //console.log(data);
        $scope.message = 'Artical updated';
        $scope.messageClass = 'alert-success';
        var uuid = data.data.uuid[0].value;
        // set time out redirect.
        $location.path('/article/' + uuid );

      }, function(error) {
        $scope.message = error.data.message;
        $scope.messageClass = 'alert-danger';
      });
    }

  };
});
