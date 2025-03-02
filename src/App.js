import React, { useState } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

function App() {
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  const poolData = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  };
  const userPool = new CognitoUserPool(poolData);

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: regEmail }),
      new CognitoUserAttribute({ Name: 'given_name', Value: regFirstName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: regLastName }),
    ];
    userPool.signUp(regUsername, regPassword, attributeList, null, (err, result) => {
      if (err) {
        alert('Registration failed: ' + err.message);
        return;
      }
      alert('Registration successful. Please check your email for a verification code.');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegFirstName('');
      setRegLastName('');
    });
  };

  // Handle email verification
  const handleVerify = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: regUsername, Pool: userPool });
    user.confirmRegistration(verificationCode, true, (err, result) => {
      if (err) {
        alert('Verification failed: ' + err.message);
        return;
      }
      alert('Email verified successfully. You can now log in.');
      setVerificationCode('');
    });
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: loginUsername, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: loginUsername, Password: loginPassword });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        setToken(idToken);
        setIsLoggedIn(true);
        alert('Login successful');
        setLoginUsername('');
        setLoginPassword('');
      },
      onFailure: (err) => {
        alert('Login failed: ' + err.message);
      },
    });
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
                type="text"
                placeholder="First Name"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Last Name"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
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

          <h2>Verify Email</h2>
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px' }}>
              Verify
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