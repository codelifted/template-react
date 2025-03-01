import './App.css';
import React, { useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';

// Initialize Keycloak with environment variables
const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL, // e.g., http://idp.hello-world.local.codelifted.com
  realm: 'saas-hello-world-auth',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID, // e.g., saas-client
});

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Keycloak with PKCE and login-required
    keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256' }).then(auth => {
      if (auth) {
        console.log('Authenticated', keycloak.token);
        setAuthenticated(true);
        // Fetch from backend with token
        fetch('http://hello-backend.saas-hello-world.svc.cluster.local:3000/api', {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        })
          .then(response => response.json())
          .then(data => console.log('Backend response:', data))
          .catch(error => console.error('Fetch error:', error));
      }
    }).catch(error => console.error('Keycloak init error:', error));
  }, []);

  // Function to redirect to Keycloak registration page
  const handleRegister = () => {
    window.location.href = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/registrations`;
  };

  return (
    <div className="App">
      {authenticated ? (
        <div>
          <h1>Hello from React!</h1>
          <button onClick={() => keycloak.logout()}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>Welcome</h1>
          <button onClick={handleRegister}>Register</button>
          <button onClick={() => keycloak.login()}>Login</button>
        </div>
      )}
    </div>
  );
}

export default App;