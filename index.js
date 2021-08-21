

'use strict';

var nano = require('nano-var-template');

function tpl(t,d,o){
  return tpl.interpolate(t.replace(/(\$\{)/, '{'), d||{}, o || {delimiter : '{}'});
}
tpl.exec = (t,d) => `${t}`(d)
tpl.interpolate = function(template, data, opts){
  var regex,
      lDel,
      rDel,
      delLen,
      lDelLen,
      delimiter,
      // For escaping strings to go in regex
      regexEscape = /([$\^\\\/()|?+*\[\]{}.\-])/g;

  opts = opts || {};

  delimiter = opts.delimiter || '{}';
  delLen = delimiter.length;
  lDelLen = Math.ceil(delLen / 2);
  // escape delimiters for regex
  lDel = delimiter.substr(0, lDelLen).replace(regexEscape, "\\$1");
  rDel = delimiter.substr(lDelLen, delLen).replace(regexEscape, "\\$1") || lDel;

  // construct the new regex
  regex = new RegExp(lDel + "[^" + lDel + rDel + "]+" + rDel, "g");

  return template.replace(regex, function (placeholder) {
    var key = placeholder.slice(lDelLen, -lDelLen),
        keyParts = key.split("."),
        val,
        i = 0,
        len = keyParts.length;

    if (key in data) {
      // need to be backwards compatible with "flattened" data.
      val = data[key];
    }
    else {
      // look up the chain
      val = data;
      for (; i < len; i++) {
        if (keyParts[i] in val) {
          val = val[ keyParts[i] ];
        } else {
          return placeholder;
        }
      }
    }
    return val;
  });
}

tpl.escape = function(templateData){
  var s = templateData[0];
  for (var i = 1; i < arguments.length; i++) {
    var arg = String(arguments[i]);

    // Escape special characters in the substitution.
    s += arg.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    
    s += templateData[i];
  }
  return s;
}

tpl.vals = (strings, ...keys) => {
  return (function(...values) {
    var dict = values[values.length - 1] || {};
    var result = [strings[0]];
    keys.forEach(function(key, i) {
      var value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  });	
}

tpl.expand = (opts) => {
  var sep = opts ? opts.sep : '{}'
  var len = sep.length

  var whitespace = '\\s*'
  var left = escape(sep.substring(0, len / 2)) + whitespace
  var right = whitespace + escape(sep.substring(len / 2, len))

  return function (template, values) {
    Object.keys(values).forEach(function (key) {
      var value = String(values[key]).replace(/\$/g, '$$$$')
      template = template.replace(regExp(key), value)
    })
    return template
  }

  function escape (s) {
    return [].map.call(s, function (char) {
      return '\\' + char
    }).join('')
  }

  function regExp (key) {
    return new RegExp(left + key + right, 'g')
  }
}
tpl.customize =nano;	

module.exports=tpl;