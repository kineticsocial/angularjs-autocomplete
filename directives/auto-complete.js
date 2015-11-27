/**
 * This prepares DOM elements for autocomplete
 */
/* global document */
(function(){
  'use strict';
  var $compile, AutoComplete;

  // <div class="auto-complete-single">
  //   <input ng-model renamed-auto-complete>
  //   <auto-complete-single-div><input><ul></ul></auto-complete-single-div>
  // </div>
  var controller = function($scope, $element, $attrs)  {
    var wrapperDiv = document.createElement('div');
    wrapperDiv.className="auto-complte-single";

    $attrs.valueProperty = $attrs.valueProperty || 'id';
    $attrs.displayProperty = $attrs.displayProperty || 'value';
    $attrs.ngModel = $element[0].getAttribute('ng-model');

    $element[0].parentElement.insertBefore(wrapperDiv, $element[0].nextSibling);
    var autocompleteDiv =
      AutoComplete.getAutocompleteDiv($attrs, 'auto-complete-single-div');
    autocompleteDiv.style.display = 'none';
    wrapperDiv.appendChild($element[0]);
    wrapperDiv.appendChild(autocompleteDiv);
    //rename auto-complete, so that it prevent loop
    $element[0].removeAttribute('auto-complete');
    $element[0].setAttribute('renamed-auto-complete','');

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
