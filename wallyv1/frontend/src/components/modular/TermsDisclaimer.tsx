'use client';

import React, { useState } from 'react';

interface TermsDisclaimerProps {
    className?: string;
    compact?: boolean;
}

export const TermsDisclaimer: React.FC<TermsDisclaimerProps> = ({
    className = '',
    compact = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (compact) {
        return (
            <div className={`bg-white/10 backdrop-blur-md rounded-lg p-4 ${className}`}>
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-2">
                        By using Wally, you agree to our{' '}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Terms & Privacy Policy
                        </button>
                    </p>
                    {isExpanded && (
                        <div className="mt-3 p-3 bg-white/10 rounded text-left">
                            <h4 className="text-sm font-medium text-white mb-2">Key Points:</h4>
                            <ul className="text-xs text-gray-300 space-y-1">
                                <li>• Your wallet data is processed securely</li>
                                <li>• We don't store private keys</li>
                                <li>• Farcaster authentication is handled by their SDK</li>
                                <li>• All transactions require your explicit approval</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-lg p-6 ${className}`}>
            <h2 className="text-xl font-semibold text-white mb-4">📜 Terms & Disclaimer</h2>

            <div className="space-y-4 text-sm text-gray-300">
                <div>
                    <h3 className="text-white font-medium mb-2">🔐 Security & Privacy</h3>
                    <ul className="space-y-1 ml-4">
                        <li>• Your private keys never leave your device</li>
                        <li>• We use industry-standard encryption</li>
                        <li>• Authentication is handled by Farcaster's secure SDK</li>
                        <li>• Session data is stored temporarily and encrypted</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-medium mb-2">⚖️ Usage Terms</h3>
                    <ul className="space-y-1 ml-4">
                        <li>• Use this service at your own risk</li>
                        <li>• Always verify transaction details before approval</li>
                        <li>• We are not responsible for user errors</li>
                        <li>• Service availability is not guaranteed</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-medium mb-2">🔄 Data Handling</h3>
                    <ul className="space-y-1 ml-4">
                        <li>• Minimal data collection (only what's necessary)</li>
                        <li>• No selling of personal information</li>
                        <li>• You can request data deletion anytime</li>
                        <li>• Compliance with applicable privacy laws</li>
                    </ul>
                </div>

                <div className="pt-4 border-t border-white/20">
                    <p className="text-xs text-gray-400">
                        <strong>Disclaimer:</strong> This is beta software. Use small amounts for testing.
                        The developers are not liable for any losses incurred through the use of this application.
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button className="flex-1 pondWater-btn border-2 border-yellow-400 shadow-[0_0_16px_2px_rgba(255,255,0,0.3)] backdrop-blur-md" style={{ borderRadius: '10px', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600, textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)' }}>
                        View Full Terms
                    </button>
                    <button className="flex-1 pondWater-btn border-2 border-yellow-400 shadow-[0_0_16px_2px_rgba(255,255,0,0.3)] backdrop-blur-md" style={{ borderRadius: '10px', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600, textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)' }}>
                        Privacy Policy
                    </button>
                </div>
            </div>
        </div>
    );
};
