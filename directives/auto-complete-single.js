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
