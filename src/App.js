import React, { useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode'; // Changed from 'import jwtDecode from "jwt-decode"'
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions,
  TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions, CssBaseline, ThemeProvider,
  createTheme,
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    h1: { fontSize: '2rem', fontWeight: 500 },
    h2: { fontSize: '1.5rem', fontWeight: 500 },
  },
});

function App() {
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyUsername, setVerifyUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const poolData = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  };
  const userPool = new CognitoUserPool(poolData);

  useEffect(() => {
    const storedToken = localStorage.getItem('idToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedToken && storedRefreshToken) {
      const decoded = jwtDecode(storedToken);
      const currentTime = Date.now() / 1000;
      if (decoded.exp > currentTime) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setIsLoggedIn(true);
      } else {
        refreshAuthToken(storedRefreshToken);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchProjects();
    }
  }, [isLoggedIn, token]);

  const refreshAuthToken = (refreshToken) => {
    const user = new CognitoUser({ Username: loginUsername || localStorage.getItem('username'), Pool: userPool });
    const cognitoRefreshToken = new window.CognitoRefreshToken({ RefreshToken: refreshToken });
    user.refreshSession(cognitoRefreshToken, (err, session) => {
      if (err) {
        console.error('Failed to refresh token:', err);
        handleLogout();
        return;
      }
      const newIdToken = session.getIdToken().getJwtToken();
      localStorage.setItem('idToken', newIdToken);
      setToken(newIdToken);
    });
  };

  const makeApiCall = async (url, method, body = null) => {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    let authToken = token;
    if (decoded.exp < currentTime) {
      refreshAuthToken(refreshToken);
      authToken = localStorage.getItem('idToken');
    }
    const options = {
      method,
      headers: { 'Authorization': `Bearer ${authToken}` },
    };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Failed to ${method} ${url}`);
    return response.json();
  };

  const fetchProjects = async () => {
    try {
      const data = await makeApiCall('https://backend.hello-world.local.codelifted.com/projects', 'GET');
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: regEmail }),
      new CognitoUserAttribute({ Name: 'given_name', Value: regFirstName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: regLastName }),
    ];
    userPool.signUp(regUsername, regPassword, attributeList, null, (err) => {
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: verifyUsername, Pool: userPool });
    user.confirmRegistration(verificationCode, true, (err) => {
      if (err) {
        alert('Verification failed: ' + err.message);
        return;
      }
      alert('Email verified successfully. You can now log in.');
      setVerificationCode('');
      setVerifyUsername('');
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: loginUsername, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: loginUsername, Password: loginPassword });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('username', loginUsername);
        setToken(idToken);
        setRefreshToken(refreshToken);
        setIsLoggedIn(true);
        setLoginUsername('');
        setLoginPassword('');
      },
      onFailure: (err) => {
        alert('Login failed: ' + err.message);
      },
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setRefreshToken('');
    setProjects([]);
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
  };

  const handleCreateProject = async () => {
    try {
      await makeApiCall('https://backend.hello-world.local.codelifted.com/projects', 'POST', { name: newProjectName });
      setNewProjectName('');
      setOpenDialog(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await makeApiCall(`https://backend.hello-world.local.codelifted.com/projects/${id}`, 'DELETE');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>SaaS Platform</Typography>
          {isLoggedIn && <Button color="inherit" onClick={handleLogout}>Logout</Button>}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {!isLoggedIn ? (
          <Box>
            <Typography variant="h1" gutterBottom>Register</Typography>
            <form onSubmit={handleRegister}>
              <TextField fullWidth margin="normal" label="Username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
              <TextField fullWidth margin="normal" label="Email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <TextField fullWidth margin="normal" label="First Name" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
              <TextField fullWidth margin="normal" label="Last Name" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
              <TextField fullWidth margin="normal" label="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Register</Button>
            </form>

            <Typography variant="h1" gutterBottom sx={{ mt: 4 }}>Verify Email</Typography>
            <form onSubmit={handleVerify}>
              <TextField fullWidth margin="normal" label="Username" value={verifyUsername} onChange={(e) => setVerifyUsername(e.target.value)} />
              <TextField fullWidth margin="normal" label="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Verify</Button>
            </form>

            <Typography variant="h1" gutterBottom sx={{ mt: 4 }}>Login</Typography>
            <form onSubmit={handleLogin}>
              <TextField fullWidth margin="normal" label="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
              <TextField fullWidth margin="normal" label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
            </form>
          </Box>
        ) : (
          <Box>
            <Typography variant="h1" gutterBottom>Your Projects</Typography>
            <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
              Create Project
            </Button>
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5">{project.name}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="secondary" onClick={() => handleDeleteProject(project.id)}>Delete</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Project Name"
                  fullWidth
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateProject}>Create</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;