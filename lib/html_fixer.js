// HTML FIXER
// ----------

define(function (require, exports, module) {
  'use strict';

  var htmlparser  = require('vendor/htmlparser');

  var emptyTags = htmlparser.DefaultHandler._emptyTags;

  function rebuild (elem) {
    if (Array.isArray(elem)) return elem.map(rebuild).join('');
    if (!elem) return '';

    switch (elem.type) {
      case 'tag':
        if (emptyTags[elem.name]) return '<' + elem.raw + '>';
        /* falls through */
      case 'style':
      case 'script':
        return '<' + elem.raw + '>' + rebuild(elem.children) + '</' + elem.name + '>';
      case 'directive':
        return '<' + elem.raw + '>';
      case 'comment':
        return '<!--' + elem.raw + '-->';
      default:
        return elem.raw;
    }
  }

  function each (obj, fn) {
    for (var key in obj) {
      fn.call(null, obj[key], key, obj);
    }
  }

  function extend (target, source) {
    each(source, function (v, k) {
      target[k] = v;
    });
  }

  module.exports = function (options) {
    var html     = options.HTML     || String(options)
      , includes = options.includes || {}
      , js       = includes.JS      || {}
      , css      = includes.CSS     || {}
      , external = options.external || {}
      , scripts  = external.JS      || []
      , styles   = external.CSS     || []
      ;
console.log(scripts, styles)
      
    scripts = scripts.map(function (src) {
      var raw = 'script src="' + src + '"';
      return {
        raw: raw
      , data: raw
      , type: 'script'
      , name: 'script'
      , attribs: { src: src }
      };
    });

    styles = styles.map(function (href) {
      var raw = 'link rel="stylesheet" href="' + href + '"';
      return {
        raw: raw
      , data: raw
      , type: 'link'
      , name: 'link'
      , attribs: { href: href 
                 , rel: 'stylesheet'
                 }
      };
    });

    var retHTML = null;

    var handler = new htmlparser.DefaultHandler(function (error, dom) {
      if (error) throw error;
      
      // 1. DOCTYPE
      var res = htmlparser.DomUtils.getElements({
        tag_type: 'directive'
      }, dom);

      if (!res.length || !res.filter(function (elem) {
        return !!elem.name.match(/!DOCTYPE/i);
      }).length) {
        dom.unshift({
          raw: '!DOCTYPE html'
        , data: '!DOCTYPE html'
        , type: 'directive'
        , name: '!DOCTYPE' 
        });
      }

      // 2. HTML tag
      var htmlTag, children;

      res = htmlparser.DomUtils.getElements({
        tag_name: 'html'
      }, dom);

      if (!res.length) {
        var siblings = [];
        children = dom.filter(function (el) {
          if (el.type === 'directive' || el.type === 'comment') {
            siblings.push(el);
            return false;
          }
          return true;
        });
        htmlTag = {
          raw: 'html'
        , data: 'html'
        , type: 'tag'
        , name: 'html'
        , attribs: {}
        , children: children
        };
        siblings.push(htmlTag);

        dom = siblings;
      } else {
        htmlTag = res[0];
        if (!Array.isArray(htmlTag.children)) htmlTag.children = [];
      }

      // 3. HEAD tag
      res = htmlparser.DomUtils.getElements({
        tag_name: 'head'
      }, dom);

      var headTag;

      if (!res.length) {
        headTag = {
          raw: 'head'
        , data: 'head'
        , type: 'tag'
        , name: 'head'
        , attribs: {}
        , children: []
        };
        htmlTag.children.unshift(headTag);
      } else {
        headTag = res[0];
      }

      headTag.children = scripts.concat(headTag.children);

      // 4. Body tag.
      res = htmlparser.DomUtils.getElements({
        tag_name: 'body'
      }, dom);

      var bodyTag;

      if (!res.length) {
        var splices = [];
        children = htmlTag.children.filter(function (el, i) {
          if (el.type !== 'directive' && el.name !== 'head' && el.name !== 'html') {
            splices.push(i);
            return true;  
          }
          return false;
        });

        htmlTag.children = htmlTag.children.filter(function (el) {
          return children.indexOf(el) === -1;
        });

        bodyTag = {
          raw: 'body'
        , data: 'body'
        , type: 'tag'
        , name: 'body'
        , attribs: {}
        , children: children
        };

        htmlTag.children.push(bodyTag);
      } else {
        bodyTag = res[0];
      }

      htmlparser.DomUtils.getElements({
        tag_name: 'link'
      , rel: 'stylesheet'
      , href: function (val) {
          return !!css[val];
        }
      }, dom).forEach(function (tag) {
        var cssCode = css[tag.attribs.href];
        extend(tag, {
          raw: 'style'
        , data: 'style'
        , type: 'tag'
        , name: 'style'
        , attribs: {}
        , children: [{
            raw: cssCode
          , data: cssCode
          , type: 'text'
          }]
        });
      });

      htmlparser.DomUtils.getElements({
        tag_name: 'script'
      , src: function (val) {
          return js[val] !== undefined;
        }
      }, dom).forEach(function (tag) {
        var jsCode = js[tag.attribs.src];
        delete tag.attribs.src;

        var attribs = ' ';
        each(tag.attribs, function (v, k) {
          attribs += k + '=' + v;
        });
        if (attribs.length === 1) attribs = '';

        extend(tag, {
          raw: 'script' + attribs
        , children: [{
            raw: jsCode
          , data: jsCode
          , type: 'text'
          }]
        });
      });

      retHTML = rebuild(dom);
    });
    
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
    return retHTML;
  };
});
