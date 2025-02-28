import './App.css';
import React, { useEffect } from 'react';
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: 'saas-hello-world-auth',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
});

function App() {
  useEffect(() => {
    keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256' }).then(auth => {
      if (auth) {
        console.log('Authenticated', keycloak.token);
        fetch('http://hello-backend.saas-hello-world.svc.cluster.local:3000/api', {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
      }
    });
  }, []);

  return <div>Hello from React!</div>;
}

export default App;
