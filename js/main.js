'use strict';

// TODO consider _.memoize(function,
RegExp.quote = function(str) {
	return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

function findMark(doc, pos2) {
	var marks = doc.findMarksAt(pos2);
	return _.find(marks, function(mark) {
		var pos1 = mark.find().from;
		if (eqPos(pos1, pos2))
			return mark;
	});
}

function eqPos(pos1, pos2) {
	return pos1.line == pos2.line && pos1.ch == pos2.ch;
}

var app = angular.module('sms', ['ui.bootstrap', 'ui.codemirror'])
	.constant('buttonConfig', {
		activeClass: 'btn-primary'
	})
	.controller('SMSController', [ '$scope', function($scope) {

		var encoding = $scope.encoding = "gsm_e";
		$scope.encodings = SMS.encodings;

		var editor, doc;
		$scope.editorOptions = {
			lineNumbers: false,
			lineWrapping: true,
			viewportMargin: Infinity,
			onLoad: function(e) {
				editor = e;
				doc = editor.getDoc();
			}
	    };

	    $scope.$watchCollection('[message, encoding]', function () {
	    	if (!editor || !doc)
	    		return;

	    	// If the encoding changes, clear old marks
	    	if ($scope.encoding != encoding) {
	    		editor.operation(function() {
		    		_.invoke( doc.getAllMarks(), 'clear' );
		    	});
		    	encoding = $scope.encoding;
	    	}

			var validator = SMS.encodings[$scope.encoding].validator;
			var o = validator($scope.message);

			var badChars = _.uniq(_.pluck(o.errors, 'char'));
			if (badChars.length > 0) {
				var regexp = new RegExp( "[" + RegExp.quote(badChars.join('')) + "]+" , "g");

				// Runs everything in a single "transaction"
				editor.operation(function() {
					var cursor = editor.getSearchCursor(regexp);
					while (cursor.findNext()) {
						var mark = findMark(doc, cursor.from());
						if (mark) {
							if (!eqPos(mark.find().to, cursor.to())) {
								mark.clear();
								mark = undefined;
							}
						}

						if (!mark) {
							mark = doc.markText(
								cursor.from(), cursor.to(), {
									className: 'sms-error',
									inclusiveLeft:false,
									inclusiveRight:false
								}
							);
						}
					}

				});
			}
	    });

	}])
	// Takes a model and outputs a simple counter
	.directive('smsCount', function() {
		return {
			require: 'ngModel',
			template: 
				'<div class="alert alert-small" ng-class="{\'alert-success\' : !error, \'alert-error\' : error}">' +
					'{{est_remaining}}/{{segments}}' +
				'</div>',

			link: function (scope, element, attrs, ngModel) {

				function onChange() {
					var encoding = attrs.smsEncoding ? attrs.smsEncoding : "gsm-e";
					var value = ngModel.$modelValue || "";

					var o = SMS.validate(encoding, value);
					angular.extend(scope, o);

					// TODO Change with validator
					scope.error = o.errors.length > 0;
				}

				scope.$watch(function () {
					return ngModel.$modelValue;
				}, onChange);

				attrs.$observe('smsEncoding', onChange);
			}
		};
	})
