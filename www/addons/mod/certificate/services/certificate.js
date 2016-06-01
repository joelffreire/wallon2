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

angular.module('mm.addons.mod_certificate')

/**
 * Certificate service.
 *
 * @module mm.addons.mod_certificate
 * @ngdoc service
 * @name $mmaModCertificate
 */
.factory('$mmaModCertificate', function($q, $mmSite, $mmFS, $mmUtil, $mmSitesManager, mmaModCertificateComponent, $mmFilepool) {
    var self = {};

    /**
     * Get a Certificate.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#getCertificate
     * @param {Number} courseId Course ID.
     * @param {Number} cmId     Course module ID.
     * @return {Promise}        Promise resolved when the Certificate is retrieved.
     */
    self.getCertificate = function(courseId, cmId) {
        var params = {
                courseids: [courseId]
            },
            preSets = {
                cacheKey: getCertificateCacheKey(courseId)
            };

        return $mmSite.read('mod_certificate_get_certificates_by_courses', params, preSets).then(function(response) {
            if (response.certificates) {
                var currentCertificate;
                angular.forEach(response.certificates, function(certificate) {
                    if (certificate.coursemodule == cmId) {
                        currentCertificate = certificate;
                    }
                });
                if (currentCertificate) {
                    return currentCertificate;
                }
            }
            return $q.reject();
        });
    };

    /**
     * Get cache key for Certificate data WS calls.
     *
     * @param {Number} courseId Course ID.
     * @return {String}         Cache key.
     */
    function getCertificateCacheKey(courseId) {
        return 'mmaModCertificate:certificate:' + courseId;
    }

    /**
     * Get issued certificates.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#getIssuedCertificates
     * @param {Number} id Certificate ID.
     * @return {Promise}  Promise resolved when the issued data is retrieved.
     */
    self.getIssuedCertificates = function(id) {
        var params = {
                certificateid: id
            },
            preSets = {
                cacheKey: getIssuedCertificatesCacheKey(id)
            };

        return $mmSite.read('mod_certificate_get_issued_certificates', params, preSets).then(function(response) {
            if (response.issues) {
                return response.issues;
            }
            return $q.reject();
        });
    };

    /**
     * Get cache key for Certificate issued data WS calls.
     *
     * @param {Number} id Certificate ID.
     * @return {String}   Cache key.
     */
    function getIssuedCertificatesCacheKey(id) {
        return 'mmaModCertificate:issued:' + id;
    }

    /**
     * Invalidates Certificate data.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#invalidateCertificate
     * @param {Number} courseId Course ID.
     * @return {Promise}        Promise resolved when the data is invalidated.
     */
    self.invalidateCertificate = function(courseId) {
        return $mmSite.invalidateWsCacheForKey(getCertificateCacheKey(courseId));
    };

    /**
     * Invalidates issues certificates.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#invalidateIssuedCertificates
     * @param {Number} id Certificate ID.
     * @return {Promise}  Promise resolved when the data is invalidated.
     */
    self.invalidateIssuedCertificates = function(id) {
        return $mmSite.invalidateWsCacheForKey(getIssuedCertificatesCacheKey(id));
    };

    /**
     * Return whether or not the plugin is enabled in a certain site. Plugin is enabled if the certificate WS are available.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#isPluginEnabled
     * @param  {String} [siteId] Site ID. If not defined, current site.
     * @return {Promise}         Promise resolved with true if plugin is enabled, rejected or resolved with false otherwise.
     */
    self.isPluginEnabled = function(siteId) {
        siteId = siteId || $mmSite.getId();

        return $mmSitesManager.getSite(siteId).then(function(site) {
            return site.wsAvailable('mod_certificate_get_certificates_by_courses');
        });
    };

    /**
     * Report the Certificate as being viewed.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#logView
     * @param {String} id Certificate ID.
     * @return {Promise}  Promise resolved when the WS call is successful.
     */
    self.logView = function(id) {
        if (id) {
            var params = {
                certificateid: id
            };
            return $mmSite.write('mod_certificate_view_certificate', params);
        }
        return $q.reject();
    };

    /**
     * Issue a certificate.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#issueCertificate
     * @param {Number} certificateId Certificate ID.
     * @return {Promise}  Promise resolved when the WS call is successful.
     */
    self.issueCertificate = function(certificateId) {
         var params = {
            certificateid: certificateId
        };
        return $mmSite.write('mod_certificate_issue_certificate', params).then(function(response) {
            if (!response || !response.issue) {
                return $q.reject();
            }
        });
    };

    /**
     * Download or open a downloaded certificate.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#openCertificate
     * @param {Object} issuedCertificate Issued certificate object.
     * @param {Number} moduleId Module id.
     * @return {Promise}  Promise resolved when the WS call is successful.
     */
    self.openCertificate = function(issuedCertificate, moduleId) {

        var siteId = $mmSite.getId(),
            revision = 0,
            timeMod = issuedCertificate.timecreated,
            files = [{fileurl: issuedCertificate.fileurl, filename: issuedCertificate.filename, timemodified: timeMod}];
        if ($mmFS.isAvailable()) {
            // The file system is available.
            promise = $mmFilepool.downloadPackage(siteId, files, mmaModCertificateComponent, moduleId, revision, timeMod).then(function() {
                return $mmFilepool.getUrlByUrl(siteId, issuedCertificate.fileurl, mmaModCertificateComponent, moduleId, timeMod);
            });
        } else {
            // We use the live URL.
            promise = $q.when($mmSite.fixPluginfileURL(issuedCertificate.fileurl));
        }

        return promise.then(function(localUrl) {
            return $mmUtil.openFile(localUrl);
        });
    };

    /**
     * Invalidate downloaded certificates.
     *
     * @module mm.addons.mod_certificate
     * @ngdoc method
     * @name $mmaModCertificate#invalidateDownloadedCertificates
     * @param {Number} moduleId Module id.
     * @return {Promise}  Promise resolved when the WS call is successful.
     */
    self.invalidateDownloadedCertificates = function(moduleId) {
        return $mmFilepool.invalidateFilesByComponent($mmSite.getId(), mmaModCertificateComponent, moduleId);
    };

    return self;
});
