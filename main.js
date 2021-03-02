var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var maintitle = 'ToDoList';
var datadir = './data/';


// create data directory to store ToDoList files
!fs.existsSync(datadir) && fs.mkdirSync(datadir);

// create NodeJs server and handle requests
var app = http.createServer(function(request,response){
    var req_url = request.url;
    var queryData = url.parse(req_url, true).query;
    var pathname = url.parse(req_url, true).pathname;

    // root
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir(datadir, function(error, filelist){
          if (error) {
            console.log(error);
            response.writeHead(500);
            response.end('Internal Server Error: root');
            return;
          }
          var title = '';
          var description = `Let's create ${maintitle} <br>To read: Click the title`;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<form><input type=button value='create' onClick="location.href='/create'"></form>`
          );
          response.writeHead(200);
          response.end(html);
        });
      } else {
        // read
        fs.readdir(datadir, function(error, filelist){
          if (error) {
            console.log(error);
            response.writeHead(500);
            response.end('Internal Server Error: read: readdir');
            return;
          }
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`${datadir}${filteredId}`, 'utf8', function(error, description){
            if (error) {
              console.log(error);
              response.writeHead(500);
              response.end('Internal Server Error: read: readFile');
              return;
            }
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description);
            var list = template.list(filelist);
            var html = template.HTML('Read: '+sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2><pre>${sanitizedDescription}</pre>`,
              ` <table><tr><td><form><input type=button value='create' onClick="location.href='/create'"></form></td>
                <td><form><input type=button value='update' onClick="location.href='/update?id=${sanitizedTitle}'"></form></td>
                <td><form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form></td></tr></table>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      // create
      fs.readdir(datadir, function(error, filelist){
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end('Internal Server Error: create: readdir');
          return;
        }
        var title = `${maintitle}`;
        var list = template.list(filelist);
        var html = template.HTML('Create: '+title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="Title To Do"></p>
            <p>
              <textarea name="description" placeholder="Details To Do"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '<h2>Create</h2>');
        response.writeHead(200);
        response.end(html);
      });
    } else if(pathname === '/create_process'){
      // create process
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`${datadir}${title}`, description, 'utf8', function(error){
            if (error) {
              console.log(error);
              response.writeHead(500);
              response.end('Internal Server Error: create_process: writeFile');
              return;
            }
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){
      // update
      fs.readdir(datadir, function(error, filelist){
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end('Internal Server Error: update: readdir');
          return;
        }
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`${datadir}${filteredId}`, 'utf8', function(error, description){
          if (error) {
            console.log(error);
            response.writeHead(500);
            response.end('Internal Server Error: update: readFile');
            return;
          }
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description);
          var list = template.list(filelist);
          var html = template.HTML('Update: '+sanitizedTitle, list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <p><input type="text" name="title" placeholder="title" value="${sanitizedTitle}"></p>
              <p>
                <textarea name="description" placeholder="description">${sanitizedDescription}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            '<h2>Update</h2>'
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      // update process
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`${datadir}${id}`, `${datadir}${title}`, function(error){
            if (error) {
              console.log(error);
              response.writeHead(500);
              response.end('Internal Server Error: update_process: rename');
              return;
            }
            fs.writeFile(`${datadir}${title}`, description, 'utf8', function(error){
              if (error) {
                console.log(error);
                response.writeHead(500);
                response.end('Internal Server Error: update_process: writeFile');
                return;
              }
              response.writeHead(302, {Location: `/?id=${title}`});
              response.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){
      // delete process
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`${datadir}${filteredId}`, function(error){
            if (error) {
              console.log(error);
              response.writeHead(500);
              response.end('Internal Server Error: delete_process: unlink');
              return;
            }
            response.writeHead(302, {Location: `/`});
            response.end();
          })
      });
    } else {
      // page not found
      response.writeHead(404);
      response.end('Page Not found : ' + pathname);
    }
});
app.listen(12345);
