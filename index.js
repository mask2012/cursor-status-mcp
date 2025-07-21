#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

class CursorStatusServer {
  constructor() {
    this.server = new Server(
      {
        name: "cursor-status",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "set_cursor_status",
            description:
              "Set cursor status to track current activity. Should be called at the start of conversations, when beginning new tasks, or when switching to different activities. Use concise Chinese descriptions.",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  description:
                    "Brief status message describing current activity (e.g., '开始新对话', '编写代码', '调试问题', '完成任务')",
                },
              },
              required: ["status"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "set_cursor_status") {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const { status } = request.params.arguments;

      if (!status) {
        throw new Error("Status parameter is required");
      }

      try {
        // Send GET request to the status endpoint
        // 禁用代理，确保直接连接到本地服务器
        const response = await axios.get(`http://127.0.0.1:4090/status`, {
          params: {
            cursor_status: status,
          },
          timeout: 5000, // 5 second timeout
          // 禁用代理设置
          proxy: false,
          // 额外的配置确保直接连接
          httpsAgent: false,
          httpAgent: false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully set cursor status to: "${status}"\nServer response: ${response.status} ${
                response.statusText
              }\nResponse data: ${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        // Handle different types of errors
        let errorMessage = "Failed to set cursor status";
        let errorDetails = "";

        if (error.code === "ECONNREFUSED") {
          errorMessage = "Connection refused - make sure the status server is running on 127.0.0.1:4090";
        } else if (error.code === "ETIMEDOUT") {
          errorMessage = "Request timeout - the status server didn't respond within 5 seconds";
        } else if (error.response) {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
          errorDetails = `\nResponse data: ${JSON.stringify(error.response.data, null, 2)}`;
        } else {
          errorMessage = error.message;
          errorDetails = `\nError code: ${error.code}\nError details: ${JSON.stringify(error, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Error setting cursor status: ${errorMessage}${errorDetails}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Cursor Status MCP server running on stdio");
  }
}

const server = new CursorStatusServer();
server.run().catch(console.error);
