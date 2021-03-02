var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./template.js');
var path = require('path'); // filter path (security)
var sanitizeHtml = require('sanitize-html'); // filter script (security)

// App name
var maintitle = 'ToDoList';
// directory to store TodoList as file
var datadir = './data/';

// create data directory to store ToDoList files
!fs.existsSync(datadir) && fs.mkdirSync(datadir);

// create NodeJs server and handle requests
var app = http.createServer(function(request,response){
    var req_url = request.url;
    var queryData = url.parse(req_url, true).query;
    console.log(queryData);
    console.log(queryData.id);
    var pathname = url.parse(req_url, true).pathname;

    ////////////////////////////////////////////////////////////////////////////
    // root
    ////////////////////////////////////////////////////////////////////////////
    if(pathname === '/'){
      // default(main) page
      if(queryData.id === undefined){
        fs.readdir(datadir, function(error, filelist){
          if (error) {
            console.log(error);
            response.writeHead(500);
            response.end('Internal Server Error: root');
            return;
          }
          var title = '';
          var description = `<p>Let's create ${maintitle}</p><p>To read: Click the title</p>`;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `${description}`,
            `<form><input type=button value='create' onClick="location.href='/create'"></form>`
          );
          response.writeHead(200);
          response.end(html);
        });
      } else {
        ////////////////////////////////////////////////////////////////////////////
        // read
        ////////////////////////////////////////////////////////////////////////////
        console.log("Read..................................................");
        fs.readdir(datadir, function(error, filelist){
          if (error) {
            console.log(error);
            response.writeHead(500);
            response.end('Internal Server Error: read: readdir');
            return;
          }
          var filteredId = encodeURIComponent(path.parse(queryData.id).base).replace(/\*/g, "%2A");
          console.log(queryData.id);
          console.log(path.parse(queryData.id).base);
          console.log(encodeURIComponent(path.parse(queryData.id).base).replace(/\*/g, "%2A"));
          fs.readFile(`${datadir}${filteredId}`, 'utf8', function(error, description){
            if (error) {
              console.log(error);
              response.writeHead(500);
              response.end('Internal Server Error: read: readFile');
              return;
            }
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            console.log(sanitizedTitle);
            console.log(encodeURIComponent(sanitizedTitle).replace(/\*/g, "%2A"));
            var sanitizedDescription = sanitizeHtml(description);
            var list = template.list(filelist);
            var html = template.HTML('Read: '+sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2><pre>${sanitizedDescription}</pre>`,
              ` <table><tr><td><form><input type=button value='create' onClick="location.href='/create'"></form></td>
                <td><form><input type=button value='update' onClick="location.href='/update?id=${encodeURIComponent(title).replace(/\*/g, "%2A")}'"></form></td>
                <td><form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${encodeURIComponent(title).replace(/\*/g, "%2A")}">
                  <input type="submit" value="delete">
                </form></td></tr></table>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      ////////////////////////////////////////////////////////////////////////////
      // create
      ////////////////////////////////////////////////////////////////////////////
      console.log("Create..................................................");
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
      ////////////////////////////////////////////////////////////////////////////
      // create process
      ////////////////////////////////////////////////////////////////////////////
      console.log("Create Process..................................................");
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = encodeURIComponent((post.title).replace(/\//g, "").replace(/\\/g, "").replace(/\'/g, "").replace(/\"/g, "")).replace(/\*/g, "%2A")
          //var title = encodeURIComponent(post.title).replace(/\*/g, "%2A").replace(/\//g, "").replace(/\\/g, "");
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
      ////////////////////////////////////////////////////////////////////////////
      // update
      ////////////////////////////////////////////////////////////////////////////
      console.log("Update..................................................");
      fs.readdir(datadir, function(error, filelist){
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end('Internal Server Error: update: readdir');
          return;
        }
        var filteredId = encodeURIComponent(path.parse(queryData.id).base).replace(/\*/g, "%2A");
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
      ////////////////////////////////////////////////////////////////////////////
      // update process
      ////////////////////////////////////////////////////////////////////////////
      console.log("Update Process..................................................");
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = encodeURIComponent(post.id).replace(/\*/g, "%2A");
          //var title = encodeURIComponent(post.title).replace(/\*/g, "%2A");
          var title = encodeURIComponent((post.title).replace(/\//g, "").replace(/\\/g, "")).replace(/\*/g, "%2A")
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
      ////////////////////////////////////////////////////////////////////////////
      // delete process
      ////////////////////////////////////////////////////////////////////////////
      console.log("Delete Process..................................................");
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
      ////////////////////////////////////////////////////////////////////////////
      // page not found
      ////////////////////////////////////////////////////////////////////////////
      response.writeHead(404);
      response.end('Page Not found : ' + pathname);
    }
});
app.listen(12345);
