'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { logger } from '@/utils/logger';
import { feedbackRateLimiter } from '@/utils/rateLimiter';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const isMiniApp = tryDetectMiniAppClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit (using a simple identifier - could use user ID in production)
    const identifier = 'feedback-user'; // In production, use actual user ID
    if (!feedbackRateLimiter.isAllowed(identifier)) {
      const resetTime = feedbackRateLimiter.getResetTime(identifier);
      const remainingTime = Math.ceil((resetTime - Date.now()) / 1000 / 60); // minutes
      setRateLimitError(`Rate limit exceeded. Please wait ${remainingTime} minutes before submitting again.`);
      return;
    }

    setRateLimitError(null);
    setIsSubmitting(true);

    try {
      await sendFeedbackToBackend(feedback);
      setSubmitted(true);
      logger.info('Feedback submitted:', feedback);
      setFeedback('');
    } catch (error) {
      logger.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton />
          </div>

          {/* Doctor Wally Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image
                src="/doctor_wally.png"
                alt="Doctor Wally"
                width={150}
                height={150}
                className="mx-auto rounded-lg"
                style={{ maxWidth: '25vw', height: 'auto' }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Feedback (Beta)</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Doctor Wally wants to hear from you!</p>
          </div>

          {isMiniApp && (
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-6 text-center">
              <p className="text-blue-800 dark:text-blue-200">Running in Farcaster Mini App</p>
            </div>
          )}

          {submitted ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Thank you for your feedback!</h2>
                <p>Doctor Wally appreciates your input.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {rateLimitError && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                  <p className="font-medium">⚠️ {rateLimitError}</p>
                </div>
              )}
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="For any issues, suggestions, or feature requests, message me on Farcaster @schmidtiest.eth"
                rows={6}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => window.location.href = '/auth'}
              className="pondWater-btn px-6 py-3 rounded-lg font-semibold"
            >
              Back to Auth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

async function sendFeedbackToBackend(feedback: string) {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to send feedback:', error);
    throw error;
  }
}

export default Feedback;

