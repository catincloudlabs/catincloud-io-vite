import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <p>
        © {year} CatInCloud Labs. 
        <span className="opacity-50 mx-2">|</span> 
        Not Financial Advice.
      </p>
    </footer>
  );
};

export default Footer;
