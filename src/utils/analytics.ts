// Analytics utility for tracking ElectionSathi usage and performance

interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface AnalyticsConfig {
  apiEndpoint?: string;
  enableLocalStorage?: boolean;
  enableConsoleLogging?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private config: AnalyticsConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enableLocalStorage: true,
      enableConsoleLogging: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();

    // Track page load
    this.track('page_loaded', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: Date.now()
    });
  }

  public static getInstance(config?: AnalyticsConfig): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics(config);
    }
    return Analytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    let userId = localStorage.getItem('election-analytics-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('election-analytics-user-id', userId);
    }
    return userId;
  }

  public track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      eventName,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.generateUserId()
    };

    this.events.push(event);

    if (this.config.enableConsoleLogging) {
      console.log('Analytics Event:', event);
    }

    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage(event);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  private saveToLocalStorage(event: AnalyticsEvent): void {
    try {
      const existingEvents = JSON.parse(localStorage.getItem('election-analytics-events') || '[]');
      existingEvents.push(event);

      // Keep only last 100 events in localStorage
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }

      localStorage.setItem('election-analytics-events', JSON.stringify(existingEvents));
    } catch (error) {
      console.warn('Failed to save analytics event to localStorage:', error);
    }
  }

  public flush(): void {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.config.apiEndpoint) {
      this.sendToServer(eventsToSend);
    }

    // Also send to Google Analytics if gtag is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      eventsToSend.forEach(event => {
        (window as any).gtag('event', event.eventName, {
          custom_parameter_1: JSON.stringify(event.properties),
          session_id: event.sessionId,
          user_id: event.userId
        });
      });
    }
  }

  private async sendToServer(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.warn('Failed to send analytics events to server:', error);
      // Re-add events to queue for retry
      this.events.unshift(...events);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  public getStoredEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('election-analytics-events') || '[]');
    } catch {
      return [];
    }
  }

  public clearStoredEvents(): void {
    localStorage.removeItem('election-analytics-events');
  }

  public getSessionStats(): {
    sessionId: string;
    eventsCount: number;
    sessionDuration: number;
    topEvents: Array<{ event: string; count: number }>;
  } {
    const storedEvents = this.getStoredEvents();
    const sessionEvents = storedEvents.filter(e => e.sessionId === this.sessionId);

    const eventCounts: Record<string, number> = {};
    sessionEvents.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
    });

    const topEvents = Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sessionStart = sessionEvents.length > 0 ? sessionEvents[0].timestamp : Date.now();
    const sessionDuration = Date.now() - sessionStart;

    return {
      sessionId: this.sessionId,
      eventsCount: sessionEvents.length,
      sessionDuration,
      topEvents
    };
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Initialize analytics instance
const analytics = Analytics.getInstance({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableLocalStorage: true
});

// Export convenience function
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, properties);
};

// Export analytics instance for advanced usage
export { analytics };

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.flush();
  });
}

// Track common events
export const trackWidgetEvents = {
  opened: (embedId: string, properties: Record<string, any> = {}) =>
    trackEvent('widget_opened', { embedId, ...properties }),

  closed: (embedId: string, properties: Record<string, any> = {}) =>
    trackEvent('widget_closed', { embedId, ...properties }),

  messageSent: (embedId: string, messageLength: number, properties: Record<string, any> = {}) =>
    trackEvent('message_sent', { embedId, messageLength, ...properties }),

  responseReceived: (embedId: string, responseLength: number, properties: Record<string, any> = {}) =>
    trackEvent('response_received', { embedId, responseLength, ...properties }),

  feedbackGiven: (embedId: string, positive: boolean, messageIndex: number, properties: Record<string, any> = {}) =>
    trackEvent('feedback_given', { embedId, positive, messageIndex, ...properties }),

  errorOccurred: (embedId: string, error: string, properties: Record<string, any> = {}) =>
    trackEvent('error_occurred', { embedId, error, ...properties }),

  conversationCleared: (embedId: string, properties: Record<string, any> = {}) =>
    trackEvent('conversation_cleared', { embedId, ...properties })
};

export default analytics;