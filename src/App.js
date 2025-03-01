import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://backend.hello-world.local.codelifted.com/register', {
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      alert('Registration successful');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://backend.hello-world.local.codelifted.com/login', {
        username: loginUsername,
        password: loginPassword,
      });
      setToken(response.data.access_token);
      setIsLoggedIn(true);
      alert('Login successful');
      setLoginUsername('');
      setLoginPassword('');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {!isLoggedIn ? (
        <div>
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px' }}>
              Register
            </button>
          </form>

          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px' }}>
              Login
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Welcome, you are logged in!</h2>
          <p><strong>Token:</strong> {token}</p>
          <button onClick={handleLogout} style={{ padding: '10px' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;