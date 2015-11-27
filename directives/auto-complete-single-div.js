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
    vm.controlEl   = vm.parentEl.querySelector('input');

    //block users to modify <input ng-model> directly
    vm.controlEl.readOnly = true;
    //run prefill function
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

      if (vm.inputEl.value.length >= ($scope.minChars||0)) {
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

    //When user clicked on <input ng-model>
    //show <auto-complete-single-div>
    //with <input> covering <input ng-model>
    vm.controlEl.addEventListener('click', function() {
      if (!vm.controlEl.disabled) {
        vm.containerEl.style.display = 'block';
        vm.inputEl.focus();
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

    //text entered to <input>, reload the list
    vm.inputEl.addEventListener('input', function() {
      AutoComplete.delay(function() { //executing after user stopped typing
        vm.loadList();
      }, Array.isArray($scope.source) ? 10 : 500);
    });

    //when focused on input element
    //focus on <input> tag, not <input ng-model>
    vm.inputEl.addEventListener('focus', function() {
      !vm.controlEl.disabled && vm.focusInputEl();
    });

    //when blurred on input element
    //hide all <auto-complete-single-div>, so that user can see as it was
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

    vm.select = function(liEl) {
      liEl.className = '';
      vm.containerEl.style.display = 'none';
      $timeout(function() {
        console.log('liEl.modelValue', liEl.modelValue);
        var modelValue = liEl.modelValue;
        if (typeof modelValue == "object") {
          modelValue.toString = function() {
            return this[$scope.displayProperty]; //Yay!!!
          };
        }
        vm.inputEl.value = '';
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
