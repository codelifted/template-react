import React, { useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions,
  TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions, CssBaseline, ThemeProvider,
  createTheme, Link,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthWrapper />
      </ThemeProvider>
    </Router>
  );
}

function AuthWrapper() {
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
  const navigate = useNavigate();

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
        setRefreshToken(storedToken); // Store the refresh token correctly
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

  const refreshAuthToken = (refreshTokenString) => {
    const user = new CognitoUser({ Username: loginUsername || localStorage.getItem('username'), Pool: userPool });
    const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenString }); // Use CognitoRefreshToken directly
    user.refreshSession(refreshToken, (err, session) => {
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
      refreshAuthToken(localStorage.getItem('refreshToken'));
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
      navigate('/login'); // Redirect to login after registration
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
      navigate('/login'); // Redirect to login after verification
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: loginUsername, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: loginUsername, Password: loginPassword });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken(); // Get the refresh token string
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('refreshToken', refreshToken); // Store the refresh token string
        localStorage.setItem('username', loginUsername);
        setToken(idToken);
        setRefreshToken(refreshToken); // Update state with the refresh token string
        setIsLoggedIn(true);
        setLoginUsername('');
        setLoginPassword('');
        navigate('/'); // Redirect to home after login
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
    navigate('/login'); // Redirect to login after logout
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
    <Routes>
      <Route path="/register" element={
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h1" gutterBottom>Register</Typography>
          <form onSubmit={handleRegister}>
            <TextField fullWidth margin="normal" label="Username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
            <TextField fullWidth margin="normal" label="Email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            <TextField fullWidth margin="normal" label="First Name" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
            <TextField fullWidth margin="normal" label="Last Name" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
            <TextField fullWidth margin="normal" label="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Register</Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Already have an account? <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>Sign In</Link>
          </Typography>
        </Container>
      } />
      <Route path="/login" element={
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h1" gutterBottom>Login</Typography>
          <form onSubmit={handleLogin}>
            <TextField fullWidth margin="normal" label="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            <TextField fullWidth margin="normal" label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Don’t have an account? <Link onClick={() => navigate('/register')} sx={{ cursor: 'pointer' }}>Register</Link> | 
            Forgot password? <Link onClick={() => navigate('/recover')} sx={{ cursor: 'pointer' }}>Recover</Link>
          </Typography>
        </Container>
      } />
      <Route path="/recover" element={
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h1" gutterBottom>Password Recovery</Typography>
          <form onSubmit={(e) => {
            e.preventDefault();
            alert('Password recovery functionality to be implemented with Cognito.');
          }}>
            <TextField fullWidth margin="normal" label="Username or Email" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Recover Password</Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Back to <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>Login</Link>
          </Typography>
        </Container>
      } />
      <Route path="/" element={
        isLoggedIn ? (
          <Dashboard 
            projects={projects} 
            onCreateProject={() => setOpenDialog(true)} 
            onDeleteProject={handleDeleteProject} 
            newProjectName={newProjectName} 
            setNewProjectName={setNewProjectName} 
            openDialog={openDialog} 
            setOpenDialog={setOpenDialog} 
            handleCreateProject={handleCreateProject}
          />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
}

function Dashboard({ projects, onCreateProject, onDeleteProject, newProjectName, setNewProjectName, openDialog, setOpenDialog, handleCreateProject }) {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h1" gutterBottom>Your Projects</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="primary" onClick={onCreateProject}>
          Create Project
        </Button>
      </Box>
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h5">{project.name}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="secondary" onClick={() => onDeleteProject(project.id)}>Delete</Button>
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
    </Container>
  );
}

export default App;