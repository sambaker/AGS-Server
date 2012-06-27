
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
