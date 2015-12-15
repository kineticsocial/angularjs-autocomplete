angular.module('angularjs-autocomplete',[]);

/* global document */
(function(){
  'use strict';
  var $timeout, filterFilter, AutoComplete;

  var controller = function($scope, $element) {
    var vm = this;

    vm.containerEl = $element[0];
    vm.inputEl     = $element[0].querySelector('input');
    vm.ulEl        = $element[0].querySelector('ul');
    vm.parentEl    = $element[0].parentElement; 
    if (vm.parentEl.className.indexOf('auto-complete-multi-wrapper') >= 0) {
      vm.parentEl  = vm.parentEl.parentElement;
    }

    $scope.prefillFunc && $scope.prefillFunc();

    // focus on <input> tag, then empty contents
    vm.focusInputEl = function() {
      vm.ulEl.style.display = 'block';
      vm.inputEl.focus();
      vm.inputEl.value = '';
      vm.loadList();
    };

    // build an <li> tag by data
    vm.getLiEl = function(data, displayProperty, valueProperty) {
      var viewValue =
        typeof el == 'object' ? data[displayProperty] : data;
      var modelValue =
        typeof el == 'object' ? data[valueProperty] : data;
      var liEl = document.createElement('li');

      liEl.model = data;
      liEl.modelValue = modelValue;
      liEl.viewValue = viewValue;
      return liEl;
    };

    // build <ul> tag by data
    vm.addListElements = function(data) {
      var displayKey = $scope.displayProperty,
          valueKey = $scope.valueProperty,
          listFormatter = $scope.listFormatter || AutoComplete.defaultListFormatter;

      data.forEach(function(el) {
        var liEl = vm.getLiEl(el, displayKey, valueKey);
        liEl.innerHTML = listFormatter(el, displayKey, valueKey);
        vm.ulEl.appendChild(liEl);
      });
    };

    // rebuild <ul> tag by removing <li>s first
    vm.loadList = function() {
      while(vm.ulEl.firstChild) {
        vm.ulEl.removeChild(vm.ulEl.firstChild);
      }
      vm.ulEl.style.display = 'none';

      console.log('$scope.ngDisabled', $scope.ngDisabled);
      if (vm.inputEl.value.length >= ($scope.minChars||0) && !$scope.ngDisabled) {
        vm.ulEl.style.display = 'block';
        AutoComplete.addLoading(vm.ulEl);
        if (Array.isArray($scope.source)) { // local source
          var filteredData = filterFilter($scope.source, vm.inputEl.value);
          vm.ulEl.style.display = 'block';
          vm.addListElements(filteredData);
        } else {
          AutoComplete.getRemoteData(
            $scope.source,                 //source
            {keyword: vm.inputEl.value},   //what to search
            $scope.pathToData              //where response data is
          ).then(function(data) {
              AutoComplete.removeLoading(vm.ulEl);
              vm.addListElements(data);
            }, function(){
              AutoComplete.removeLoading(vm.ulEl);
            });
        }
      } // if
      AutoComplete.removeLoading(vm.ulEl);
    };

    // when mouseclicked on <ul> tag, select the given <li> tag
    vm.ulEl.addEventListener('mousedown', function(evt) {
      if (evt.target !== vm.ulEl) {
        var liTag = evt.target;
        while(liTag.tagName !== 'LI') {
          liTag = liTag.parentElement;
        }

        // Select only if it is a <li></li> and the class is not 'loading'
        if(liTag.tagName == 'LI' && liTag.className != "loading"){
          vm.select(liTag);
        }
      }
    });

    //when clicked on autocomplete area, focus on <input> tag
    vm.parentEl.addEventListener('click', function() {
      vm.focusInputEl($scope);
    });

    //text entered to <input>, reload the list
    vm.inputEl.addEventListener('input', function() {
      AutoComplete.delay(function() { //executing after user stopped typing
        vm.loadList();
      }, Array.isArray($scope.source) ? 10 : 500);
      vm.inputEl.setAttribute('size', vm.inputEl.value.length+1);
    });

    //when blurred on input element, hide all <ul>
    vm.inputEl.addEventListener('blur', function() {
      vm.ulEl.style.display = 'none';
    });

    vm.inputEl.addEventListener('keydown', function(evt) {
      var selected = vm.ulEl.querySelector('.selected');
      switch(evt.keyCode) {
        case 27: // ESC
          selected && (selected.className = '');
          vm.ulEl.style.display = 'none';
          break;
        case 38: // UP
          if (selected && selected.previousSibling) {
            selected.className = '';
            selected.previousSibling.className = 'selected';
          }
          break;
        case 40: // DOWN
          vm.ulEl.style.display = 'block';
          if (selected && selected.nextSibling) {
            selected.className = '';
            selected.nextSibling.className = 'selected';
          } else if (!selected) {
            vm.ulEl.firstChild.className = 'selected';
          }
          break;
        case 13: // ENTER
          selected && vm.select(selected);
          if (!$scope.submitOnEnter) {
            evt.preventDefault();
          }
          break;
        case 8: // BACKSPACE
          // remove the last element for multiple and empty input
          if ($scope.inputEl.value === '') {
            $timeout(function() {
              $scope.ngModel.pop();
            });
          }
      }
    });

    vm.select = function(liEl) {
      liEl.className = '';
      vm.ulEl.style.display = 'none';
      $timeout(function() {
        var modelValue = liEl.modelValue;
        if (typeof modelValue == "object") {
          modelValue.toString = function() {
            return this[$scope.displayProperty]; //Yay!!!
          };
        }
        vm.inputEl.value = '';
        $scope.ngModel.push(modelValue);
        $scope.valueChanged({value: liEl.model}); //user scope
      });
    };

  };

  var autoCompleteMultiDiv =
    function(_$timeout_, _filterFilter_, _AutoComplete_) {
      $timeout = _$timeout_;
      filterFilter = _filterFilter_;
      AutoComplete = _AutoComplete_;

      return {
        restrict: 'E',
        controller: controller,
        scope: {
          ngModel: '=',         // output of autocomplete
          source: '=',          // input of autocomplete
          minChars: '=',        // starts with min. number of characters
          listFormatter: '=',   // dropdown <li> contents
          ngDisabled: '=',      // stop indicator
          placeholder: '@',     // placeholder for <input> tag
          pathToData: '@',      // where data exist in source
          valueProperty: '@',   // key of value property in object
          displayProperty: '@', // key of display propety in object
          prefillFunc: '&',     // execute to set the ngModel when initialized
          valueChanged: '&',    // callback when select an item from list
          submitOnEnter: '='    // submit form of <input> when pressed ENTER
        }
      };
    };
  autoCompleteMultiDiv.$inject = ['$timeout', 'filterFilter', 'AutoComplete'];

  angular.module('angularjs-autocomplete').
    directive('autoCompleteMultiDiv', autoCompleteMultiDiv);

  angular.module('angularjs-autocomplete').
    directive('autoCompleteDiv', autoCompleteMultiDiv);
})();

