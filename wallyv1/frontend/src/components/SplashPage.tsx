import React from 'react';
import Link from 'next/link';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
    return (
        <div className="splash-page">
            <h1>Welcome to Wally the Wallet Watcher</h1>
            <img src="/splash.png" alt="Wally Logo" />
            <p>
                Wally helps you automate non-custodial token transfers securely and efficiently.
                Get started by following the steps below.
            </p>
            <h2>Getting Started</h2>
            <ol>
                <li>
                    <strong>Authenticate:</strong> Log in using your Farcaster account to create a secure session.
                </li>
                <li>
                    <strong>Whitelist:</strong> Wally is currently in closed beta. Please contact @schmidtiest.base.eth for access or info.
                </li>
                <li>
                    <strong>Transfer Tokens:</strong> Use the Transfer Form & built in validator to send tokens to your desired recipient.
                </li>
                <li>
                    <strong>Manage Sessions:</strong> View and revoke active sessions for enhanced security.
                </li>
                <li>
                    <strong>Monitor Events:</strong> Track real-time updates on your transactions in the Event Feed.
                </li>
                <li>
                    <strong>Export Data:</strong> Download your Wally transaction history for your records.
                </li>
            </ol>
            <h2>Safety Tips</h2>
            <ul>
                <li>Double-check recipient addresses before confirming a transfer.</li>
                <li>Keep your Farcaster credentials secure and private.</li>
                <li>Regularly review and revoke unused sessions.</li>
            </ul>
            <Link href="/instructions" className="btn">
                View Detailed Instructions
            </Link>
        </div>
    );
}

export default SplashPage;