import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { config } from 'dotenv';
import { z } from 'zod';
import {
    ListPromptsRequestSchema,
    GetPromptRequestSchema
  } from "@modelcontextprotocol/sdk/types.js";
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
const keyArray: { [key: string]: string } = {};
const server = new McpServer({
  name: env.MCP_SERVER_NAME,
  version: env.MCP_SERVER_VERSION
});

// ... set up server resources, tools, and prompts ...

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  if (_.query['key']) keyArray[transport.sessionId] = _.query['key'].toString();
  res.on("close", () => {
    delete transports[transport.sessionId];
    delete keyArray[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
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
      console.log('Accessing content as:', params.guid); // Access context here
      if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
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
      if (ctx.sessionId) {
        console.log(`Key is: ${keyArray[ctx.sessionId]}`);
        const c: any = await getLettsCoreContent(keyArray[ctx.sessionId]);
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
     console.log(JSON.stringify(ctx));   
     if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
     return { content: [{ type: "text", text: `Tool echo: ${message}` }]}
    }
  );

  server.tool(
    "listContents",
    {},
    async ({}, ctx ) => {
        let contentStr = "No Content"
        if (ctx.sessionId) {
          console.log(`Key is: ${keyArray[ctx.sessionId]}`);
          const c: any = await getLettsCoreContent(keyArray[ctx.sessionId]);
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


app.listen(env.PORT);