import express, { Request, Response } from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { config } from 'dotenv';
import { z } from 'zod';
import { DepositRequest, DepositResponse, getActiveConf, getCorrespondentAvailability, getCorrespondentPredict, getDeposit, sendDeposit } from "./pawapay.js";
import { DateTime } from "luxon";

// Load environment variables
config();

// Environment variables validation
const envSchema = z.object({
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),
  PAWAPAY_API_URL: z.string().default('https://api.sandbox.pawapay.cloud'),
  PAWAPAY_API_KEY: z.string().default('YOUR KEY HERE'),
  MCP_SERVER_NAME: z.string().default('pawaPay MCP Transactions'),
  MCP_SERVER_VERSION: z.string().default('1.0.0')
});
export const env = envSchema.parse(process.env);

const keyArray: { [key: string]: string } = {};
const server = new McpServer({
  name: env.MCP_SERVER_NAME,
  version: env.MCP_SERVER_VERSION,
});

// ... set up server resources, tools, and prompts ...

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
})

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


  const depositTemplate = new ResourceTemplate('deposit://{depositId}', {
    list: undefined,
  });

  server.resource(
    'deposit',
    depositTemplate,
    async (uri, params, ctx) => {
      console.log('Accessing deposit as:', params.depositId); // Access context here
      if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
      let token : string | undefined = env.PAWAPAY_API_KEY;
      if (ctx.sessionId && keyArray[ctx.sessionId]) {
         token = keyArray[ctx.sessionId];
      }
      const results: DepositResponse[] = [];
      if (Array.isArray(params.depositId)) {
        for (const depositId of params.depositId) {
          const response = await getDeposit(depositId, token, env.PAWAPAY_API_URL);
          results.push(response);
        }
      } else {
        const response = await getDeposit(params.depositId, token, env.PAWAPAY_API_URL); 
        results.push(response);
      }
      return { contents: [{
        uri: uri.href,
        text: JSON.stringify(results)
      }]}
    }
  );
  
  server.tool(
    "activeConf",
    { conf: z.undefined() },
    async ({ conf }, ctx: any) => {
     console.log(JSON.stringify(ctx));   
     if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
     let token = env.PAWAPAY_API_KEY;
     if (ctx.sessionId && keyArray[ctx.sessionId]) {
      token = keyArray[ctx.sessionId];
     }
     const response = await getActiveConf(token, env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "correspondentPredict",
    { msisdn: z.string() },
    async ({ msisdn }, ctx: any) => {
     console.log(JSON.stringify(ctx));   
     if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
     let token = env.PAWAPAY_API_KEY;
     if (ctx.sessionId && keyArray[ctx.sessionId]) {
      token = keyArray[ctx.sessionId];
     }
     const response = await getCorrespondentPredict(msisdn, token, env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "correspondentAvailability",
    {conf: z.undefined()},
    async ({ conf }, ctx: any) => {
     console.log(JSON.stringify(ctx));   
     const response = await getCorrespondentAvailability(env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "deposit",
    { depositId: z.string(),
      amount: z.string(),
      currency: z.string(),
      msisdn: z.string(),
      correspondent: z.string(),
      country: z.string(),
      description: z.string(),
     },
    async ({ depositId, amount, currency, msisdn, correspondent, country, description }, ctx: any) => {
     console.log(JSON.stringify(ctx));   
     const deposit : DepositRequest = {
      depositId,
      preAuthorisationCode: null ,
      amount,
      currency,
      country,
      correspondent,
       payer: {
        type: 'MSISDN',
        address: {
          value: msisdn
          }
        },
       statementDescription: description,
       customerTimestamp: DateTime.now().toISO(),
       metadata: null
     }
     if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
     let token = env.PAWAPAY_API_KEY;
     if (ctx.sessionId && keyArray[ctx.sessionId]) {
      token = keyArray[ctx.sessionId];
     }
     const response = await sendDeposit(deposit, token, env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "depositStatus",
    { transactionId: z.string() },
    async ({ transactionId }, ctx: any) => {
     console.log(JSON.stringify(ctx));   
     if (ctx.sessionId) console.log(`Key is: ${keyArray[ctx.sessionId]}`);
     let token = env.PAWAPAY_API_KEY;
     if (ctx.sessionId && keyArray[ctx.sessionId]) {
      token = keyArray[ctx.sessionId];
     }
     const response = await getDeposit(transactionId, token, env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
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

console.log('Starting server on port', env.PORT );
app.listen(env.PORT ? parseInt(env.PORT) : 8080);