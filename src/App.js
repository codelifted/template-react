import React, { useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions,
  TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions, CssBaseline, ThemeProvider,
  createTheme, Paper, Link, Stack, IconButton, Divider,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { styled } from '@mui/system';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
}));

const theme = createTheme({
  palette: {
    mode: 'light', // Default to light mode, toggleable
    primary: {
      main: '#2196F3', // Bright blue for primary actions
    },
    secondary: {
      main: '#F50057', // Vibrant pink for secondary actions
    },
    background: {
      default: '#F5F7FA', // Light grayish background for a clean look
      paper: '#FFFFFF',   // White paper for contrast
    },
    text: {
      primary: '#1A2027', // Dark text for readability
      secondary: '#6B7280', // Subtle gray for secondary text
    },
    action: {
      hover: 'rgba(33, 150, 243, 0.08)', // Subtle hover effect for buttons
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1A2027',
      letterSpacing: '-0.5px',
      marginBottom: '1rem',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1A2027',
      marginBottom: '0.5rem',
    },
    body1: {
      fontSize: '1rem',
      color: '#6B7280',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 16px',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'rgba(33, 150, 243, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#2196F3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2196F3',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" sx={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h2" sx={{ flexGrow: 1, fontWeight: 700, color: '#FFFFFF' }}>
              SaaS Platform
            </Typography>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <AuthWrapper darkMode={darkMode} />
      </Router>
    </ThemeProvider>
  );
}

function AuthWrapper({ darkMode }) {
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
  const [refreshToken, setRefreshToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
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

  const refreshAuthToken = (refreshTokenString) => {
    const user = new CognitoUser({ Username: loginUsername || localStorage.getItem('username'), Pool: userPool });
    const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenString });
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
      alert('Registration successful. Please enter the verification code sent to your email.');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegFirstName('');
      setRegLastName('');
      setShowVerify(true);
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: regUsername, Pool: userPool });
    user.confirmRegistration(verificationCode, true, (err) => {
      if (err) {
        alert('Verification failed: ' + err.message);
        return;
      }
      alert('Email verified successfully. You can now log in.');
      setVerificationCode('');
      setShowVerify(false);
      navigate('/login');
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
        navigate('/');
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
    navigate('/login');
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
        <Container maxWidth="md" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Register</Typography>
            <Box sx={{ maxWidth: 500, margin: '0 auto' }}>
              <form onSubmit={handleRegister}>
                <Stack spacing={2}>
                  <TextField fullWidth margin="normal" label="Username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} variant="outlined" />
                  <TextField fullWidth margin="normal" label="Email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} variant="outlined" />
                  <TextField fullWidth margin="normal" label="First Name" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} variant="outlined" />
                  <TextField fullWidth margin="normal" label="Last Name" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} variant="outlined" />
                  <TextField fullWidth margin="normal" label="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} variant="outlined" />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>Register</Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                Already have an account? <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', color: theme.palette.primary.main }}>Sign In</Link>
              </Typography>
              {showVerify && (
                <Box sx={{ mt: 4, maxWidth: 500, margin: '0 auto' }}>
                  <Typography variant="h1" gutterBottom>Verify Email</Typography>
                  <form onSubmit={handleVerify}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        variant="outlined"
                      />
                      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>Verify</Button>
                    </Stack>
                  </form>
                </Box>
              )}
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/login" element={
        <Container maxWidth="md" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Login</Typography>
            <Box sx={{ maxWidth: 500, margin: '0 auto' }}>
              <form onSubmit={handleLogin}>
                <Stack spacing={2}>
                  <TextField fullWidth margin="normal" label="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} variant="outlined" />
                  <TextField fullWidth margin="normal" label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} variant="outlined" />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>Login</Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                Don’t have an account? <Link onClick={() => navigate('/register')} sx={{ cursor: 'pointer', color: theme.palette.primary.main }}>Register</Link> | 
                Forgot password? <Link onClick={() => navigate('/recover')} sx={{ cursor: 'pointer', color: theme.palette.primary.main }}>Recover</Link>
              </Typography>
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/recover" element={
        <Container maxWidth="md" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Password Recovery</Typography>
            <Box sx={{ maxWidth: 500, margin: '0 auto' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Password recovery functionality to be implemented with Cognito.');
              }}>
                <Stack spacing={2}>
                  <TextField fullWidth margin="normal" label="Username or Email" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} variant="outlined" />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>Recover Password</Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                Back to <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', color: theme.palette.primary.main }}>Login</Link>
              </Typography>
            </Box>
          </CustomPaper>
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
            darkMode={darkMode}
          />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
}

function Dashboard({ projects, onCreateProject, onDeleteProject, newProjectName, setNewProjectName, openDialog, setOpenDialog, handleCreateProject, darkMode }) {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 800, p: 3, borderRadius: 16, backgroundColor: darkMode ? '#1A2027' : '#FFFFFF' }}>
        <Typography variant="h1" gutterBottom>Your Projects</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="contained" color="primary" onClick={onCreateProject} sx={{ borderRadius: 8, py: 1.5 }}>
            Create Project
          </Button>
        </Box>
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ borderRadius: 16, backgroundColor: darkMode ? '#2D3748' : '#FFFFFF' }}>
                <CardContent>
                  <Typography variant="h2" sx={{ color: darkMode ? '#FFFFFF' : '#1A2027' }}>{project.name}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="secondary" onClick={() => onDeleteProject(project.id)} sx={{ borderRadius: 8 }}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: 16, backgroundColor: darkMode ? '#1A2027' : '#FFFFFF' } }}>
        <DialogTitle sx={{ color: darkMode ? '#FFFFFF' : '#1A2027' }}>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            variant="outlined"
            sx={{ backgroundColor: darkMode ? '#2D3748' : '#FFFFFF', borderRadius: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: darkMode ? '#FFFFFF' : '#1A2027' }}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained" sx={{ borderRadius: 8, py: 1.5 }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;