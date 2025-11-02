import React, { useState } from 'react';
import { X, Send, Star } from 'lucide-react';
// Simple tracking function for demo
const trackEvent = (eventName: string, properties: any = {}) => {
  console.log('Analytics Event:', eventName, properties);
};

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedId?: string;
  messageId?: string;
}

interface FeedbackData {
  rating: number;
  category: string;
  comment: string;
  email?: string;
}

export default function FeedbackModal({ isOpen, onClose, embedId = 'default', messageId }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    category: '',
    comment: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'Accuracy of information',
    'Response helpfulness',
    'User interface',
    'Response speed',
    'Overall experience',
    'Feature request',
    'Bug report',
    'Other'
  ];

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
    trackEvent('feedback_rating_selected', { embedId, rating, messageId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.rating === 0 || !feedback.category) return;

    setIsSubmitting(true);

    try {
      // Track feedback submission
      trackEvent('feedback_submitted', {
        embedId,
        messageId,
        rating: feedback.rating,
        category: feedback.category,
        hasComment: feedback.comment.length > 0,
        hasEmail: (feedback.email || '').length > 0,
        commentLength: feedback.comment.length
      });

      // Here you would send to your feedback collection endpoint
      // await submitFeedback(feedback);

      // Save to localStorage for now
      const existingFeedback = JSON.parse(localStorage.getItem('election-sathi-feedback') || '[]');
      existingFeedback.push({
        ...feedback,
        embedId,
        messageId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      localStorage.setItem('election-sathi-feedback', JSON.stringify(existingFeedback));

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFeedback({ rating: 0, category: '', comment: '', email: '' });
      }, 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      trackEvent('feedback_error', { embedId, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-600">Your feedback helps us improve ElectionSathi for everyone.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share Your Feedback</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`p-1 transition-colors ${
                    star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-300`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's this feedback about?
            </label>
            <select
              value={feedback.category}
              onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Tell us more about your experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optional - for follow-up)
            </label>
            <input
              type="email"
              value={feedback.email}
              onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={feedback.rating === 0 || !feedback.category || isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your feedback helps us improve ElectionSathi. We respect your privacy and will only use your email to follow up if necessary.
          </p>
        </div>
      </div>
    </div>
  );
}