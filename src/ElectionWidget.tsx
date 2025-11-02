import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import DataLoader from './utils/dataLoader';
// Simple tracking function for demo
const trackEvent = (eventName: string, properties: any = {}) => {
  console.log('Analytics Event:', eventName, properties);
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  width?: string;
  height?: string;
  title?: string;
  subtitle?: string;
  embedId?: string;
}

// Hardcoded API configuration - no user settings
const API_CONFIG = {
  provider: (process.env.REACT_APP_API_PROVIDER as 'openai' | 'anthropic') || 'openai',
  openaiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  anthropicKey: process.env.REACT_APP_CLAUDE_API_KEY || '',
  model: process.env.REACT_APP_AI_MODEL || 'gpt-4o-mini'
};

// Hardcoded blocked keywords
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
  'electoral fraud'
];

export default function ElectionWidget({
  position = 'bottom-right',
  theme = 'light',
  width = '400px',
  height = '600px',
  title = 'ElectionSathi',
  subtitle = 'Election insights, simplified.',
  embedId = 'default'
}: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem(`election-widget-messages-${embedId}`);
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
        content: `Hello! I'm ${title}, your trusted companion for election insights. I can help you with voting information, registration, polling locations, candidate details, and more.`
      }
    ];
  });
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [electionData, setElectionData] = useState<any>(null);
  const [dataLoader] = useState(() => DataLoader.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem(`election-widget-messages-${embedId}`, JSON.stringify(messages));
  }, [messages, embedId]);

  // Load election data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataLoader.loadAllData();
        setElectionData(data);
      } catch (error) {
        console.error('Failed to load election data:', error);
      }
    };
    loadData();
  }, [dataLoader]);

  // Track widget opening
  useEffect(() => {
    if (isOpen) {
      trackEvent('widget_opened', { embedId, position, theme });
    }
  }, [isOpen, embedId, position, theme]);

  const getPositionClass = () => {
    switch (position) {
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      default: return 'bottom-4 right-4';
    }
  };

  const getSystemPrompt = () => {
    let prompt = `You are ${title}, a helpful, nonpartisan election assistant providing election insights, simplified. Your role is to:
- Provide accurate information about voting procedures, registration, and deadlines
- Share details about polling locations and voting requirements
- Explain ballot measures and electoral processes
- Maintain strict political neutrality
- Never recommend specific candidates or parties
- Be concise and helpful

Keep responses brief and focused. If you don't have specific information, direct users to official election websites or local election offices.`;

    if (electionData) {
      prompt += `\n\nYou have access to the following election data:\n${dataLoader.formatDataForAI()}`;
    }

    return prompt;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check for blocked questions
    const blockedKeyword = checkBlockedQuestion(input);
    if (blockedKeyword) {
      setMessages(prev => [...prev,
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: "I can't provide political opinions or voting recommendations. I'm here to provide factual election information like dates, requirements, and processes." }
      ]);
      setInput('');
      trackEvent('blocked_question', { embedId, keyword: blockedKeyword });
      return;
    }

    // Get the current API key from environment
    const currentApiKey = API_CONFIG.provider === 'openai'
      ? API_CONFIG.openaiKey
      : API_CONFIG.anthropicKey;

    if (!currentApiKey) {
      setMessages(prev => [...prev,
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: 'API key not configured. Please check the environment variables.' }
      ]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Track message sent
    trackEvent('message_sent', { embedId, messageLength: input.length });

    try {
      let apiUrl: string;
      let headers: Record<string, string>;
      let requestBody: any;

      if (API_CONFIG.provider === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
        };
        requestBody = {
          model: API_CONFIG.model,
          messages: [
            { role: 'system', content: getSystemPrompt() },
            ...messages.slice(-5),
            userMessage
          ],
          max_tokens: 500,
          temperature: 0.7
        };
      } else {
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey,
          'anthropic-version': '2023-06-01'
        };
        requestBody = {
          model: API_CONFIG.model.includes('claude') ? API_CONFIG.model : 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [...messages.slice(-5), userMessage],
          system: getSystemPrompt()
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant' as const,
        content: API_CONFIG.provider === 'openai'
          ? data.choices[0].message.content
          : data.content[0].text
      };

      setMessages(prev => [...prev, assistantMessage]);
      trackEvent('response_received', { embedId, responseLength: assistantMessage.content.length });

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.'
      }]);
      trackEvent('error_occurred', { embedId, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    const resetMessages = [
      {
        role: 'assistant' as const,
        content: `Hello! I'm ${title}, your trusted companion for election insights. I can help you with voting information, registration, polling locations, candidate details, and more.`
      }
    ];
    setMessages(resetMessages);
    localStorage.setItem(`election-widget-messages-${embedId}`, JSON.stringify(resetMessages));
    trackEvent('conversation_cleared', { embedId });
  };

  const handleFeedback = (positive: boolean, messageIndex: number) => {
    trackEvent('feedback_given', { embedId, positive, messageIndex });
  };

  if (!isOpen) {
    return (
      <div className={`fixed ${getPositionClass()} z-50`}>
        <button
          onClick={() => setIsOpen(true)}
          className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white'} rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
          title={title}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClass()} z-50`} style={{ width, height }}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'} rounded-lg shadow-2xl flex flex-col h-full border`}>
        {/* Header */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-indigo-600'} text-white px-4 py-3 rounded-t-lg flex justify-between items-center`}>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs opacity-90">{subtitle}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={clearConversation}
              className="p-1 hover:bg-white/20 rounded"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div>
                <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.role === 'user'
                    ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                    : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.content}
                </div>
                {message.role === 'assistant' && (
                  <div className="flex justify-end gap-1 mt-1">
                    <button
                      onClick={() => handleFeedback(true, index)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleFeedback(false, index)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {!(API_CONFIG.provider === 'openai' ? API_CONFIG.openaiKey : API_CONFIG.anthropicKey) && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              API key required for chat functionality
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about elections..."
              className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}