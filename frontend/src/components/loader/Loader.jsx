import React from 'react';
import './Loader.css'; // Import the CSS file for styles

function Loader() {
  return (
    <div className='loader-container'>
      <div className='loader'></div>
      <div className='text-white'></div>
    </div>
  );
}

export default Loader;