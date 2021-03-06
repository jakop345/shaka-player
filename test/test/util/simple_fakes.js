/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('shaka.test.FakeAbrManager');
goog.provide('shaka.test.FakeDrmEngine');
goog.provide('shaka.test.FakeManifestParser');
goog.provide('shaka.test.FakeStreamingEngine');



/**
 * A fake AbrManager.
 *
 * @constructor
 * @struct
 * @implements {shakaExtern.AbrManager}
 */
shaka.test.FakeAbrManager = function() {
  /** @type {number} */
  this.chooseIndex = 0;

  /** @type {!Array.<shakaExtern.Variant>} */
  this.variants = [];

  /** @type {!Array.<shakaExtern.Stream>} */
  this.textStreams = [];

  spyOn(this, 'chooseStreams').and.callThrough();
  spyOn(this, 'stop');
  spyOn(this, 'init');
  spyOn(this, 'enable');
  spyOn(this, 'disable');
  spyOn(this, 'segmentDownloaded');
  spyOn(this, 'getBandwidthEstimate');
  spyOn(this, 'setDefaultEstimate');
  spyOn(this, 'setTextStreams').and.callThrough();
  spyOn(this, 'setVariants').and.callThrough();
};


/** @override */
shaka.test.FakeAbrManager.prototype.stop = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.init = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.enable = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.disable = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.segmentDownloaded = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.getBandwidthEstimate = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.setDefaultEstimate = function() {};


/** @override */
shaka.test.FakeAbrManager.prototype.chooseStreams = function(
    mediaTypesToUpdate) {
  var ret = {};
  var variant = this.variants[this.chooseIndex];

  var textStream = null;
  if (this.textStreams.length > this.chooseIndex)
    textStream = this.textStreams[this.chooseIndex];

  if (mediaTypesToUpdate.indexOf('audio') > -1 ||
      mediaTypesToUpdate.indexOf('video') > -1) {
    if (variant.audio) ret['audio'] = variant.audio;
    if (variant.video) ret['video'] = variant.video;
  }

  if (mediaTypesToUpdate.indexOf('text') > -1 && textStream)
    ret['text'] = textStream;

  return ret;
};


/** @override */
shaka.test.FakeAbrManager.prototype.setVariants = function(variants) {
  this.variants = variants;
};


/** @override */
shaka.test.FakeAbrManager.prototype.setTextStreams = function(streams) {
  this.textStreams = streams;
};



/**
 * A fake DrmEngine.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.DrmEngine}
 * @return {!Object}
 */
shaka.test.FakeDrmEngine = function() {
  var resolve = Promise.resolve.bind(Promise);
  var offlineSessionIds = [];
  var drmInfo = null;

  var ret = jasmine.createSpyObj('FakeDrmEngine', [
    'destroy', 'configure', 'init', 'attach', 'initialized', 'keySystem',
    'getSupportedTypes', 'getDrmInfo', 'getSessionIds', 'isSupportedByKeySystem'
  ]);
  ret.destroy.and.callFake(resolve);
  ret.init.and.callFake(resolve);
  ret.attach.and.callFake(resolve);
  ret.initialized.and.returnValue(true);
  ret.keySystem.and.returnValue('com.example.fake');
  // See shaka.test.ManifestGenerator.protototype.createStream.
  ret.getSupportedTypes.and.returnValue(
      ['video/mp4; codecs="avc1.4d401f"']);

  ret.setSessionIds = function(sessions) {
    offlineSessionIds = sessions;
  };
  ret.setDrmInfo = function(info) { drmInfo = info; };
  ret.getDrmInfo.and.callFake(function() { return drmInfo; });
  ret.getSessionIds.and.callFake(function() {
    return offlineSessionIds;
  });
  ret.isSupportedByKeySystem.and.returnValue(true);

  return ret;
};


/** @type {jasmine.Spy} */
shaka.test.FakeDrmEngine.prototype.init;


/** @type {jasmine.Spy} */
shaka.test.FakeDrmEngine.prototype.attach;


/** @param {?shakaExtern.DrmInfo} info */
shaka.test.FakeDrmEngine.prototype.setDrmInfo;


/** @param {!Array.<string>} sessions */
shaka.test.FakeDrmEngine.prototype.setSessionIds;



/**
 * A fake StreamingEngine.
 *
 * @constructor
 * @param {shakaExtern.Period} period
 * @struct
 * @extends {shaka.media.StreamingEngine}
 * @return {!Object}
 */
shaka.test.FakeStreamingEngine = function(period) {
  var resolve = Promise.resolve.bind(Promise);
  var activeStreams = {};
  if (period.variants.length) {
    var variant = period.variants[0];
    if (variant.audio)
      activeStreams['audio'] = variant.audio;
    if (variant.video)
      activeStreams['video'] = variant.video;
  }

  if (period.textStreams.length)
    activeStreams['text'] = period.textStreams[0];

  var ret = jasmine.createSpyObj('fakeStreamingEngine', [
    'destroy', 'configure', 'init', 'getCurrentPeriod', 'getActiveStreams',
    'notifyNewTextStream', 'switch', 'seeked'
  ]);
  ret.destroy.and.callFake(resolve);
  ret.getCurrentPeriod.and.returnValue(period);
  ret.getActiveStreams.and.returnValue(activeStreams);
  ret.notifyNewTextStream.and.callFake(resolve);
  ret.switch.and.callFake(function(type, stream) {
    activeStreams[type] = stream;
  });
  return ret;
};


/** @type {jasmine.Spy} */
shaka.test.FakeStreamingEngine.prototype.init;



/**
 * Creates a fake manifest parser.
 *
 * @constructor
 * @param {shakaExtern.Manifest} manifest
 * @struct
 * @implements {shakaExtern.ManifestParser}
 */
shaka.test.FakeManifestParser = function(manifest) {
  /** @private {shakaExtern.Manifest} */
  this.manifest_ = manifest;

  spyOn(this, 'start').and.callThrough();
  spyOn(this, 'stop').and.callThrough();
  spyOn(this, 'configure');
};


/** @override */
shaka.test.FakeManifestParser.prototype.start = function() {
  return Promise.resolve(this.manifest_);
};


/** @override */
shaka.test.FakeManifestParser.prototype.stop = function() {
  return Promise.resolve();
};


/** @override */
shaka.test.FakeManifestParser.prototype.configure = function() {};


/**
 * Creates a fake video element.
 * @param {number=} opt_currentTime
 * @return {!HTMLVideoElement}
 * @suppress {invalidCasts}
 */
function createMockVideo(opt_currentTime) {
  var video = {
    src: '',
    textTracks: [],
    currentTime: opt_currentTime || 0,
    addTextTrack: jasmine.createSpy('addTextTrack'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
    removeAttribute: jasmine.createSpy('removeAttribute'),
    load: jasmine.createSpy('load'),
    dispatchEvent: jasmine.createSpy('dispatchEvent'),
    on: {}  // event listeners
  };
  video.addTextTrack.and.callFake(function(kind, id) {
    // TODO: mock TextTrack, if/when Player starts directly accessing it.
    var track = {};
    video.textTracks.push(track);
    return track;
  });
  video.addEventListener.and.callFake(function(name, callback) {
    video.on[name] = callback;
  });
  return /** @type {!HTMLVideoElement} */ (video);
}
