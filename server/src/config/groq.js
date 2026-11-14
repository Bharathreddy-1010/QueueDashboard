const config = require('./env');

/**
 * Native Groq API Client wrapper for Node.js
 * Compatible with Groq / OpenAI chat completion schema with native fetch
 */
class GroqClient {
  constructor(apiKey = config.GROQ_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  /**
   * Check if Groq API key is configured
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Create a chat completion with optional tool calls
   */
  async createChatCompletion({
    model = config.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    tools,
    tool_choice,
    temperature = 0.2,
    max_tokens = 2048,
  }) {
    if (!this.isConfigured()) {
      const error = new Error('Groq API key is not configured. Please set GROQ_API_KEY in server/.env');
      error.code = 'GROQ_NOT_CONFIGURED';
      error.statusCode = 503;
      throw error;
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      if (tool_choice) {
        payload.tool_choice = tool_choice;
      }
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Groq API error (${response.status}): ${response.statusText}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (_) {}
      const error = new Error(errMsg);
      error.statusCode = response.status === 429 ? 429 : 502;
      error.raw = errText;
      throw error;
    }

    return await response.json();
  }
}

const groq = new GroqClient();

module.exports = {
  GroqClient,
  groq,
};