/* global document */
/**
 * This prepares DOM elements for autocomplete
 */
(function(){
  'use strict';
  var $compile, AutoComplete;

  var getAutocompleteMultiWrapper = function(options) {
    var template = [
      '<span ng-repeat="obj in NGMODEL track by $index">',
      '  <span>{{vm.listFormatter(obj)}}</span>',
      '  <a href=""',
      '    ng-click="NGMODEL.splice($index,1);$event.stopPropagation()">x</a>',
      '</span>'
    ].join("\n").replace(/NGMODEL/g, options.ngModel);

    var multiACDiv = document.createElement('div');
    multiACDiv.className = 'auto-complete-multi-wrapper';
    multiACDiv.innerHTML= template;

    return multiACDiv;
  };

  var controller = function($scope, $element, $attrs, $parse) {
    $attrs.valueProperty = $attrs.valueProperty || 'id';
    $attrs.displayProperty = $attrs.displayProperty || 'value';

    // build <div auto-complete-multi-wrapper>
    var wrapperDiv = getAutocompleteMultiWrapper($attrs);
    // build <auto-complete-multi-div>
    var autocompleteMultiDiv =
      AutoComplete.getAutocompleteDiv($attrs, 'auto-complete-multi-div');
    wrapperDiv.appendChild(autocompleteMultiDiv);
    $element[0].appendChild(wrapperDiv);
    $compile($element.contents())($scope);

    if ($attrs.listFormatter) {
      this.listFormatter = $parse($attrs.listFormatter);
    } else {
      this.listFormatter = function(obj) {
        return obj[$attrs.displayProperty || 'value'];
      };
    }
  };
  controller.$inject = ['$scope', '$element', '$attrs', '$parse'];

  angular.module('angularjs-autocomplete').
    directive('autoCompleteMulti', [
      '$compile', 'AutoComplete',
      function(_$compile_, _AutoComplete_) {
        $compile = _$compile_, AutoComplete = _AutoComplete_;
        return {
          controller: controller
        };
      }
    ]);
})();

