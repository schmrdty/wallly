'use client';

import React, { useState } from 'react';

interface FeedbackComponentProps {
    className?: string;
    showForSignedInOnly?: boolean;
    currentUser?: any;
}

export const FeedbackComponent: React.FC<FeedbackComponentProps> = ({
    className = '',
    showForSignedInOnly = false,
    currentUser
}) => {
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Don't show if this is for signed-in users only and user isn't signed in
    if (showForSignedInOnly && !currentUser) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback.trim()) {
            console.log('Feedback submitted:', feedback);
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setFeedback('');
            }, 3000);
        }
    };

    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-lg p-6 pondWater-font ${className}`}>
            <h2 className="text-xl font-semibold text-white mb-4">💬 Feedback</h2>
            {submitted ? (
                <div className="text-center py-4 text-white">
                    <p>Thank you for your feedback!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <textarea
                        className="w-full p-3 rounded-lg bg-white/20 text-white pondWater-font"
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Your feedback..."
                        rows={4}
                        required
                    />
                    <button type="submit" className="pondWater-btn px-6 py-2 rounded-lg font-semibold">Submit</button>
                </form>
            )}
        </div>
    );
};
