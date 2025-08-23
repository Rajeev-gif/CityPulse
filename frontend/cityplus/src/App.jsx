import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Modal,
  TextField,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Map as MapIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import LiveMap from "./components/LiveMap";
import OfficialsDashboard from "./components/OfficialsDashboard";
import "./index.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState("citizen");
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Hardcoded admin emails (for demo purposes)
  const adminEmails = [
    "admin@citypulse.com",
    "official@citypulse.com",
    "rajeevtiktok01@gmail.com",
  ];

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && adminEmails.includes(user.email)) {
        setUser(user);
        console.log("User logged in:", user.email);
      } else {
        setUser(null);
        console.log("User logged out or not authorized");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setTabValue(0);
  };

  const handleClose = () => {
    setOpen(false);
    setLoginError("");
    setSignupError("");
    setSignupSuccess("");
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLoginError("");
    setSignupError("");
    setSignupSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password
      );

      if (adminEmails.includes(userCredential.user.email)) {
        setUser(userCredential.user);
        handleClose();
        setCurrentView("officials");
      } else {
        setLoginError("Access restricted to authorized officials only");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-email") {
        setLoginError("Invalid email address");
      } else if (error.code === "auth/user-disabled") {
        setLoginError("User account has been disabled");
      } else if (error.code === "auth/user-not-found") {
        setLoginError("No user found with this email");
      } else if (error.code === "auth/wrong-password") {
        setLoginError("Incorrect password");
      } else {
        setLoginError("Failed to sign in. Please try again.");
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    // Basic validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (signupForm.password.length < 6) {
      setSignupError("Password should be at least 6 characters");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupForm.email,
        signupForm.password
      );

      setSignupSuccess("Account created successfully! You can now log in.");
      setSignupForm({
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Switch to login tab
      setTabValue(0);

      console.log("User created:", userCredential.user);
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        setSignupError("This email is already registered");
      } else if (error.code === "auth/invalid-email") {
        setSignupError("Invalid email address");
      } else if (error.code === "auth/operation-not-allowed") {
        setSignupError("Email/password accounts are not enabled");
      } else {
        setSignupError("Failed to create account. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView("citizen");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Add this useEffect hook to your main App component
  useEffect(() => {
    // Prevent elastic scroll on iOS
    document.body.style.overscrollBehavior = "none";

    // Prevent zoom on input focus
    const preventZoom = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        document.body.style.zoom = "100%";
      }
    };

    window.addEventListener("focus", preventZoom, true);

    // Cleanup
    return () => {
      window.removeEventListener("focus", preventZoom, true);
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <MapIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Box component="span" sx={{ color: "lightblue" }}>
              City
            </Box>
            Pulse
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            {user ? (
              <>
                <Button
                  color="inherit"
                  startIcon={<HomeIcon />}
                  onClick={() => setCurrentView("citizen")}
                  variant={currentView === "citizen" ? "outlined" : "text"}
                >
                  Citizen View
                </Button>
                <Button
                  color="inherit"
                  startIcon={<PeopleIcon />}
                  onClick={() => setCurrentView("officials")}
                  variant={currentView === "officials" ? "outlined" : "text"}
                >
                  Officials Dashboard
                </Button>
                <Button
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  variant="outlined"
                >
                  Logout ({user.email})
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  startIcon={<HomeIcon />}
                  onClick={() => setCurrentView("citizen")}
                  variant={currentView === "citizen" ? "outlined" : "text"}
                >
                  Citizen View
                </Button>
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={handleOpen}
                  variant="outlined"
                >
                  Official Login
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Alert notifications */}
      {alerts.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            top: 80,
            right: 20,
            zIndex: 2000,
            maxWidth: 400,
          }}
        >
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() =>
                    setAlerts(alerts.filter((a) => a.id !== alert.id))
                  }
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <AlertTitle>{alert.title}</AlertTitle>
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {currentView === "citizen" ? (
        <LiveMap alerts={alerts} setAlerts={setAlerts} />
      ) : user ? (
        <OfficialsDashboard />
      ) : (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
            Please log in to access the officials dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleOpen}
            size="large"
          >
            Official Login
          </Button>
        </Box>
      )}

      {/* Auth Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="auth-modal-title"
      >
        <Box sx={style}>
          <Typography
            id="auth-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Official Authentication
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="auth tabs"
            >
              <Tab
                label="Login"
                id="auth-tab-0"
                aria-controls="auth-tabpanel-0"
              />
              <Tab
                label="Create Account"
                id="auth-tab-1"
                aria-controls="auth-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Login Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                placeholder="admin@citypulse.com"
                margin="normal"
                autoComplete="email"
              />

              <TextField
                fullWidth
                required
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="Enter your password"
                margin="normal"
                autoComplete="current-password"
              />

              {loginError && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {loginError}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                Login
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: "center" }}
              >
                Demo credentials: admin@citypulse.com / password123
              </Typography>
            </Box>
          </TabPanel>

          {/* Signup Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleSignup} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, email: e.target.value })
                }
                placeholder="admin@citypulse.com"
                margin="normal"
                autoComplete="email"
              />

              <TextField
                fullWidth
                required
                label="Password"
                type="password"
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, password: e.target.value })
                }
                placeholder="Enter a password (min 6 characters)"
                margin="normal"
                autoComplete="new-password"
              />

              <TextField
                fullWidth
                required
                label="Confirm Password"
                type="password"
                value={signupForm.confirmPassword}
                onChange={(e) =>
                  setSignupForm({
                    ...signupForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm your password"
                margin="normal"
                autoComplete="new-password"
              />

              {signupError && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {signupError}
                </Alert>
              )}

              {signupSuccess && (
                <Alert severity="success" sx={{ my: 2 }}>
                  {signupSuccess}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<PersonAddIcon />}
              >
                Create Account
              </Button>

              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 2, textAlign: "center" }}
              >
                Note: Only authorized officials should create accounts
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Modal>
    </Box>
  );
}

export default App;
