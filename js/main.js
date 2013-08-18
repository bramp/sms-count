'use strict';

// TODO consider _.memoize(function,

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

var app = angular.module('sms', ['ui.codemirror'])
	.controller('SMSController', [ '$scope', function($scope) {
		$scope.editorOptions = {
			lineNumbers: false,
			lineWrapping: true,
			viewportMargin: Infinity,
			onLoad: function(editor) {
				var doc = editor.getDoc();
				editor.on("change", function() {

					var o = validate_gsm(editor.getValue());

					var badChars = _.uniq(_.pluck(o.errors, 'char'));

					if (badChars.length > 0) {
						var regexp = new RegExp( "[" + badChars.join() + "]+" , "g");

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
										cursor.from(),
										cursor.to(),
										{className: 'sms-error', inclusiveLeft:false, inclusiveRight:false}
									);
								}
							}

						});
					}
				});
			}
	    };
	}])
	// Takes a model and outputs a simple counter
	.directive('abSmsCount', function() {
		return {
			require: 'ngModel',
			template: '<div class="alert alert-small" ng-class="{\'alert-success\' : !error, \'alert-error\' : error}">{{remaining}}/{{segments}}</div>',
			link: function (scope, element, attrs, ngModel) {

				scope.$watch(function () {
					return ngModel.$modelValue;
				}, function (v) {
					var o = validate_gsm(v || "");
					_.extend(scope, o);
					scope.error = o.errors.length > 0;
				});
			}
		};
	})
