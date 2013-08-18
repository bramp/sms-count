
angular.module('sms', [])
	// Takes a model and outputs a simple counter
	.directive('abSmsCount', function() {
		return {
			require: 'ngModel',
			scope: {
				model: '=ngModel'
			},
			template: '{{remaining}}/{{segments}}',
			link: function (scope, elem, attrs, ngModel) {
				scope.$watch("model", function (v) {
					var o = validate_gsm(v || "");
					_.extend(scope, o);
				});
			}
		};
	})
	// Generates a simple text editor that underlines invalid chars
	.directive('abSmsBox', function() {
		return {
			restrict: 'E',
			require: 'ngModel',
			replace: true,
			template: '<div contenteditable="true">One fine body…</div>',

			link: function(scope, element, attrs, ngModel) {

				// Specify how UI should be updated
				ngModel.$render = function() {
					element.html(ngModel.$viewValue || '');
				};

				// Listen for change events to enable binding
				element.on('blur keyup change', function() {
					scope.$apply(read);
				});
				read(); // initialize

				// Write data to the model
				function read() {
					var html = element.html();
					// When we clear the content editable the browser leaves a <br> behind
					// If strip-br attribute is provided then we strip this out
					if( attrs.stripBr && html == '<br>' ) {
						html = '';
					}
					var text = htmlToText(html);
					//var text = html;
					ngModel.$setViewValue(text);
				}

/*
				// view -> model
				elm.on('keypress change input', function() {
					scope.$apply( function() {
						ctrl.$setViewValue(elm.text());
					});
				});

				// model -> view
				ctrl.$render = function() {
					elm.html(ctrl.$viewValue);
				};

				// load init value from DOM
				ctrl.$setViewValue(elm.text());
*/
			}
		};
	});
