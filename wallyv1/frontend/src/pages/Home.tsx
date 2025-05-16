import React from 'react';
import { Link } from 'react-router-dom';
import Auth from '../components/Auth';
import SplashPage from '../hooks/SplashPage';

const Home: React.FC = () => {
    return (
        <div className="home-container">
            <SplashPage />
            <h1>Welcome to the Warpcast Mini-App</h1>
            <p>Your gateway to automated non-custodial token transfers.</p>
            <Auth />
            <div className="navigation">
                <Link to="/dashboard">Go to Dashboard</Link>
                <Link to="/instructions">View Instructions</Link>
            </div>
        </div>
    );
};

export default Home;