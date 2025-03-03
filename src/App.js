import React, { useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions,
  TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions, CssBaseline, ThemeProvider,
  createTheme, Paper, Link, Stack, Switch, CircularProgress, Avatar,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { styled } from '@mui/system';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
}));

const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#4CAF50' },
    secondary: { main: '#2196F3' },
    background: {
      default: mode === 'dark' ? '#121212' : '#F9FAFB',
      paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#E2E8F0' : '#1F2A44',
      secondary: mode === 'dark' ? '#94A3B8' : '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? 'linear-gradient(90deg, #1B5E20, #33691E)' : 'linear-gradient(90deg, #4CAF50, #8BC34A)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { backgroundColor: mode === 'dark' ? '#33691E' : 'rgb(76, 175, 80, 0.12)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: mode === 'dark' ? '#2D3748' : '#F9FAFB',
            '& fieldset': { borderColor: mode === 'dark' ? '#4B5563' : '#D1D5DB' },
            '&:hover fieldset': { borderColor: '#4CAF50' },
            '&.Mui-focused fieldset': { borderColor: '#4CAF50' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' },
        },
      },
    },
  },
});

const userPool = new CognitoUserPool({
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
});

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeProvider theme={createAppTheme(darkMode ? 'dark' : 'light')}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h2" sx={{ flexGrow: 1 }}>
              Codelifted
            </Typography>
            <Box>
              <Button variant="outlined" color="primary" onClick={() => navigate('/profile')} sx={{ mr: 2 }}>
                Profile
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              icon={<Brightness7Icon />}
              checkedIcon={<Brightness4Icon />}
              color="default"
            />
          </Toolbar>
        </AppBar>
        <AuthWrapper />
      </Router>
    </ThemeProvider>
  );
}

