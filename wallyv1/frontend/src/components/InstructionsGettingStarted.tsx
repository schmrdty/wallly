import React from 'react';

export const InstructionsGettingStarted: React.FC = () => (
  <>
    <h2>Getting Started</h2>
    <ol>
      <li>
        <strong>Proceed carefully:</strong>
        Please be aware that this dApp is in Beta and that you may encounter bugs or issues, please report to @schmidtiests.eth. Use at your own risk.
      </li>
      <li>
        <strong>Authentication:</strong>
        Please log in using your Farcaster or Ethereum account. This ensures secure access to your wallet.
      </li>
      <li>
        <strong>Dashboard:</strong>
        Once logged in, you will be directed to the dashboard. Here, you can view your watched wallet address and configure your session.
      </li>
      <li>
        <strong>Transfer Form:</strong>
        Navigate to the Transfer Form, enter the destination address, token, and specify the amount you want remaining in your watched wallet.
      </li>
      <li>
        <strong>Session Management:</strong>
        Manage your session effectively. You can view active session(s) and revoke at any time.
      </li>
      <li>
        <strong>Event Updates:</strong>
        Keep an eye on the Event Feed for real-time updates on your transactions and any relevant contract events.
      </li>
      <li>
        <strong>Data Export:</strong>
        When the authorization given to Wally expires, if you entered a contact method, you can either receive an email or a message on Telegram with a link to download your data.
      </li>
    </ol>
  </>
);
