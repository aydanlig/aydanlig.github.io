const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const imgDir = path.join(rootDir, 'img', 'thankyou-supporters');
const postsFile = path.join(dataDir, 'thankyou-posts.json');
const port = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(imgDir, { recursive: true });
  try {
    await fs.access(postsFile);
  } catch (err) {
    await fs.writeFile(postsFile, '[]', 'utf8');
  }
}

async function readPosts() {
  try {
    const raw = await fs.readFile(postsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

async function writePosts(posts) {
  await fs.writeFile(postsFile, JSON.stringify(posts, null, 2), 'utf8');
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function sanitizeText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function safeBaseName(name) {
  return String(name || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'upload';
}

function extensionFromDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.exec(dataUrl || '');
  if (!match) {
    return null;
  }
  const ext = match[1].toLowerCase();
  return ext === 'jpg' ? 'jpeg' : ext;
}

function stripDataUrlPrefix(dataUrl) {
  const commaIndex = String(dataUrl || '').indexOf(',');
  if (commaIndex === -1) {
    return null;
  }
  return String(dataUrl).slice(commaIndex + 1);
}

async function handleThankYouPost(request, response) {
  const body = await readRequestBody(request, 8 * 1024 * 1024);
  let payload;
  try {
    payload = JSON.parse(body || '{}');
  } catch (err) {
    sendJson(response, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const alias = sanitizeText(payload.alias, 40) || 'Anonymous';
  const message = sanitizeText(payload.message, 600);
  const imageData = String(payload.imageData || '');
  const imageName = sanitizeText(payload.imageName, 80);

  if (!message) {
    sendJson(response, 400, { error: 'Message is required.' });
    return;
  }

  let imageUrl = '';
  if (imageData) {
    const ext = extensionFromDataUrl(imageData);
    if (!ext) {
      sendJson(response, 400, { error: 'Only image uploads are allowed.' });
      return;
    }

    const bufferData = stripDataUrlPrefix(imageData);
    if (!bufferData) {
      sendJson(response, 400, { error: 'Could not read image data.' });
      return;
    }

    const fileBase = `${Date.now()}-${safeBaseName(imageName || alias)}`;
    const fileName = `${fileBase}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const filePath = path.join(imgDir, fileName);
    const buffer = Buffer.from(bufferData, 'base64');
    await fs.writeFile(filePath, buffer);
    imageUrl = `/img/thankyou-supporters/${fileName}`;
  }

  const posts = await readPosts();
  const post = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    alias,
    message,
    imageUrl,
    upvotes: 0,
    createdAt: Date.now()
  };

  posts.unshift(post);
  await writePosts(posts);
  sendJson(response, 201, post);
}

async function handleThankYouPosts(response) {
  const posts = await readPosts();
  sendJson(response, 200, posts);
}

async function handleThankYouVote(request, response) {
  const body = await readRequestBody(request, 64 * 1024);
  let payload;
  try {
    payload = JSON.parse(body || '{}');
  } catch (err) {
    sendJson(response, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const postId = sanitizeText(payload.id, 80);
  if (!postId) {
    sendJson(response, 400, { error: 'Missing post id.' });
    return;
  }

  const posts = await readPosts();
  const post = posts.find((entry) => entry.id === postId);
  if (!post) {
    sendJson(response, 404, { error: 'Post not found.' });
    return;
  }

  post.upvotes = (post.upvotes || 0) + 1;
  await writePosts(posts);
  sendJson(response, 200, post);
}

function readRequestBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = '';
    let received = 0;
    request.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        reject(new Error('Request body too large.'));
        request.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function serveStatic(request, response, pathname) {
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(requestPath).replace(/^([.]{2}[\/\\])+/, '');
  const filePath = path.join(rootDir, normalized);

  if (!filePath.startsWith(rootDir)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    let targetPath = filePath;

    if (stat.isDirectory()) {
      targetPath = path.join(filePath, 'index.html');
    }

    const data = await fs.readFile(targetPath);
    response.writeHead(200, {
      'Content-Type': contentTypeFor(targetPath),
      'Cache-Control': 'no-store'
    });
    response.end(data);
  } catch (err) {
    sendJson(response, 404, { error: 'Not found' });
  }
}

async function requestHandler(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  if (request.method === 'GET' && pathname === '/api/thankyou-posts') {
    await handleThankYouPosts(response);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/thankyou-post') {
    await handleThankYouPost(request, response);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/thankyou-vote') {
    await handleThankYouVote(request, response);
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    await serveStatic(request, response, pathname);
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed' });
}

async function main() {
  await ensureStorage();
  const server = http.createServer((request, response) => {
    requestHandler(request, response).catch((error) => {
      console.error(error);
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Internal server error.' });
      } else {
        response.end();
      }
    });
  });

  server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
