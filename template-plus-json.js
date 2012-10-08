this.TemplatePlusJson = {};

(function(TemplatePlusJson) {
	TemplatePlusJson.postAutos = [];
	TemplatePlusJson.addPostAuto = function(fn) {
		TemplatePlusJson.postAutos.push(fn);
	};
	TemplatePlusJson.workers = 0;
	TemplatePlusJson.runPostAutos = function() {
		$.each(TemplatePlusJson.postAutos,function(idx, fn) {
			fn();
		});
	};
	// automatically combine any templates and json if they have the t-p-j-auto class and then run all the postAutos functions
	$(function() {
		$('.t-p-j-auto').each(function() {
			TemplatePlusJson.workers++;
			$this = $(this);
			(new TemplatePlusJson.Combiner($this.attr('data-template'), 
			$this.attr('data-json'), 
			function () {
				$this.html(this.combinedResponse);
				TemplatePlusJson.workers--;
				if (!TemplatePlusJson.workers) {
					TemplatePlusJson.runPostAutos();
				}
			},
			$this.attr('data-root'))).load();
		});
	});
	TemplatePlusJson.Combiner = function(inTemplateUrl, inJSONUrl, callback, rootNameToAdd ) {
		this.templateUrl = inTemplateUrl ? inTemplateUrl : "";
		this.jsonUrl = inJSONUrl ? inJSONUrl : "";
		this.rootName = rootNameToAdd ? rootNameToAdd : null;
		this.combinedResponse = "";
		this.compiledTemplate = null;
		this.jsonRetrieved = false;
		this.templateRetrieved = false;
		this.callback = callback ? callback : function () {};
		this.jsonData = {};
		this.jsonPreprocess = function(rootName) {
			if (rootName) {
				var jsonData = this.jsonData;
				this.jsonData = {};
				this.jsonData[rootName] = jsonData;
			}
		};
		this.combining = false;
		this.invalidateTemplate = function () { this.compiledTemplate = null; }
		this.invalidateJSON = function () { jsonData = {}; }
		this.retrieveTemplate = function () {
			var callingTPJ = this;
		  $.get(this.templateUrl, function (responseText) {
			callingTPJ.compiledTemplate = Handlebars.compile(responseText);
			callingTPJ.templateRetrieved = true;
			callingTPJ.combine();
		  });
		};
		this.retrieveJSON = function (rootName) {
		  var callingTPJ = this;
		  $.getJSON(this.jsonUrl, function(responseJSON) {
			callingTPJ.jsonData = responseJSON;
			callingTPJ.jsonPreprocess(rootName);
			callingTPJ.jsonRetrieved = true;
			callingTPJ.combine();
		  });
		};
		this.combine = function () {
			if ( this.combining || !this.templateRetrieved || !this.jsonRetrieved) {
				return;
			}
			this.combining = true;
			this.combinedResponse = this.compiledTemplate(this.jsonData);
			this.callback();
			this.jsonRetrieved = false;
			this.templateRetrieved = false;
		};
		this.load = function(callback) {
			if (callback) {
				this.callback = callback;
			}
			this.retrieveJSON(this.rootName);
			this.retrieveTemplate();
		};
		this.reload = function(callback, clearJSON, clearTemplate) {
			clearJSON = typeof clearJSON !== 'undefined' ? clearJSON : true;
			clearTemplate = typeof clearTemplate !== 'undefined' ? clearTemplate : false;
			// if null is passed for callback we want to keep our old callback.
			this.callback = callback ? callback : this.callback;
			if (clearTemplate) {
			  this.invalidateTemplate();
			}
			if (clearJSON) {
			  this.invalidateJSON();
			}
			this.load();
		};
	};
}(this.TemplatePlusJson));

