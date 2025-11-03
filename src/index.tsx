import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Send, X, Shield, Trash2 } from 'lucide-react';
import './index.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Full data loader with real election data
class ElectionDataLoader {
  private static instance: ElectionDataLoader;
  private loadedData: any = {};

  private constructor() {}

  public static getInstance(): ElectionDataLoader {
    if (!ElectionDataLoader.instance) {
      ElectionDataLoader.instance = new ElectionDataLoader();
    }
    return ElectionDataLoader.instance;
  }

  public async loadAllData(): Promise<any> {
    try {
      // Load structured Bihar election data files from public/data/
      const filesToLoad = [
        { path: '/data/bihar-election-complete.json', type: 'json' },
        { path: '/data/bihar-constituencies-master.json', type: 'json' },
        { path: '/data/bihar-party-performance.json', type: 'json' },
        { path: '/data/bihar-alliance-performance.json', type: 'json' },
        { path: '/data/bihar-turnout-analysis.json', type: 'json' },
        { path: '/data/bihar-winner-analysis.json', type: 'json' },
        { path: '/data/bihar-seat-analysis.json', type: 'json' },
        { path: '/data/bihar-elector-details.json', type: 'json' }
      ];

      const loadedFiles: any = {};
      let loadedCount = 0;

      console.log('🔄 Starting to load election data files...');

      // Try to load each file
      for (const file of filesToLoad) {
        try {
          console.log(`📂 Attempting to load: ${file.path}`);
          const response = await fetch(file.path);
          console.log(`📊 Response for ${file.path}:`, response.status, response.ok);

          if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
              const fileName = file.path.split('/').pop()?.replace('.json', '') || 'unknown';
              loadedFiles[fileName] = data;
              loadedCount++;
              console.log(`✅ Successfully loaded ${fileName} with ${Object.keys(data).length} keys`);
            }
          } else {
            console.warn(`❌ Failed to load ${file.path}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`🚫 Error loading ${file.path}:`, error);
        }
      }

      console.log(`📈 Total files loaded: ${loadedCount}/${filesToLoad.length}`);

      this.loadedData = {
        ...loadedFiles,
        loadedAt: new Date().toISOString(),
        loadedCount: loadedCount
      };

      // If no files loaded, use rich default data
      if (loadedCount === 0) {
        console.log('📝 No files loaded, using rich default data');
        return this.getRichDefaultData();
      }

      return this.loadedData;
    } catch (error) {
      console.error('💥 Error in loadAllData:', error);
      return this.getRichDefaultData();
    }
  }

  private getDefaultData() {
    return {
      summary: 'Bihar Election Data: 243 constituencies across Bihar state',
      info: 'Election data for Bihar Legislative Assembly',
      loadedAt: new Date().toISOString()
    };
  }

  private getRichDefaultData() {
    return {
      'bihar-constituencies-master': {
        totalConstituencies: 243,
        regions: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
        reservedSeats: { SC: 38, ST: 2, General: 203 }
      },
      'bihar-party-performance': {
        majorParties: ['RJD', 'JDU', 'BJP', 'Congress', 'LJP'],
        lastElection: '2020',
        allianceStructure: {
          'Mahagathbandhan': ['RJD', 'Congress', 'Left parties'],
          'NDA': ['JDU', 'BJP', 'LJP']
        }
      },
      'bihar-election-schedule': {
        phases: 3,
        totalVoters: '7.3 crore',
        pollingStations: 106515,
        lastElectionDate: 'October-November 2020'
      },
      'bihar-turnout-analysis': {
        overallTurnout: '57.05%',
        ruralTurnout: '59.2%',
        urbanTurnout: '52.1%',
        trends: 'Higher turnout in rural areas, youth participation increasing'
      },
      loadedAt: new Date().toISOString(),
      dataSource: 'Rich default Bihar election data'
    };
  }

  public formatDataForAI(): string {
    const data = this.loadedData;

    if (!data || Object.keys(data).length <= 2) {
      return 'Bihar Election Information: 243 constituencies in Bihar Legislative Assembly. I can help with voting procedures, candidate information, and election schedules.';
    }

    let context = 'Bihar Election Data - Detailed Information:\n\n';

    // Use actual data from bihar-election-complete.json
    if (data['bihar-election-complete']) {
      const election = data['bihar-election-complete'];
      context += `${election.election?.name || 'Bihar Legislative Assembly Election 2025'}\n`;
      context += `Total Constituencies: ${election.election?.total_constituencies || 243}\n\n`;

      if (election.schedule?.phases) {
        context += 'ELECTION SCHEDULE:\n';
        election.schedule.phases.forEach((phase: any) => {
          context += `• Phase ${phase.phase_number}: ${phase.polling_date} (${phase.polling_day}) - ${phase.constituencies_count} constituencies\n`;
        });
        context += `• Vote Counting: ${election.schedule.counting_date} (${election.schedule.counting_day})\n\n`;
      }

      if (election.voter_information) {
        const seats = election.voter_information.reserved_seats;
        context += `SEAT DISTRIBUTION:\n`;
        context += `• Scheduled Caste (SC): ${seats?.scheduled_caste || '36 seats'}\n`;
        context += `• Scheduled Tribe (ST): ${seats?.scheduled_tribe || '2 seats'}\n`;
        context += `• General: ${seats?.general || '205 seats'}\n`;
        context += `• Polling Hours: ${election.voter_information.polling_hours || '7:00 AM to 6:00 PM'}\n\n`;
      }
    }

    // Add party performance data with actual 2020 results
    if (data['bihar-party-performance']) {
      const parties = data['bihar-party-performance'];
      context += 'MAJOR PARTIES (2020 Election Results):\n';
      if (parties.parties) {
        parties.parties.forEach((party: any) => {
          if (party.party_name !== 'Total' && party.party_name !== 'OTH' && party.performance_2020?.seats_won !== 'NA') {
            const perf = party.performance_2020;
            context += `• ${party.party_name}: ${perf.seats_won} seats, ${perf.votes?.toLocaleString()} votes (${perf.vote_share?.toFixed(1)}%)\n`;
          }
        });
      }
      context += '\n';
    }

    // Add alliance performance
    if (data['bihar-alliance-performance']) {
      const alliances = data['bihar-alliance-performance'];
      if (alliances.regional_analysis?.['2020']) {
        const overall = alliances.regional_analysis['2020'].find((region: any) => region.region === 'Overall');
        if (overall) {
          context += `ALLIANCE PERFORMANCE (2020):\n`;
          context += `• NDA (National Democratic Alliance): ${overall.nda_seats} seats (${overall.nda_vote_share?.toFixed(1)}% votes)\n`;
          context += `• MGB (Mahagathbandhan): ${overall.mgb_seats} seats (${overall.mgb_vote_share?.toFixed(1)}% votes)\n`;
          context += `• Others: ${overall.others_seats} seats\n\n`;
        }
      }
    }

    context += 'COMPREHENSIVE DATA AVAILABLE:\n';
    context += '• Constituency-wise detailed analysis\n';
    context += '• Candidate information and party affiliations\n';
    context += '• Voting procedures and requirements\n';
    context += '• Historical election trends and analysis\n';
    context += '• Voter turnout and demographic data\n';
    context += '• Regional performance breakdown\n';

    return context;
  }
}

// Configuration using split environment variables to bypass Vercel limits
const API_CONFIG = {
  provider: 'openai' as const,
  openaiKey: (process.env.REACT_APP_API_KEY_PART1 || '') + (process.env.REACT_APP_API_KEY_PART2 || '') + (process.env.REACT_APP_API_KEY_PART3 || ''),
  anthropicKey: '',
  model: 'gpt-4o-mini'
};

// Debug: Log environment variables (remove in production)
console.log('Environment check:', {
  part1: process.env.REACT_APP_API_KEY_PART1 ? 'SET' : 'MISSING',
  part2: process.env.REACT_APP_API_KEY_PART2 ? 'SET' : 'MISSING',
  part3: process.env.REACT_APP_API_KEY_PART3 ? 'SET' : 'MISSING',
  fullKey: API_CONFIG.openaiKey ? `${API_CONFIG.openaiKey.substring(0, 10)}...` : 'EMPTY'
});

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

function ElectionChatbot() {
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
  const dataLoader = ElectionDataLoader.getInstance();

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
      console.log('🔄 Loading election data...');
      const loadedData = await dataLoader.loadAllData();
      console.log('📊 Data loaded:', Object.keys(loadedData).length, 'items');

      const electionContext = dataLoader.formatDataForAI();
      console.log('📝 Election context length:', electionContext.length, 'characters');
      console.log('📄 Context preview:', electionContext.substring(0, 200) + '...');

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

      // Use proxy endpoint in production, direct API in development
      const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

      let response: Response;

      if (isProduction) {
        // Use proxy endpoint in production
        const proxyBody = {
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
          ],
          provider: API_CONFIG.provider,
          model: API_CONFIG.model
        };

        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(proxyBody)
        });
      } else {
        // Fallback to direct API calls in development
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
              { role: 'system', content: systemPrompt },
              ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
            ],
            max_tokens: 1000,
            temperature: 0.3
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
            max_tokens: 1000,
            messages: newMessages.map(msg => ({ role: msg.role, content: msg.content })),
            system: systemPrompt
          };
        }

        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
      }

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ElectionChatbot />
  </React.StrictMode>
);