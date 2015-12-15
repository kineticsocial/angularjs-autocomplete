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