/* global document */
(function(){
  'use strict';
  var $timeout, filterFilter, AutoComplete;

  var controller = function($scope, $element) {
    var vm = this;

    vm.containerEl = $element[0];
    vm.ulEl        = $element[0].querySelector('ul');
    vm.inputEl     = $element[0].parentElement.querySelector('input');

    $scope.prefillFunc && $scope.prefillFunc(); //run prefill function

    // build an <li> tag by data
    vm.getLiEl = function(data, displayProperty, valueProperty) {
      var viewValue =
        typeof el == 'object' ? data[displayProperty] : data;
      var modelValue =
        typeof el == 'object' ? data[valueProperty] : data;
      var liEl = document.createElement('li');

      liEl.model = data;
      liEl.modelValue = modelValue;
      liEl.viewValue = viewValue;
      return liEl;
    };

    // build <ul> tag by data
    vm.addListElements = function(data) {
      var displayKey = $scope.displayProperty,
          valueKey = $scope.valueProperty,
          listFormatter = $scope.listFormatter || AutoComplete.defaultListFormatter;

      data.forEach(function(el) {
        var liEl = vm.getLiEl(el, displayKey, valueKey);
        liEl.innerHTML = listFormatter(el, displayKey, valueKey);
        vm.ulEl.appendChild(liEl);
      });
    };

    // rebuild <ul> tag by removing <li>s first
    vm.loadList = function() {
      while(vm.ulEl.firstChild) {
        vm.ulEl.removeChild(vm.ulEl.firstChild);
      }
      vm.ulEl.style.display = 'none';

      if (vm.inputEl.value.length >= ($scope.minChars||0)) {
        vm.ulEl.style.display = 'block';
        AutoComplete.addLoading(vm.ulEl);
        if (Array.isArray($scope.source)) { // local source
          var filteredData = filterFilter($scope.source, vm.inputEl.value);
          vm.ulEl.style.display = 'block';
          vm.addListElements(angular.copy(filteredData));
        } else {
          AutoComplete.getRemoteData(
            $scope.source,                 //source
            {keyword: vm.inputEl.value},   //what to search
            $scope.pathToData              //where response data is
          ).then(function(data) {
              AutoComplete.removeLoading(vm.ulEl);
              vm.addListElements(data);
            }, function(){
              AutoComplete.removeLoading(vm.ulEl);
            });
        }
      } // if
      AutoComplete.removeLoading(vm.ulEl);
    };

    //text entered to <input>, reload the list
    vm.inputEl.addEventListener('input', function() {
      vm.containerEl.style.display = 'block';
      AutoComplete.delay(function() { //executing after user stopped typing
        vm.loadList();
      }, Array.isArray($scope.source) ? 10 : 500);
    });

    //when click on input, show autocomplete block
    //when blur on input, hide autocomplete block
    vm.inputEl.addEventListener('click', function() {
      vm.containerEl.style.display = 'block';
    });

    vm.inputEl.addEventListener('blur', function() {
      vm.containerEl.style.display = 'none';
    });

    vm.inputEl.addEventListener('keydown', function(evt) {
      var selected = vm.ulEl.querySelector('.selected');
      switch(evt.keyCode) {
        case 27: // ESC
          selected && (selected.className = '');
          vm.containerEl.style.display = 'none';
          break;
        case 38: // UP
          if (selected && selected.previousSibling) {
            selected.className = '';
            selected.previousSibling.className = 'selected';
          }
          break;
        case 40: // DOWN
          vm.ulEl.style.display = 'block';
          if (selected && selected.nextSibling) {
            selected.className = '';
            selected.nextSibling.className = 'selected';
          } else if (!selected) {
            vm.ulEl.firstChild.className = 'selected';
          }
          break;
        case 13: // ENTER
          selected && vm.select(selected);
          if (!$scope.submitOnEnter) {
            evt.preventDefault();
          }
          break;
      }
    });

    // when mouseclicked on <ul> tag, select the given <li> tag
    vm.ulEl.addEventListener('mousedown', function(evt) {
      if (evt.target !== vm.ulEl) {
        var liTag = evt.target;
        while(liTag.tagName !== 'LI') {
          liTag = liTag.parentElement;
        }

        // Select only if it is a <li></li> and the class is not 'loading'
        if(liTag.tagName == 'LI' && liTag.className != "loading"){
          vm.select(liTag);
        }
      }
    });

    vm.select = function(liEl) {
      liEl.className = '';
      $timeout(function() {
        vm.containerEl.style.display = 'none';
        console.log('liEl.modelValue', liEl.modelValue);
        var modelValue = liEl.modelValue;
        if (typeof modelValue == "object") {
          modelValue.toString = function() {
            return this[$scope.displayProperty]; //Yay!!!
          };
        }
        $scope.ngModel = modelValue;
        $scope.valueChanged({value: liEl.model}); //user scope
      });
    };

  };

  var autoCompleteSingleDiv =
    function(_$timeout_, _filterFilter_, _AutoComplete_) {
      $timeout = _$timeout_;
      filterFilter = _filterFilter_;
      AutoComplete = _AutoComplete_;

      return {
        restrict: 'E',
        controller: controller,
        scope: {
          ngModel: '=',         // output of autocomplete
          source: '=',          // input of autocomplte
          minChars: '=',        // starts with min. number of characters
          listFormatter: '=',   // dropdown <li> contents
          pathToData: '@',      // where data exist in source
          valueProperty: '@',   // key of value property in object
          displayProperty: '@', // key of display propety in object
          prefillFunc: '&',     // execute to set the ngModel when initialized
          valueChanged: '&',    // callback when select an item from list
          submitOnEnter: '='    // submit form of <input> when pressed ENTER
        }
      };
    };
  autoCompleteSingleDiv.$inject = ['$timeout', 'filterFilter', 'AutoComplete'];

  angular.module('angularjs-autocomplete').
    directive('autoCompleteSingleDiv', autoCompleteSingleDiv);
})();

