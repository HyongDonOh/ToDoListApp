var urlencode = require('urlencode'); // prevent error on filename

module.exports = {
  HTML:function(title, list, body, control){
    return `
    <!doctype html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">ToDoList</a></h1>
      ${list}
      <br><br>
      ${control}
      ${body}
    </body>
    </html>
    `;
  },list:function(filelist){
    var list = '<ul>';
    var i = 0;
    while(i < filelist.length){
      list = list + `<li><a href="/?id=${filelist[i]}">${urlencode.decode(filelist[i])}</a></li>`;
      i = i + 1;
    }
    list = list+'</ul>';
    return list;
  }
}
