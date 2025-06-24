import React, { useState } from 'react';
import SplashLogo from './SplashLogo.tsx';

const events = [
  { id: 1, content: '🚀 Launching Wally!' },
  { id: 2, content: '🎉 Milestone reached!' },
  { id: 3, content: '🔥 Exclusive Shenanigans!' },
  { id: 4, content: '🔗 New integrations!' },
  { id: 5, content: '💡 Exciting Shenanigans!' },
];

const EventFeed: React.FC = () => {
  const [index, setIndex] = useState(0);

  const scrollUp = () => setIndex((prev) => Math.max(prev - 1, 0));
  const scrollDown = () =>
    setIndex((prev) => Math.min(prev + 1, events.length - 1));

  return (
    <div>
      <div className='event-feed'>
        <h1 className='title'>📢 Farcaster Event Feed</h1>
        <div className='event-box'>
          <p className='event-text'>{events[index]?.content}</p>
        </div>
        <div className='buttons'>
          <button onClick={scrollUp} className='scroll-button'>⬆️ Up</button>
          <button onClick={scrollDown} className='scroll-button'>⬇️ Down</button>
        </div>
      </div>
      <center><SplashLogo /></center>
    </div>
  );
};

export default EventFeed;