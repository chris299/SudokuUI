#!/usr/bin/env node
// Minimal static file server (no dependencies)

const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let port = 5173;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--port') {
    const v = parseInt(args[i + 1], 10);
    if (Number.isFinite(v)) port = v;
    i++;
  }
}

const root = process.cwd();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function safeJoin(rootDir, requestPath) {
  const p = path.normalize(requestPath).replace(/^\/+/, '');
  const full = path.join(rootDir, p);
  if (!full.startsWith(path.resolve(rootDir))) return null;
  return full;
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURI((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const full = safeJoin(root, urlPath);
  if (!full) return send(res, 403, 'Forbidden');

  fs.stat(full, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, 'Not Found');
    }
    const ext = path.extname(full);
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(full).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
});

