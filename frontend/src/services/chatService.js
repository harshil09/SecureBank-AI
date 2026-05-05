// src/services/chatService.js - COMPLETE WITH STREAMING

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** If options.authToken is set (including null), use it; otherwise localStorage. */
function resolveAuthToken(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'authToken')) {
    const v = options.authToken;
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
  return localStorage.getItem('token');
}

export const chatService = {
  /**
   * Original non-streaming method (keep for backwards compatibility)
   */
  sendMessage: async (message, conversationHistory, options = {}) => {
    const token = resolveAuthToken(options);

    const response = await fetch(`${API_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        query: message,
        conversation_history: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * ⚡ NEW STREAMING METHOD - FIX 2: ADD THIS METHOD
   * 
   * Sends message and receives response chunk-by-chunk in real-time.
   * 
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous messages
   * @param {Function} onChunk - Called for each token: (token: string) => void
   * @param {Function} onComplete - Called when streaming finishes: () => void
   * @param {Function} onError - Called if error occurs: (error: string) => void
   */
  sendMessageStream: async (message, conversationHistory, onChunk, onComplete, onError, options = {}) => {
    const token = resolveAuthToken(options);

    try {
      // Open streaming connection
      const response = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          query: message,
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get readable stream from response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read stream until done
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode chunk incrementally and accumulate.
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by blank line.
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          const dataLines = lines
            .filter((line) => line.startsWith('data: '))
            .map((line) => line.slice(6));

          if (dataLines.length === 0) continue;

          const payload = dataLines.join('\n');

          try {
            const data = JSON.parse(payload);

            if (data.error) {
              onError(data.error);
              return;
            }

            if (data.done) {
              onComplete();
              return;
            }

            if (typeof data.content === 'string' && data.content.length > 0) {
              onChunk(data.content);
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE payload:', payload, parseError);
          }
        }
      }

      // Flush remaining decoder bytes.
      const tail = decoder.decode();
      if (tail) {
        buffer += tail;
      }

      if (buffer.trim()) {
        try {
          const line = buffer
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (line) {
            const data = JSON.parse(line.slice(6));
            if (data?.content) onChunk(data.content);
            if (data?.done) onComplete();
          }
        } catch {
          // ignore leftover partial event
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      onError(error.message || 'Network error');
    }
  }
  
};