function AuthWrapper() {
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [verifyUsername, setVerifyUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [userAttributes, setUserAttributes] = useState({});
  const navigate = useNavigate();

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
        fetchUserAttributes();
      } else {
        refreshAuthToken(storedRefreshToken);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) fetchProjects();
  }, [isLoggedIn, token]);

  const refreshAuthToken = (refreshTokenString) => {
    const user = new CognitoUser({ Username: localStorage.getItem('username'), Pool: userPool });
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

  const fetchUserAttributes = () => {
    const user = new CognitoUser({ Username: localStorage.getItem('username'), Pool: userPool });
    user.getSession((err, session) => {
      if (err) return;
      user.getUserAttributes((err, attributes) => {
        if (err) {
          console.error('Error fetching attributes:', err);
          return;
        }
        const attrMap = {};
        attributes.forEach(attr => {
          attrMap[attr.getName()] = attr.getValue();
        });
        setUserAttributes(attrMap);
      });
    });
  };

  const validateRegisterForm = () => {
    const errors = {};
    if (!regUsername) errors.username = 'Username is required';
    if (!regEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(regEmail)) errors.email = 'Valid email is required';
    if (!regFirstName) errors.firstName = 'First name is required';
    if (!regLastName) errors.lastName = 'Last name is required';
    if (!regPassword) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLoginForm = () => {
    const errors = {};
    if (!loginUsername) errors.username = 'Username is required';
    if (!loginPassword) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    setIsRegistering(true);
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: regEmail }),
      new CognitoUserAttribute({ Name: 'given_name', Value: regFirstName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: regLastName }),
    ];
    userPool.signUp(regUsername, regPassword, attributeList, null, (err) => {
      setIsRegistering(false);
      if (err) {
        if (err.code === 'UsernameExistsException') {
          setVerifyUsername(regUsername);
          navigate('/verify');
        } else {
          alert('Registration failed: ' + err.message);
        }
        return;
      }
      setVerifyUsername(regUsername);
      navigate('/verify');
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyUsername || verifyUsername.trim().length < 1) {
      alert('Please enter a valid username for verification');
      return;
    }
    const user = new CognitoUser({ Username: verifyUsername.trim(), Pool: userPool });
    user.confirmRegistration(verificationCode, true, (err) => {
      if (err) {
        alert('Verification failed: ' + err.message);
        return;
      }
      alert('Email verified successfully. You can now log in.');
      setVerificationCode('');
      setVerifyUsername('');
      navigate('/login');
    });
  };

  const handleResendCode = () => {
    if (!verifyUsername || verifyUsername.trim().length < 1) {
      alert('Please enter a valid username to resend the code');
      return;
    }
    const user = new CognitoUser({ Username: verifyUsername.trim(), Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) {
        alert('Failed to resend code: ' + err.message);
        return;
      }
      alert('Verification code resent successfully');
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setIsLoggingIn(true);
    const user = new CognitoUser({ Username: loginUsername, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: loginUsername, Password: loginPassword });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        setIsLoggingIn(false);
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
        setIsLoggingIn(false);
        if (err.code === 'UserNotConfirmedException') {
          setVerifyUsername(loginUsername);
          navigate('/verify');
        } else {
          alert('Login failed: ' + err.message);
        }
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
        <Container maxWidth="sm" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Create Account</Typography>
            <Box sx={{ maxWidth: '500px', margin: '0 auto' }}>
              <form onSubmit={handleRegister}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                  <TextField
                    fullWidth
                    label="First Name"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isRegistering}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    {isRegistering ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                  </Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                Already have an account? <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', color: 'primary.main' }}>Sign In</Link>
              </Typography>
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/login" element={
        <Container maxWidth="sm" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Welcome Back</Typography>
            <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
              <form onSubmit={handleLogin}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    variant="outlined"
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isLoggingIn}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    {isLoggingIn ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                Don’t have an account? <Link onClick={() => navigate('/register')} sx={{ cursor: 'pointer', color: 'primary.main' }}>Sign Up</Link> | 
                Forgot password? <Link onClick={() => navigate('/recover')} sx={{ cursor: 'pointer', color: 'primary.main' }}>Recover</Link>
              </Typography>
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/recover" element={
        <Container maxWidth="sm" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Recover Password</Typography>
            <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Password recovery functionality to be implemented with Cognito.');
              }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Username or Email"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    variant="outlined"
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>
                    Recover Password
                  </Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                Back to <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', color: 'primary.main' }}>Sign In</Link>
              </Typography>
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/verify" element={
        <Container maxWidth="sm" sx={{ mt: 4, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CustomPaper elevation={3}>
            <Typography variant="h1" gutterBottom>Verify Email</Typography>
            <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
              <form onSubmit={handleVerify}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={verifyUsername}
                    onChange={(e) => setVerifyUsername(e.target.value)}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    variant="outlined"
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }}>
                    Verify
                  </Button>
                  <Button onClick={handleResendCode} variant="outlined" fullWidth sx={{ mt: 1 }}>
                    Resend Code
                  </Button>
                </Stack>
              </form>
              <Typography sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', color: 'primary.main' }}>Back to Sign In</Link>
              </Typography>
            </Box>
          </CustomPaper>
        </Container>
      } />
      <Route path="/profile" element={
        isLoggedIn ? (
          <ProfilePage
            userAttributes={userAttributes}
            setUserAttributes={setUserAttributes}
            fetchUserAttributes={fetchUserAttributes}
            setVerifyUsername={setVerifyUsername}
          />
        ) : (
          <Navigate to="/login" replace />
        )
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Your Projects</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="contained" color="primary" onClick={onCreateProject}>
            New Project
          </Button>
        </Box>
      </Box>
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h2">{project.name}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="secondary" onClick={() => onDeleteProject(project.id)}>
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '6px' } }}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function ProfilePage({ userAttributes, setUserAttributes, fetchUserAttributes, setVerifyUsername }) {
  const [firstName, setFirstName] = useState(userAttributes.given_name || '');
  const [lastName, setLastName] = useState(userAttributes.family_name || '');
  const [email, setEmail] = useState(userAttributes.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setFirstName(userAttributes.given_name || '');
    setLastName(userAttributes.family_name || '');
    setEmail(userAttributes.email || '');
  }, [userAttributes]);

  const validateProfileForm = () => {
    const errors = {};
    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) errors.email = 'Valid email is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords must match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setIsUpdating(true);
    const user = new CognitoUser({ Username: localStorage.getItem('username'), Pool: userPool });
    user.getSession((err) => {
      if (err) {
        setIsUpdating(false);
        alert('Session error: ' + err.message);
        return;
      }
      const attributes = [
        new CognitoUserAttribute({ Name: 'given_name', Value: firstName }),
        new CognitoUserAttribute({ Name: 'family_name', Value: lastName }),
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];
      user.updateAttributes(attributes, (err) => {
        setIsUpdating(false);
        if (err) {
          if (err.code === 'NotAuthorizedException' && err.message.includes('email')) {
            setVerifyUsername(localStorage.getItem('username'));
            navigate('/verify');
          } else {
            alert('Update failed: ' + err.message);
          }
          return;
        }
        alert('Profile updated successfully');
        fetchUserAttributes();
      });
    });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsChangingPassword(true);
    const user = new CognitoUser({ Username: localStorage.getItem('username'), Pool: userPool });
    user.getSession((err) => {
      if (err) {
        setIsChangingPassword(false);
        alert('Session error: ' + err.message);
        return;
      }
      user.changePassword(currentPassword, newPassword, (err) => {
        setIsChangingPassword(false);
        if (err) {
          alert('Password change failed: ' + err.message);
          return;
        }
        alert('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      });
    });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <CustomPaper elevation={3}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Typography variant="h1">Profile</Typography>
        </Box>
        <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
          <form onSubmit={handleUpdateProfile}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Username"
                value={localStorage.getItem('username') || ''}
                variant="outlined"
                disabled
              />
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                variant="outlined"
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                variant="outlined"
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isUpdating}
                sx={{ mt: 2, py: 1.5 }}
              >
                {isUpdating ? <CircularProgress size={24} color="inherit" /> : 'Update Profile'}
              </Button>
            </Stack>
          </form>
          <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>Change Password</Typography>
          <form onSubmit={handleChangePassword}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                error={!!formErrors.currentPassword}
                helperText={formErrors.currentPassword}
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                error={!!formErrors.newPassword}
                helperText={formErrors.newPassword}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isChangingPassword}
                sx={{ mt: 2, py: 1.5 }}
              >
                {isChangingPassword ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
              </Button>
            </Stack>
          </form>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 3 }}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </CustomPaper>
    </Container>
  );
}

export default App;