import React from 'react';

const Instructions = () => (
  <div className="instructions-container">
    <h1>Welcome to Wally the Wallet Watcher</h1>
    <p>This application allows you to automate non-custodial token transfers securely and efficiently.</p>
    <h2>Getting Started</h2>
    <ol>
      <li>
        <strong>Authentication:</strong>
        Please log in using your Farcaster account. This ensures secure access to your wallet.
      </li>
      <li>
        <strong>Token Validation:</strong>
        If you are using a token that is not found in the token validator, please proceed with caution.
      </li>
      <li>
        <strong>Transfer Tokens:</strong>
        Navigate to the Transfer Form, enter the destination address, select the token, and specify the amount you want remaining in your watched wallet.
      </li>
      <li>
        <strong>Session Management:</strong>
        Manage your session effectively. You can view active session(s) and revoke them if necessary to maintain security.
      </li>
      <li>
        <strong>Event Updates:</strong>
        Keep an eye on the Event Feed for real-time updates on your transactions and any relevant contract events.
      </li>
      <li>
        <strong>Data Export:</strong>
        When the authorization given to Wally expires, if you entered a contact method, you will either receive an email or a message on Telegram with a link to download your data.
      </li>
    </ol>
    <h2>Safety Tips</h2>
    <ul>
      <li>Always double-check the recipient's address before confirming a transfer.</li>
      <li>Keep your Farcaster credentials secure and do not share them with anyone.</li>
      <li>By interacting with Wally, you acknowledge that Wally keeps the following data: Watched Address, date/time of permission granted and revoked & userId.</li>
    </ul>
    <h2>Need Help?</h2>
    <p>If you encounter any issues or have questions, please refer to the FAQ section or contact @schmidtiest.</p>
  </div>
);

export default Instructions;