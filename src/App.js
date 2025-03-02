import React, { useState } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

function App() {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [protectedData, setProtectedData] = useState(null);

  // Configure Cognito User Pool
  const poolData = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  };
  const userPool = new CognitoUserPool(poolData);

  // Handle login and fetch token
  const handleLogin = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: loginUsername, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: loginUsername,
      Password: loginPassword,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        setToken(idToken);
        setIsLoggedIn(true);
        alert('Login successful');
        // Call the backend with the token
        fetchProtectedData(idToken);
      },
      onFailure: (err) => {
        alert('Login failed: ' + err.message);
      },
    });
  };

  // Fetch protected data from the backend
  const fetchProtectedData = async (token) => {
    try {
      const response = await fetch('https://backend.hello-world.local.codelifted.com/protected', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch protected data');
      }

      const data = await response.json();
      setProtectedData(data);
    } catch (error) {
      console.error('Error fetching protected data:', error);
      alert('Failed to fetch protected data');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setProtectedData(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {!isLoggedIn ? (
        <div>
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
          {protectedData && (
            <div>
              <h3>Protected Data</h3>
              <pre>{JSON.stringify(protectedData, null, 2)}</pre>
            </div>
          )}
          <button onClick={handleLogout} style={{ padding: '10px' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;