stuff('http://localhost:8888/index.html', function (context) {
  var html = CodeMirror.fromTextArea($('#html'), {
    onChange: reload
  , mode: 'text/html'
  });
  var js = CodeMirror.fromTextArea($('#js'), {
    onChange: reload
  , mode: 'javascript'
  });
  var css = CodeMirror.fromTextArea($('#css'), {
    onChange: reload
  , mode: 'css'
  });

  var t = null;
  function reload () {
    clearTimeout(t);
    t = setTimeout(function () {      
      var code = '<!DOCTYPE html><html><head>';
      code += '<style>'  + css.getValue() + '</style>';
      code += '<body>' + html.getValue();
      code += '<script>' + js.getValue() + '</script>';
      code += '</body></html>';
      context.load(code);
    }, 50);
  }
  reload();
});