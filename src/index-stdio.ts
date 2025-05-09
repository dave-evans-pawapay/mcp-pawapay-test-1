#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
const server = new McpServer({
  name: env.MCP_SERVER_NAME,
  version: env.MCP_SERVER_VERSION,
  transport: new StdioServerTransport()
});


  const depositTemplate = new ResourceTemplate('deposit://{depositId}', {
    list: undefined,
  });

  server.resource(
    'deposit',
    depositTemplate,
    async (uri, params, ctx) => {
      let token : string | undefined = env.PAWAPAY_API_KEY;
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
    { },
    async ({}, ctx: any) => {
     let token = env.PAWAPAY_API_KEY;
     const response = await getActiveConf(token ,env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "correspondentPredict",
    { msisdn: z.string() },
    async ({ msisdn }, ctx: any) => {  
     let token = env.PAWAPAY_API_KEY;
     const response = await getCorrespondentPredict(msisdn, token ,env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "correspondentAvailability",
    { },
    async ({  }, ctx: any) => {
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
     let token = env.PAWAPAY_API_KEY;
     const response = await sendDeposit(deposit, token, env.PAWAPAY_API_URL); 
     return { content: [{ type: "text", text: JSON.stringify(response) }]}
    }
  );

  server.tool(
    "depositStatus",
    { transactionId: z.string() },
    async ({ transactionId }, ctx: any) => {
     let token = env.PAWAPAY_API_KEY;
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

  const transport = new StdioServerTransport()
await server.connect(transport)