import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import styles from '../../styles/Home.module.css';

const SplashPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Wally the Wallet Watcher
        </h1>

        <p className={styles.description}>
          Automate non-custodial wallet monitoring and transfers
        </p>

        <div className={styles.grid}>
          <div 
            className={styles.card}
            onClick={() => router.push('/Home')}
            style={{ cursor: 'pointer' }}
          >
            <h2>Get Started &rarr;</h2>
            <p>Sign in to start using Wally.</p>
          </div>

          <a
            href="https://github.com/schmidtiest/wallly"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h2>Documentation &rarr;</h2>
            <p>Learn more about Wally's features.</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Wally the Wallet Watcher 2025</p>
        <p>Brought to you by @schmidtiest.eth</p>
      </footer>
    </div>
  );
};

export default SplashPage;