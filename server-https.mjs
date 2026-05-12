import https from 'node:https';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CERT_DIR = join(__dirname, '.cert');
const KEY_PATH = join(CERT_DIR, 'key.pem');
const CERT_PATH = join(CERT_DIR, 'cert.pem');

if (!existsSync(KEY_PATH) || !existsSync(CERT_PATH)) {
  console.log('Generating self-signed certificate...');
  mkdirSync(CERT_DIR, { recursive: true });
  spawn.sync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', KEY_PATH, '-out', CERT_PATH,
    '-days', '365',
    '-subj', '/CN=192.168.2.248/O=GlobalGuard/C=CN'
  ], { stdio: 'inherit' });
}

const key = readFileSync(KEY_PATH);
const cert = readFileSync(CERT_PATH);

// Start Next.js on a random port
const next = spawn('npx', ['next', 'start', '--port', '3457', '-H', '127.0.0.1'], {
  cwd: __dirname,
  stdio: 'pipe',
  env: { ...process.env, ANTHROPIC_BASE_URL: 'https://api.claudecode.net.cn/api/claudecode/v1', ANTHROPIC_API_KEY: 'sk-ant-api03-r-ltAIok6yca-eBql2TF7p561sHmdLbpVJneI8_d-RtiPclJblpUItgg-Gwq8olZBKbF5VIMkohMSDSmw1vV7A' }
});

next.stdout.on('data', d => process.stdout.write(d));
next.stderr.on('data', d => process.stderr.write(d));

// Wait for Next.js to start
await new Promise(r => setTimeout(r, 3000));

// HTTPS proxy
const server = https.createServer({ key, cert }, (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 3457,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  req.pipe(proxy);
  proxy.on('error', () => { res.writeHead(502); res.end(); });
});

server.listen(3456, '0.0.0.0', () => {
  console.log('HTTPS server on https://0.0.0.0:3456');
});
