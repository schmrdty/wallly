import React from 'react';

const Instructions: React.FC = () => {
    return (
        <div className="instructions-container">
            <h1>Welcome to the Warpcast Mini-App</h1>
            <p>This application allows you to automate non-custodial token transfers securely and efficiently.</p>
            <h2>Getting Started</h2>
            <ol>
                <li>
                    <strong>Authentication:</strong> 
                    Please log in using your Farcaster account. This ensures secure access to your wallet and transaction capabilities.
                </li>
                <li>
                    <strong>Token Validation:</strong> 
                    Before initiating a transfer, ensure that the token you wish to send is valid. Use the Token Validator component to check the token address.
                </li>
                <li>
                    <strong>Transfer Tokens:</strong> 
                    Navigate to the Transfer Form, enter the recipient's address, select the token, and specify the amount you wish to transfer.
                </li>
                <li>
                    <strong>Session Management:</strong> 
                    Manage your session effectively. You can view active sessions and revoke them if necessary to maintain security.
                </li>
                <li>
                    <strong>Event Updates:</strong> 
                    Keep an eye on the Event Feed for real-time updates on your transactions and any relevant contract events.
                </li>
                <li>
                    <strong>Data Export:</strong> 
                    You can export your transaction history and other relevant data to CSV format for your records.
                </li>
            </ol>
            <h2>Safety Tips</h2>
            <ul>
                <li>Always double-check the recipient's address before confirming a transfer.</li>
                <li>Keep your Farcaster credentials secure and do not share them with anyone.</li>
                <li>Regularly review your active sessions and revoke any that are no longer needed.</li>
            </ul>
            <h2>Need Help?</h2>
            <p>If you encounter any issues or have questions, please refer to the FAQ section or contact @schmidtiest.</p>
        </div>
    );
};

export default Instructions;