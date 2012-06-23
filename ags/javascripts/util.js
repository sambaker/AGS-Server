
function injectJS(jsUrl, jsOnload, addRandomParam)
{
  var _i = this;

  _i.scriptTag = null;
  
  _i.jsUrl = null;
  _i.jsOnload = null;
  _i.addRandomParam = null;

  _i.callbackName = "jsonp" + Awe.getGuidNumeric();
  
  window[_i.callbackName] = function(data) {
    if (_i.jsOnload)
    {
      _i.jsOnload(data);
    }
    _headTag.removeChild(_i.scriptTag);
    window[_i.callbackName] = null;
  }

  _i.constructor = function() {

    _i.jsUrl = jsUrl;
    if (_i.jsUrl.indexOf('?') < 0) {
      _i.jsUrl += '?';
    } else {
      _i.jsUrl += '&';
    }
    _i.jsUrl += "callback="+_i.callbackName;
    _i.jsOnload = jsOnload;
    _i.addRandomParam = addRandomParam;
    
    _headTag = window._headTag || document.getElementsByTagName("HEAD")[0];
    _i.scriptTag = document.createElement("SCRIPT");
    _i.scriptTag.type = 'text/javascript';

    if ( _i.addRandomParam == true )
    {
      _i.jsUrl += "&randomParam=" + Math.round(Math.random() * 100000);
    }
    
    _i.scriptTag.src = _i.jsUrl;
    _headTag.appendChild(_i.scriptTag);
  }


  _i.constructor();

}
