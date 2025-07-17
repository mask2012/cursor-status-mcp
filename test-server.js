#!/usr/bin/env node

import http from "http";
import url from "url";

const PORT = 4090;
const HOST = "127.0.0.1";

// 存储接收到的状态历史
const statusHistory = [];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // 设置 CORS 头，允许跨域请求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 处理 OPTIONS 请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 记录所有请求
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);

  if (pathname === "/status" && req.method === "GET") {
    const cursorStatus = query.cursor_status;

    if (cursorStatus) {
      // 记录状态
      const statusEntry = {
        timestamp,
        status: cursorStatus,
        userAgent: req.headers["user-agent"] || "Unknown",
        ip: req.connection.remoteAddress || req.socket.remoteAddress,
      };

      statusHistory.push(statusEntry);

      // 格式化时间为本地时区
      const localTime = new Date()
        .toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 2,
          hour12: false,
        })
        .replace(/\//g, "-")
        .replace(",", "");

      // 控制台输出 - 只保留时间和状态
      console.log(`${localTime} Status: "${cursorStatus}"`);

      // 响应
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            success: true,
            message: "Status received successfully",
            received_status: cursorStatus,
            timestamp: timestamp,
            total_received: statusHistory.length,
          },
          null,
          2
        )
      );
    } else {
      console.log("⚠️  No cursor_status parameter found");
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            success: false,
            error: "Missing cursor_status parameter",
            received_params: query,
          },
          null,
          2
        )
      );
    }
  } else if (pathname === "/history" && req.method === "GET") {
    // 查看历史记录
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          total: statusHistory.length,
          history: statusHistory,
        },
        null,
        2
      )
    );
  } else if (pathname === "/clear" && req.method === "POST") {
    // 清空历史记录
    statusHistory.length = 0;
    console.log("🗑️  Status history cleared");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "History cleared",
      })
    );
  } else if (pathname === "/" && req.method === "GET") {
    // 根路径 - 显示简单的状态页面
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Cursor Status Test Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .history { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .latest { background: #e8f5e8; border-left: 4px solid #4caf50; }
        h1 { color: #333; }
        h2 { color: #666; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
        .timestamp { color: #888; font-size: 0.9em; }
        .no-data { color: #999; font-style: italic; }
        button { background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #d32f2f; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🎯 Cursor Status Test Server</h1>
        <div class="status">
            <h2>Server Status</h2>
            <p>✅ Server is running on <code>http://127.0.0.1:4090</code></p>
            <p>📊 Total status received: <strong>${statusHistory.length}</strong></p>
            <p>🔄 Page auto-refreshes every 5 seconds</p>
        </div>
        
        <h2>Latest Status</h2>
        ${
          statusHistory.length > 0
            ? `
        <div class="history latest">
            <strong>"${statusHistory[statusHistory.length - 1].status}"</strong>
            <div class="timestamp">Received: ${statusHistory[statusHistory.length - 1].timestamp}</div>
        </div>
        `
            : '<div class="no-data">No status received yet</div>'
        }
        
        <h2>Recent History (Last 10)</h2>
        ${
          statusHistory.length > 0
            ? statusHistory
                .slice(-10)
                .reverse()
                .map(
                  (entry) => `
            <div class="history">
                <strong>"${entry.status}"</strong>
                <div class="timestamp">${entry.timestamp}</div>
            </div>
          `
                )
                .join("")
            : '<div class="no-data">No history available</div>'
        }
        
        <h2>Test Endpoints</h2>
        <ul>
            <li><code>GET /status?cursor_status=test</code> - Main endpoint for receiving status</li>
            <li><code>GET /history</code> - View all received status in JSON format</li>
            <li><code>POST /clear</code> - Clear history</li>
        </ul>
        
        <button onclick="fetch('/clear', {method: 'POST'}).then(() => location.reload())">
            🗑️ Clear History
        </button>
    </div>
</body>
</html>
    `);
  } else {
    // 404 - 未找到
    console.log(`❌ 404 - Path not found: ${pathname}`);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          success: false,
          error: "Endpoint not found",
          available_endpoints: ["GET /", "GET /status?cursor_status=<your_status>", "GET /history", "POST /clear"],
        },
        null,
        2
      )
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log("🚀 ===== CURSOR STATUS TEST SERVER =====");
  console.log(`📍 Server running at http://${HOST}:${PORT}/`);
  console.log(`🎯 Status endpoint: http://${HOST}:${PORT}/status`);
  console.log(`📊 History endpoint: http://${HOST}:${PORT}/history`);
  console.log(`🌐 Web interface: http://${HOST}:${PORT}/`);
  console.log("=====================================");
  console.log("👀 Waiting for cursor status requests...\n");
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

// 错误处理
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please stop any other services using this port.`);
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});
