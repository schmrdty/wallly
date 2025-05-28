import React from 'react';

const Terms = () => (
  <div className="termsContainer" style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
    <h1>Terms of Use</h1>
    <p>
    <strong>By using Wally the Wallet Watcher, you agree to the following terms:</strong>
    </p>
    <ul>
      <li>Wally is a non-custodial wallet automation tool. You are responsible for your own keys and funds.</li>
      <li>Always confirm actions in your wallet. Never share your private keys or sensitive information.</li>
      <li>Wally does not provide financial advice and is not responsible for any loss or damages resulting from use.</li>
      <li>By signing in, you consent to the use of your wallet for automation and monitoring as described in the app.</li>
      <li>Wally is in beta and may change or be discontinued at any time.</li>
    </ul>
    <p>
      For questions, contact <a href="mailto:schmrdty@proton.me">@schmrdty@proton.me</a>.
    </p>
    <p>
      &copy; 2025 Wally the Wallet Watcher
    </p>
  </div>
);

export default Terms;
