/**
 * ElectionSathi Embed Script
 * This script allows websites to embed the ElectionSathi widget
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_CDN_URL = 'https://your-domain.com'; // Replace with your actual domain
  const WIDGET_VERSION = '1.0.0';

  class ElectionSathiEmbed {
    constructor(config = {}) {
      this.config = {
        apiKey: '',
        apiProvider: 'openai',
        position: 'bottom-right',
        theme: 'light',
        width: '400px',
        height: '600px',
        title: 'ElectionSathi',
        subtitle: 'Election insights, simplified.',
        embedId: this.generateEmbedId(),
        autoOpen: false,
        ...config
      };

      this.isLoaded = false;
      this.widget = null;
      this.init();
    }

    generateEmbedId() {
      return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.loadWidget());
      } else {
        this.loadWidget();
      }
    }

    async loadWidget() {
      if (this.isLoaded) return;

      try {
        // Create container
        const container = document.createElement('div');
        container.id = `election-sathi-widget-${this.config.embedId}`;
        container.style.cssText = `
          position: fixed;
          z-index: 999999;
          ${this.getPositionStyles()}
        `;
        document.body.appendChild(container);

        // Load React and ReactDOM if not available
        if (!window.React || !window.ReactDOM) {
          await this.loadReactLibraries();
        }

        // Load widget CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = `${WIDGET_CDN_URL}/static/css/widget.css?v=${WIDGET_VERSION}`;
        document.head.appendChild(css);

        // Load widget JavaScript
        const script = document.createElement('script');
        script.src = `${WIDGET_CDN_URL}/static/js/widget.js?v=${WIDGET_VERSION}`;
        script.onload = () => this.renderWidget(container);
        document.head.appendChild(script);

        this.isLoaded = true;

      } catch (error) {
        console.error('Failed to load ElectionSathi widget:', error);
        this.showFallback();
      }
    }

    async loadReactLibraries() {
      return new Promise((resolve, reject) => {
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@17/umd/react.production.min.js';
        reactScript.onload = () => {
          const reactDOMScript = document.createElement('script');
          reactDOMScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
          reactDOMScript.onload = resolve;
          reactDOMScript.onerror = reject;
          document.head.appendChild(reactDOMScript);
        };
        reactScript.onerror = reject;
        document.head.appendChild(reactScript);
      });
    }

    getPositionStyles() {
      const { position } = this.config;
      switch (position) {
        case 'bottom-left':
          return 'bottom: 20px; left: 20px;';
        case 'top-right':
          return 'top: 20px; right: 20px;';
        case 'top-left':
          return 'top: 20px; left: 20px;';
        case 'bottom-right':
        default:
          return 'bottom: 20px; right: 20px;';
      }
    }

    renderWidget(container) {
      if (window.ElectionSathiWidget) {
        const widget = React.createElement(window.ElectionSathiWidget, this.config);
        ReactDOM.render(widget, container);
        this.widget = container;

        // Auto-open if configured
        if (this.config.autoOpen) {
          setTimeout(() => this.open(), 1000);
        }
      } else {
        console.error('ElectionSathi widget component not found');
        this.showFallback();
      }
    }

    showFallback() {
      const container = document.getElementById(`election-sathi-widget-${this.config.embedId}`);
      if (container) {
        container.innerHTML = `
          <div style="
            background: #dc2626;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          ">
            <strong>ElectionSathi Widget</strong><br>
            Failed to load. Please check your configuration.
          </div>
        `;
      }
    }

    // Public API methods
    open() {
      if (this.widget && window.ElectionSathiWidget) {
        // Trigger widget open
        const event = new CustomEvent('election-sathi-open');
        this.widget.dispatchEvent(event);
      }
    }

    close() {
      if (this.widget && window.ElectionSathiWidget) {
        // Trigger widget close
        const event = new CustomEvent('election-sathi-close');
        this.widget.dispatchEvent(event);
      }
    }

    destroy() {
      if (this.widget) {
        ReactDOM.unmountComponentAtNode(this.widget);
        this.widget.remove();
        this.widget = null;
        this.isLoaded = false;
      }
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      if (this.isLoaded) {
        this.destroy();
        this.loadWidget();
      }
    }
  }

  // Global API
  window.ElectionSathi = {
    embed: function(config) {
      return new ElectionSathiEmbed(config);
    },

    // Convenience method for simple embed
    init: function(apiKey, options = {}) {
      return new ElectionSathiEmbed({
        apiKey,
        ...options
      });
    }
  };

  // Auto-initialize if data attributes are present
  const autoInitScript = document.querySelector('script[data-election-sathi-api-key]');
  if (autoInitScript) {
    const config = {
      apiKey: autoInitScript.getAttribute('data-election-sathi-api-key'),
      apiProvider: autoInitScript.getAttribute('data-api-provider') || 'openai',
      position: autoInitScript.getAttribute('data-position') || 'bottom-right',
      theme: autoInitScript.getAttribute('data-theme') || 'light',
      width: autoInitScript.getAttribute('data-width') || '400px',
      height: autoInitScript.getAttribute('data-height') || '600px',
      title: autoInitScript.getAttribute('data-title') || 'ElectionSathi',
      subtitle: autoInitScript.getAttribute('data-subtitle') || 'Election insights, simplified.',
      autoOpen: autoInitScript.getAttribute('data-auto-open') === 'true'
    };

    window.ElectionSathi.embed(config);
  }

})();