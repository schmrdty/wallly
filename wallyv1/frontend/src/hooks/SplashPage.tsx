import React from 'react';
import { Link } from 'react-router-dom';

const SplashPage: React.FC = () => {
    return (
        <div className="splash-page">
            <h1>Welcome to the Warpcast Mini-App</h1>
            <img src="/splash.png"/>
            <p>
                This application allows you to automate non-custodial token transfers securely and easily.
                Please follow the instructions below to get started.
            </p>
            <h2>Getting Started</h2>
            <ol>
                <li>
                    <strong>Authenticate:</strong> Use your Farcaster account to log in and create a session.
                </li>
                <li>
                    <strong>Validate Tokens:</strong> Ensure the tokens you wish to transfer are valid by using the Token Validator.
                </li>
                <li>
                    <strong>Transfer Tokens:</strong> Fill out the Transfer Form to initiate your token transfers.
                </li>
                <li>
                    <strong>Monitor Events:</strong> Keep an eye on the Event Feed for real-time updates on your transactions.
                </li>
                <li>
                    <strong>Export Data:</strong> Use the Export Data feature to download your transactions while using Wally.
                </li>
            </ol>
            <h2>Safety Tips</h2>
            <ul>
                <li>Always double-check token addresses before initiating transfers.</li>
                <li>Keep your Farcaster credentials secure and do not share them with anyone.</li>
                <li>Regularly review your session status and revoke sessions that are no longer needed.</li>
            </ul>
            <Link to="/instructions" className="btn">
                View Detailed Instructions
            </Link>
        </div>
    );
};

export default SplashPage;