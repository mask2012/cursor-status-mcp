# cursor-status

A Model Context Protocol (MCP) server that provides a tool to set cursor status via HTTP requests.

## ⚠️ For Cursor AI Assistant

When working in this project, always use the `set_cursor_status` tool to track current activities:

1. **开始对话时**: 使用状态 "开始新的对话"
2. **开始编码任务时**: 使用状态 "正在编写代码: [简短描述任务]"
3. **调试问题时**: 使用状态 "正在调试: [问题描述]"
4. **重构代码时**: 使用状态 "正在重构: [文件/功能名]"
5. **完成任务时**: 使用状态 "任务完成: [任务描述]"
6. **遇到错误时**: 使用状态 "解决错误: [错误类型]"

## Features

- Provides a `set_cursor_status` tool for MCP clients
- Sends GET requests to a local status endpoint (`127.0.0.1:4090/status`)
- Easy integration with Cursor IDE via MCP configuration

## Installation

Install globally via npm:

```bash
npm install -g cursor-status
```

Or use directly with npx (recommended):

```bash
npx cursor-status
```

## Usage

### In Cursor IDE

Add the following configuration to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "cursor-status": {
      "command": "npx",
      "args": ["-y", "cursor-status"]
    }
  }
}
```

### Available Tools

#### `set_cursor_status`

Sets the cursor status by sending a GET request to `http://127.0.0.1:4090/status`.

**Parameters:**

- `status` (string, required): The status message to set

**Example usage:**

```
Use the set_cursor_status tool with status "Working on new feature"
```

This will send a GET request to:

```
http://127.0.0.1:4090/status?cursor_status=Working%20on%20new%20feature
```

## Requirements

- Node.js 18 or higher
- A local HTTP server running on `127.0.0.1:4090` that accepts GET requests to `/status` endpoint

## Development

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd cursor-status
npm install
```

Run the server:

```bash
npm start
```

## Error Handling

The server provides detailed error messages for common issues:

- Connection refused (server not running)
- Request timeout (server not responding)
- HTTP errors with status codes

## License

MIT
