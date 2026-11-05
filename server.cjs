const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.THANKSGIVING_PORT || 8080);
const files = {
  '/':'index.html',
  '/index.html':'index.html',
  '/style.css':'style.css',
  '/recipes.js':'recipes.js',
  '/es.js':'es.js',
  '/planner.js':'planner.js',
  '/amounts.js':'amounts.js',
  '/app.js':'app.js'
};
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript'};
const server = http.createServer((request,response)=>{
  const route = request.url.split('?')[0];
  if (!['GET','HEAD'].includes(request.method) || !Object.hasOwn(files,route)) {
    response.writeHead(404).end('Page not found');
    return;
  }
  const file = files[route];
  fs.readFile(path.join(__dirname,file),(error,content)=>{
    if (error) { response.writeHead(500).end('Could not read the app file'); return; }
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]+'; charset=utf-8','Cache-Control':'no-store'});
    response.end(request.method==='HEAD' ? undefined : content);
  });
});
server.listen(port,'127.0.0.1',()=>{
  console.log('Thanksgiving at Home is ready at http://127.0.0.1:'+server.address().port);
});
