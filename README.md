## 如何使用

1. 全局安装

```bash
   npm install -g cursor-status
```

2. mcp 里添加配置

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

## 规则

把如下规则放到 userRules 里就是全局生效，放到项目根目录下的.cursorrules 里就是项目内生效

- 单次对话开始时，首先调用 set_cursor_status 工具，使用状态 "工作中: [描述]"
- 单次对话结束前，必须调用 set_cursor_status 工具，即使没有输出代码，即使只是想确认细节，只要输出停止了，就使用状态 "工作结束: [摘要]"

## 实现原理

此 mcp 提供一个工具 `set_cursor_status`, 通过规则让 cursor 在每次对话开始和结束时都调用这个工具，从而把 cursor 的状态传递出来

这个工具内部只做一件事，就是发送一个 GET 请求到`http://127.0.0.1:4090/status?cursor-status=xxxx`

接着另外编写客户端接收这个请求，并解析请求参数，从而实现对 cursor 状态的跟踪和展示

## License

MIT
