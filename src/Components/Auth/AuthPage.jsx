import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthPage.scss';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Government Portal</h1>
          <p>Secure access to government services</p>
        </div>
        
        {isLoginMode ? (
          <Login onToggleMode={toggleMode} />
        ) : (
          <Register onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
