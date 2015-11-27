AngularJS Autocomplete
======================
Single and Multiple autocomplete

Features
--------

  * It does not require more tags such as &lt;ui-select-match>, &lt;ui-select-choices>, or &lt;autocomplete>
  * It treat INPUT element as INPUT element

To Get Started
--------------

For Bower users,

  `$ bower install angularjs-autocomplete`

1. Include `angularjs-autocomplete.min.js` and `angularjs-autocomplete.css`

           <script src="angularjs-autocomplete.min.js"></script>
           <link rel="stylesheet" href="angularjs-autocomplete.css" />

2. add it as a dependency

    `var myApp = angular.module('myApp', ['angularjs-autocomplete']);`

3. Use it

           <div auto-complete-single source="vm.source">
             <input ng-model="vm.myVar" placeholder="Enter Text" />
           </div>

Example:

  * [Single Autocomplete](https://rawgit.com/allenhwkim/angularjs-autocomplete/master/test/autocomplete.single.html)
  * [Multiple Autocomplete](https://rawgit.com/allenhwkim/angularjs-autocomplete/master/test/autocomplete.multi.html)
  * [Multiple Custom Autocomplete](https://rawgit.com/allenhwkim/angularjs-autocomplete/master/test/autocomplete.multi.custom.html)

Attributes
--------

  * **source**(required) :
     scope variable or function which is identified as a source of autocomplete
    It coule be array, url, or a function

    * array example:
      * ["this", "is", "array", "of", "text"]
      * [{id:1, value:'One'}, {id:2, value:'Two'}, {id:3, value:'Three'}, {id:4, value:'Four'}]

    * url example
      * e.g., "http://maps.googleapis.com/maps/api/geocode/json?address=:keyword"

    * function example

          function(param) {
            return $http.get("http://maps.googleapis.com/maps/api/geocode/json?address="+param.keyword);
          }

  * **ng-model**(required) :
     ng-model for INPUT or SELECT element

  * **ng-disabled**(optional) :
     disables autocomplete by disabling input tag

  * **value-Changed**(optional) :
     callback function when value is changed. Takes an argument as selected value.  In example,

        $scope.callback = function(arg) {
          $scope.selected = arg;
        };

  * **value-property**(optional):
    "id" as default. When you define an array of hashes as source, the key of hash for ng-model value.
    e.g., 'key'

  * **display-property**(optional) :
    "value" as default. When you define an array of hashes as source, the key of hash for display.
    e.g., 'text'

  * **min-chars**(optional):
    0 as default, if defined, autocomplete won't show any until length of input is greater than minimum charaters.

  * **prefill-func**(optional):
    A function, the provided function will be run before showing autocomplete section

  * **list-formatter**(optional):
    A function, the provided functoin will be used to format dropdown list

License
=======

  [MIT License](https://github.com/allenhwkim/angularjs-autocomplete/blob/master/LICENSE)
