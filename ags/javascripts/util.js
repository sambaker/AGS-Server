
function injectJS(jsUrl, jsOnload, addRandomParam)
{
	var scriptTag = null;
	
	var callbackName = "jsonp" + Awe.getGuidNumeric();

	_headTag = window._headTag || document.getElementsByTagName("HEAD")[0];

	window[callbackName] = function(data) {
		if (jsOnload)
		{
			jsOnload(data);
		}
		_headTag.removeChild(scriptTag);
		window[callbackName] = null;
	}

	if (jsUrl.indexOf('?') < 0) {
		jsUrl += '?';
	} else {
		jsUrl += '&';
	}
	jsUrl += "callback="+callbackName;
	
	scriptTag = document.createElement("SCRIPT");
	scriptTag.type = 'text/javascript';

	if ( addRandomParam )
	{
		jsUrl += "&randomParam=" + Math.round(Math.random() * 100000);
	}
	
	scriptTag.src = jsUrl;
	_headTag.appendChild(scriptTag);
}

function createSelect(parent, selectId, labelText, options, callback) {
	var root = Awe.createElement('div', parent, {
		className: "control-group"
	});

	if (labelText) {
		var label = Awe.createElement('label', root, {
			className: "control-label",
			attrs: {
				innerText: labelText
			},
			setAttrs: {
				"for" : selectId
			}
		});
	}

	var wrapper = Awe.createElement('div', root, {
		className: "controls"
	});

	var select = Awe.createElement('select', wrapper, {
		attrs: {
			id: selectId
		}
	});

	for (var k in options) {
		if (options.hasOwnProperty(k)) {
			var option = options[k];
			var item = Awe.createElement('option', select, {
				attrs: {
					selected: option.selected ? "selected" : "",
					value: k,
					innerText: option.text
				}
			});
		}
	}

	if (callback) {
		$(select).change(callback);
	}

	return root;
}