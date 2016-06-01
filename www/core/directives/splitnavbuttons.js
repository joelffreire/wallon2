// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core')

.directive('mmSplitNavButtons', ['$document', function($document) {
  return {
    require: '^ionNavBar',
    restrict: 'E',
    compile: function(tElement, tAttrs) {
      var side = 'left';

      if (/^primary|secondary|right$/i.test(tAttrs.side || '')) {
        side = tAttrs.side.toLowerCase();
      }

      var spanEle = $document[0].createElement('span');
      spanEle.className = side + '-buttons';
      spanEle.innerHTML = tElement.html();

      var navElementType = side + 'Buttons';

      tElement.attr('class', 'hide');
      tElement.empty();

      return {
        pre: function($scope, $element, $attrs, navBarCtrl) {
          // only register the plain HTML, the navBarCtrl takes care of scope/compile/link

          var parentViewCtrl = $element.parent().parent().parent().parent().parent().data('$ionViewController');
          console.log(parentViewCtrl);

          if (parentViewCtrl) {

          } else {
            parentViewCtrl = $element.parent().data('$ionViewController');
          }

          if (parentViewCtrl) {
            // if the parent is an ion-view, then these are ion-nav-buttons for JUST this ion-view
            parentViewCtrl.navElement(navElementType, spanEle.outerHTML);

          } else {
            // these are buttons for all views that do not have their own ion-nav-buttons
            //navBarCtrl.navElement(navElementType, spanEle.outerHTML);
          }

          spanEle = null;
        }
      };
    }
  };
}]);
