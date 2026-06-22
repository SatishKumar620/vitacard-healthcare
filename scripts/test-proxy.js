const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use('/webhook', createProxyMiddleware({
  target: 'http://localhost:5678',
  pathRewrite: { '^/webhook': '/n8n/webhook' },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying to:', proxyReq.path);
    res.end('Proxied to ' + proxyReq.path);
  }
}));
app.listen(3000, () => console.log('Listening on 3000'));
