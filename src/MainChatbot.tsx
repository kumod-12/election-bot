import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Shield, Trash2 } from 'lucide-react';
import DataLoader from './utils/dataLoader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Hardcoded configuration - no user settings
const API_CONFIG = {
  provider: (process.env.REACT_APP_API_PROVIDER as 'openai' | 'anthropic') || 'openai',
  openaiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  anthropicKey: process.env.REACT_APP_CLAUDE_API_KEY || '',
  model: process.env.REACT_APP_AI_MODEL || 'gpt-4o-mini'
};


// Hardcoded blocked keywords - no user modification
const BLOCKED_KEYWORDS = [
  'who should i vote for',
  'who to vote for',
  'best candidate',
  'worst candidate',
  'political opinion',
  'vote recommendation',
  'endorse',
  'support candidate',
  'political advice',
  'bias',
  'partisan',
  'corrupt',
  'illegal voting',
  'vote buying',
  'electoral fraud',
  'rigged election',
  'manipulation',
  'fake votes'
];

export default function MainChatbot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('election-bot-messages');
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (error) {
        console.warn('Failed to parse saved messages:', error);
      }
    }
    return [
      {
        role: 'assistant',
        content: 'Hello! I\'m ElectionSathi, your trusted companion for election insights. I can help you with voting information, registration, polling locations, candidate details, and more.'
      }
    ];
  });

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBlockedWarning, setShowBlockedWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dataLoader = DataLoader.getInstance();

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('election-bot-messages', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBlockedQuestion = (question: string): string | null => {
    const lowerQuestion = question.toLowerCase();
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return null;
  };

  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation history? This action cannot be undone.')) {
      const resetMessages = [
        {
          role: 'assistant' as const,
          content: 'Hello! I\'m ElectionSathi, your trusted companion for election insights. I can help you with voting information, registration, polling locations, candidate details, and more.'
        }
      ];
      setMessages(resetMessages);
      localStorage.setItem('election-bot-messages', JSON.stringify(resetMessages));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check for blocked questions
    const blockedKeyword = checkBlockedQuestion(input);
    if (blockedKeyword) {
      setShowBlockedWarning(blockedKeyword);
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Get the current API key from environment
      const currentApiKey = API_CONFIG.provider === 'openai'
        ? API_CONFIG.openaiKey
        : API_CONFIG.anthropicKey;


      if (!currentApiKey) {
        throw new Error('API key not configured. Please set the appropriate environment variable.');
      }

      // Load election data context
      await dataLoader.loadAllData();
      const electionContext = dataLoader.formatDataForAI();

      // Create the prompt with election data context
      const systemPrompt = `You are ElectionSathi, an AI assistant specialized in Bihar election information. You provide factual, non-partisan information about elections, voting processes, and candidates.

IMPORTANT GUIDELINES:
- Be completely neutral and non-partisan
- Provide factual information only
- Do not recommend specific candidates or parties
- Focus on election processes, dates, requirements, and factual data
- If asked for political opinions, politely decline and redirect to factual information

Current Bihar Election Data:
${electionContext}

Please provide helpful, accurate, and neutral information about Bihar elections based on this data.`;

      const requestBody = {
        model: API_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
        ],
        max_tokens: 1000,
        temperature: 0.3
      };


      let apiUrl: string;
      let headers: Record<string, string>;

      if (API_CONFIG.provider === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
        };
      } else {
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey,
          'anthropic-version': '2023-06-01'
        };

        // Anthropic has a different request format
        const anthropicBody = {
          model: API_CONFIG.model.includes('claude') ? API_CONFIG.model : 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: newMessages.map(msg => ({ role: msg.role, content: msg.content })),
          system: systemPrompt
        };

        Object.assign(requestBody, anthropicBody);
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();

      let assistantMessage: string;
      if (API_CONFIG.provider === 'openai') {
        assistantMessage = data.choices?.[0]?.message?.content || 'I apologize, but I received an empty response. Please try again.';
      } else {
        assistantMessage = data.content?.[0]?.text || 'I apologize, but I received an empty response. Please try again.';
      }

      const assistantResponse: Message = {
        role: 'assistant',
        content: assistantMessage
      };

      setMessages([...newMessages, assistantResponse]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key and try again.`
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🗳️ ElectionSathi</h1>
            <p className="text-sm text-gray-600">Election insights, simplified</p>
          </div>
          <button
            onClick={clearConversation}
            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Conversation"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Blocked Question Warning */}
      {showBlockedWarning && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Question Not Allowed</h3>
              <p className="text-sm text-red-700 mt-1">
                I can't provide political opinions or voting recommendations. I'm here to provide factual election information like dates, requirements, and processes.
              </p>
            </div>
            <button
              onClick={() => setShowBlockedWarning(null)}
              className="ml-auto"
            >
              <X className="h-5 w-5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 shadow-sm border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">ElectionSathi is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Bihar elections, voting process, or candidate information..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          ElectionSathi provides factual, non-partisan election information
        </div>
      </div>
    </div>
  );
}