import React from 'react';

function SplashSpinner() {
  return (
    <div>
      <img src='/splash.png' alt='Splash' width={200} height={200} />
      <div className='spinnerContainer'>
        <div className='spinner'></div>
      </div>
    </div>
  );
}

export default SplashSpinner;
