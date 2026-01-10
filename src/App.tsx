import { SocialCardGenerator } from './components/SocialCardGenerator';

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#000' 
    }}>
      <SocialCardGenerator />
    </div>
  );
}

export default App;