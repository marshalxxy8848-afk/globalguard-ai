import https from 'node:https';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const NPX = 'C:\\Program Files\\nodejs\\npx.cmd';
const key = readFileSync(join(process.cwd(), '.cert/key.pem'));
const cert = readFileSync(join(process.cwd(), '.cert/cert.pem'));

const next = spawn(NPX, ['next', 'start', '--port', '3457', '-H', '127.0.0.1'], {
  cwd: process.cwd(), stdio: 'inherit',
  env: { ...process.env,
    ANTHROPIC_BASE_URL: 'https://api.claudecode.net.cn/api/claudecode/v1',
    ANTHROPIC_API_KEY: 'sk-ant-api03-r-ltAIok6yca-eBql2TF7p561sHmdLbpVJneI8_d-RtiPclJblpUItgg-Gwq8olZBKbF5VIMkohMSDSmw1vV7A'
  }
});

setTimeout(() => {
  https.createServer({ key, cert }, (req, res) => {
    const opts = { hostname: '127.0.0.1', port: 3457, path: req.url, method: req.method,
      headers: { ...req.headers, host: '127.0.0.1:3457', connection: 'close' } };
    const proxy = http.request(opts, (pr) => {
      res.writeHead(pr.statusCode, pr.headers);
      pr.pipe(res);
    });
    req.pipe(proxy);
    proxy.on('error', () => { res.writeHead(502); res.end('Bad Gateway'); });
  }).listen(3456, '0.0.0.0', () => console.log('HTTPS :3456 → HTTP :3457'));
}, 4000);
