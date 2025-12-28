import React from 'react';

const Header = () => {
  return (
    <header className="app-header">
      <div>
        <h1 className="brand-title">
          CatInCloud<span className="text-accent">.io</span>
        </h1>
        <div className="brand-sub">
          QUANT_PIPELINE :: LIVE_MODE
        </div>
      </div>
      <a href="https://catincloudlabs.com" className="nav-link">Exit to Main Site &rarr;</a>
    </header>
  );
};

export default Header;
