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

angular.module('mm.addons.competency')

/**
 * Controller to handle competency learning plans.
 *
 * @module mm.addons.competency
 * @ngdoc controller
 * @name mmaLearningPlansListCtrl
 */
.controller('mmaLearningPlansListCtrl', function($scope, $mmaCompetency, $mmUtil, $q, $stateParams, $mmUser, $mmSite) {

    var userId = parseInt($stateParams.userid) || false;

    function fetchLearningPlans(refresh) {

        return $mmaCompetency.getLearningPlans(userId).then(function(plans) {
            $scope.plans = plans;

            if (userId && userId != $mmSite.getUserId()) {
                $scope.userId = userId;

                // Get the user profile to retrieve the user image.
                $mmUser.getProfile(userId, undefined, true).then(function(user) {
                    if (typeof $scope.profileLink == 'undefined') {
                        $scope.profileLink = user.profileimageurl || true;
                    }
                }).catch(function() {
                    // Couldn't retrieve the image, use a default icon.
                    $scope.profileLink = true;
                });
            }

        }).catch(function(message) {
            if (!refresh) {
                // Some call failed, retry without using cache.
                return refreshAllData();
            }

            if (message) {
                $mmUtil.showErrorModal(message);
            } else {
                $mmUtil.showErrorModal('Error getting learning plans data.');
            }
            return $q.reject();
        });
    }

    // Convenience function to refresh all the data.
    function refreshAllData() {
        return $mmaCompetency.invalidateLearningPlans(userId).finally(function() {
            return fetchLearningPlans(true);
        });
    }

    fetchLearningPlans().finally(function() {
        $scope.plansLoaded = true;
    });

    // Pull to refresh.
    $scope.refreshLearningPlans = function() {
        refreshAllData().finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    };
});
