/* global document */
(function(){
  'use strict';
  var $q, $http, $timeout;

  var addLoading = function(ulEl) {
    ulEl.innerHTML = '<li class="loading"> Loading </li>';
  };

  var removeLoading = function(ulEl) {
    ulEl.querySelector('li.loading') &&
      ulEl.querySelector('li.loading').remove();
  };

  var delay = (function(){
    var timer = 0;
    return function(callback, ms){
      $timeout.cancel(timer);
      timer = $timeout(callback, ms);
    };
  })();

  var defaultListFormatter = function(obj, displayKey, valueKey) { /*jshint ignore:line*/
    if (typeof obj == "object") {
      return obj[displayKey];
    } else {
      return obj;
    }
  };

  // accepted attributes
  var autoCompleteAttrs = [
    'placeholder', 'listFormatter', 'prefillFunc',
    'ngModel', 'valueChanged', 'source', 'pathToData', 'minChars',
    'valueProperty', 'displayProperty', 'ngDisabled'
  ];

  // return dasherized from  underscored/camelcased string
  var dasherize = function(string) {
    return string.replace(/_/g, '-').
      replace(/([a-z])([A-Z])/g, function(_,$1, $2) {
        return $1+'-'+$2.toLowerCase();
      });
  };

  // get style string of an element
  var getStyle = function(el,styleProp) {
    return document.defaultView.
      getComputedStyle(el,null).
      getPropertyValue(styleProp);
  };

  var getRemoteData = function(source, query, pathToData) {
    var deferred = $q.defer(), httpGet;
    if (typeof source == 'string') {
      var keyValues = []; 
      for (var key in query) { // replace all keyword to value
        var regexp = new RegExp(key, 'g');
        if (source.match(regexp)) {
          source = source.replace(regexp, query[key]);
        } else {
          keyValues.push(key + "=" + query[key]);
        }
      }
      if (keyValues.length) {
        var qs = keyValues.join("&");
        source += source.match(/\?[a-z]/i) ? qs : ('?' + qs);
      }
      httpGet = $http.get(source);
    } else if (source.$promise) { 
      httpGet = source(query).$promise;
    } else if (typeof source == 'function') {
      httpGet = source(query);
      httpGet.$promise && (httpGet = source(query).$promise);
      if (!httpGet.then) {
        throw "source function must return a promise";
      }
    }

    httpGet.then(
      function(resp) {
        var list = resp.constructor.name == 'Resource' ? resp : resp.data;
        if (pathToData) {
          var paths = pathToData.split('.');
          paths.forEach(function(el) {
            list = list[el];
          });
        }
        deferred.resolve(list);
      }, 
      function(error) {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  };

  // return auto-complete-single-div or auto-complete-multi-div tag
  // with input and ul tags inside
  var getAutocompleteDiv = function(attrs, tagName, noInput) {
    var autocompleteDiv = document.createElement(tagName);
    autocompleteDiv.className = 'auto-complete-div';

    if (!noInput) {
      var inputEl = document.createElement('input');
      inputEl.setAttribute('placeholder', attrs.placeholder);
      attrs.ngDisabled &&
        inputEl.setAttribute('ng-disabled', attrs.ngDisabled);
      autocompleteDiv.appendChild(inputEl);
    }

    var ulEl = document.createElement('ul');
    autocompleteDiv.appendChild(ulEl);

    autoCompleteAttrs.map(function(attr) {
      if (attrs[attr]) {
        autocompleteDiv.setAttribute(dasherize(attr), attrs[attr]);
      }
    });
    return autocompleteDiv;
  };

  angular.module('angularjs-autocomplete').
    factory('AutoComplete', ['$q', '$http', '$timeout',
      function(_$q_, _$http_, _$timeout_) {
      $q = _$q_, $http = _$http_, $timeout = _$timeout_;
      return {
        addLoading: addLoading,
        removeLoading: removeLoading,
        autoCompleteAttrs: autoCompleteAttrs,
        delay: delay,
        defaultListFormatter: defaultListFormatter,
        dasherize: dasherize,
        getStyle: getStyle,
        getRemoteData: getRemoteData,
        getAutocompleteDiv: getAutocompleteDiv
      };
    }]);
})();
