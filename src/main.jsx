import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Import your existing CSS here so it applies globally
import './styles/styles.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
