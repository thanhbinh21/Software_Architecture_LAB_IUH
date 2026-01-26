const http = require("http");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();

const servers = ["http://localhost:3001", "http://localhost:3002"];
let i = 0;

http
  .createServer((req, res) => {
    const target = servers[i++ % servers.length];
    proxy.web(req, res, { target });
  })
  .listen(8080, () => {
    console.log("Load balancer running on port 8080");
  });
