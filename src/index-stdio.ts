
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { z } from 'zod';
import { getLettsCoreContent } from "./lettscore.js";

// Load environment variables
config();

// Environment variables validation
const envSchema = z.object({
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),
  LETTS_CORE_API_URL: z.string().url(),
  LETTS_CORE_API_TOKEN: z.string().min(1),
  MCP_SERVER_NAME: z.string().default('LettsCore MCP Server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0')
});
const env = envSchema.parse(process.env);
const server = new McpServer({
  name: env.MCP_SERVER_NAME,
  version: env.MCP_SERVER_VERSION,
  transport: new StdioServerTransport()
});


  
server.resource(
    "echo",
    new ResourceTemplate("echo://{message}", { list: undefined }),
    async (uri, { message }) => ({
      contents: [{
        uri: uri.href,
        text: `Resource echo: ${message}`
      }]
    })
  );


  const contentTemplate = new ResourceTemplate('content://{guid}', {
    list: undefined,
  });

  server.resource(
    'content',
    contentTemplate,
    async (uri, params, ctx) => {
      console.log('Accessing content:', params.guid); // Access context here
      return {
        contents: [{
          uri: uri.href,
          text: 'getting content',
        }],
      };
    }
  );

  const allContentTemplate = new ResourceTemplate('contents://{all}', {
    list: undefined
  });

  server.resource(
    "contents",
    allContentTemplate,
    async (uri, params, ctx) => {
        let contents = [{
          uri: uri.href,
          text: 'No content'
        }]
      if (env.LETTS_CORE_API_TOKEN) {
        const c: any = await getLettsCoreContent(env.LETTS_CORE_API_TOKEN);
        if (c && c.data && c.data.length > 0) {
          contents = [{
            uri: uri.href,
            text: JSON.stringify(c.data)
          }]
        }
      } else {
        const c = await getLettsCoreContent();
        if (c && c.length > 0) {
          contents = [{
            uri: uri.href,
            text: JSON.stringify(c)
          }]
      }
    }
      return { contents: contents };
    }
  );
  
  server.tool(
    "echo",
    { message: z.string() },
    async ({ message }, ctx) => {
     return { content: [{ type: "text", text: `Tool echo: ${message}` }]}
    }
  );

    server.tool(
      "listContents",
      {},
      async ({}) => {
          let contentStr = "No Content"
          if (env.LETTS_CORE_API_TOKEN) {
            const c: any = await getLettsCoreContent(env.LETTS_CORE_API_TOKEN);
            if (c && c.data && c.data.length > 0) {
              contentStr = JSON.stringify(c.data)
            }
          } else {
            const c = await getLettsCoreContent();
            if (c && c.length > 0) {
              contentStr = JSON.stringify(c)
            }
          }
          return { content: [{
              type: "text",
              text: contentStr
          }]}
        }
    );
  
  server.prompt(
    "echo",
    { message: z.string() },
    ({ message }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please process this message: ${message}`
        }
      }]
    })
  );

  const transport = new StdioServerTransport()
await server.connect(transport)