#!/usr/bin/env node
const http = require("http");

const targetUrl = process.argv[2] || "http://127.0.0.1:3000/api/db/status";
const timeoutMs = parseInt(process.argv[3] || "30000", 10);
const start = Date.now();

console.log(`[HealthCheck] Waiting for ${targetUrl} (timeout: ${timeoutMs}ms)...`);

function check() {
  http.get(targetUrl, (res) => {
    if (res.statusCode && res.statusCode < 500) {
      console.log(`[HealthCheck] Server is ready! Status: ${res.statusCode} (${Date.now() - start}ms)`);
      process.exit(0);
    } else {
      retry();
    }
  }).on("error", () => {
    retry();
  });
}

function retry() {
  if (Date.now() - start > timeoutMs) {
    console.error(`[HealthCheck] Timeout waiting for server after ${timeoutMs}ms`);
    process.exit(1);
  }
  setTimeout(check, 500);
}

check();
