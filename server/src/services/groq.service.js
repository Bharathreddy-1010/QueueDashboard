const { groq } = require('../config/groq');
const config = require('../config/env');
const { TOOL_DEFINITIONS, executeTool } = require('./ai-tools.service');

const SYSTEM_PROMPT = `You are QueuePro AI, an intelligent copilot for authenticated queue managers.
Your role is to provide quick, actionable operational insights based on real QueuePro database records.

STRICT CONCISENESS & FORMATTING RULES:
1. Short & Direct: Keep responses concise (under 75-90 words total). Avoid chatty intros ("Here is your summary...") or concluding offers ("Let me know if you would like to explore..."). Answer the question directly.
2. No Wide Tables: DO NOT generate wide multi-column Markdown tables. Instead, use 2 to 4 compact bullet points highlighting only active queues or key metrics.
3. Group Empty Queues: Summarize idle or inactive queues in one short sentence (e.g., "• Other 3 queues: 0 waiting, idle").
4. Bold Key Numbers: Bold token IDs, waiting counts, and durations (e.g., **6 waiting**, **T008**, **9m 26s**).
5. Grounded in Real Data: Base factual metrics strictly on tool data. Never fabricate metrics.
6. Read-Only Policy: You cannot perform write actions (serving, completing, cancelling, adding). If requested, briefly direct the manager to the dashboard buttons.
7. Distinguish Wait Times: Clearly distinguish current elapsed wait from completed average wait time.`;

/**
 * Run chat conversation with Groq including recursive tool calling
 */
const runChat = async ({ messages, managerId, currentQueueId }) => {
  if (!groq.isConfigured()) {
    return {
      reply:
        "⚠️ Groq API key is not configured. Please add `GROQ_API_KEY` to your `server/.env` file to activate the QueuePro AI Copilot.",
      toolsUsed: [],
      dataRetrievedAt: new Date().toISOString(),
      isConfigured: false,
    };
  }

  // Prepend system message if not already present
  const fullMessages = [
    {
      role: 'system',
      content: currentQueueId
        ? `${SYSTEM_PROMPT}\nNote: The manager is currently viewing queueId: "${currentQueueId}".`
        : SYSTEM_PROMPT,
    },
    ...messages,
  ];

  const toolsUsed = new Set();
  let latestDataRetrievedAt = new Date().toISOString();
  let rounds = 0;
  const maxRounds = config.AI_MAX_TOOL_ROUNDS || 5;

  while (rounds < maxRounds) {
    rounds++;

    const response = await groq.createChatCompletion({
      model: config.GROQ_MODEL,
      messages: fullMessages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 450,
    });

    const choice = response.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error('Received empty response from Groq API');
    }

    const message = choice.message;

    // Check if model requested tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      fullMessages.push(message);

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function?.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function?.arguments || '{}');
        } catch (_) {
          functionArgs = {};
        }

        toolsUsed.add(functionName);

        let toolResult;
        try {
          toolResult = await executeTool(functionName, functionArgs, managerId);
          if (toolResult?.dataRetrievedAt) {
            latestDataRetrievedAt = toolResult.dataRetrievedAt;
          }
        } catch (toolErr) {
          toolResult = {
            success: false,
            error: toolErr.message || 'Tool execution failed',
            dataRetrievedAt: new Date().toISOString(),
          };
        }

        fullMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(toolResult),
        });
      }
      // Loop continues with tool outputs sent back to Groq
    } else {
      // Natural language reply reached
      return {
        reply: message.content || "I've analyzed your queues, but have no additional notes at this time.",
        toolsUsed: Array.from(toolsUsed),
        dataRetrievedAt: latestDataRetrievedAt,
        isConfigured: true,
      };
    }
  }

  // Fallback if max tool rounds exceeded
  return {
    reply: "I retrieved the queue data, but reached the maximum analysis steps. Please ask a more specific question.",
    toolsUsed: Array.from(toolsUsed),
    dataRetrievedAt: latestDataRetrievedAt,
    isConfigured: true,
  };
};

module.exports = {
  runChat,
  SYSTEM_PROMPT,
};
