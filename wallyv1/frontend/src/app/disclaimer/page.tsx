"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

const Disclaimer = () => (
  <div className="termsContainer" style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
    <h1>Disclaimer</h1>
    <p>
      <strong>Wally the Wallet Watcher is provided "as is" without any warranties of any kind.</strong>
    </p>
    <ul>
      <li>Use of this application is at your own risk.</li>
      <li>Wally does not store your private keys or sensitive wallet information.</li>
      <li>We are not responsible for any loss of funds, data, or damages resulting from the use of this app.</li>
      <li>Always verify all transactions and actions in your wallet before confirming.</li>
      <li>This app is not financial advice and should not be used as such.</li>
      <li>Wally is in beta and features may change or be discontinued at any time.</li>
    </ul>
    <p>
      For questions or concerns, contact <a href="mailto:schmrdty@proton.me">schmrdty@proton.me</a>.
    </p>
    <p>
      &copy; 2025 Wally the Wallet Watcher
    </p>
  </div>
);

export default Disclaimer;