/**
 * This prepares DOM elements for autocomplete
 */
(function(){
  'use strict';
  var AutoComplete;

  // <auto-complete-div-single><input><ul></ul></autocomplete-div-single>
  var compileFunc = function(element, attrs)  {
    var controlEl = element[0].querySelector('input');

    attrs.valueProperty = attrs.valueProperty || 'id';
    attrs.displayProperty = attrs.displayProperty || 'value';
    attrs.ngModel = controlEl.getAttribute('ng-model');

    var autocompleteDiv =
      AutoComplete.getAutocompleteDiv(attrs, 'auto-complete-single-div');
    element[0].appendChild(autocompleteDiv);
  };

  angular.module('angularjs-autocomplete').
    directive('autoCompleteSingle', ['AutoComplete',
      function(_AutoComplete_) {
        AutoComplete = _AutoComplete_;
        return {
          compile: compileFunc,
        };
      }
  ]);
})();

/**
 * This prepares DOM elements for autocomplete
 */
/* global document */
(function(){
  'use strict';
  var $compile, AutoComplete;

  // <div class="auto-complete-single">
  //   <input ng-model noloop-auto-complete>
  //   <auto-complete-single-div><input><ul></ul></auto-complete-single-div>
  // </div>
  var controller = function($scope, $element, $attrs)  {
    var wrapperDiv = document.createElement('div');
    wrapperDiv.className="auto-complete-single";

    $attrs.valueProperty = $attrs.valueProperty || 'id';
    $attrs.displayProperty = $attrs.displayProperty || 'value';
    $attrs.ngModel = $element[0].getAttribute('ng-model');

    $element[0].parentElement.insertBefore(wrapperDiv, $element[0].nextSibling);
    var autocompleteDiv =
      AutoComplete.getAutocompleteDiv($attrs, 'auto-complete-single-div', true);
    autocompleteDiv.style.display = 'none';
    wrapperDiv.appendChild($element[0]);
    wrapperDiv.appendChild(autocompleteDiv);
    //rename auto-complete, so that it prevent loop
    $element[0].removeAttribute('auto-complete');
    $element[0].setAttribute('noloop-auto-complete','');

    $compile(angular.element(wrapperDiv).contents())($scope);
  };
  controller.$inject = ['$scope', '$element', '$attrs'];

  angular.module('angularjs-autocomplete').
    directive('autoComplete', ['$compile', 'AutoComplete',
      function(_$compile_, _AutoComplete_) {
        $compile = _$compile_;
        AutoComplete = _AutoComplete_;
        return {
          restrict: 'A',
          controller: controller
        };
      }
  ]);
})();

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
