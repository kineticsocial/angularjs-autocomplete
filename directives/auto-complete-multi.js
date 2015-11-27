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
