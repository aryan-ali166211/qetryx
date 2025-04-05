// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Auth state listener
  auth.onAuthStateChanged(user => {
    const authLink = document.getElementById('auth-link');
    
    if (user) {
      // User is logged in
      authLink.textContent = 'Dashboard';
      authLink.href = 'dashboard.html';
      
      // Show protected content if on dashboard
      if (window.location.pathname.includes('dashboard.html')) {
        document.getElementById('protected-content').style.display = 'block';
      }
    } else {
      // User is logged out
      authLink.textContent = 'Login';
      authLink.href = 'login.html';
      
      // Hide protected content
      if (window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
      }
    }
  });
  
  // Login with Email/Password
  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }
  
  // Signup with Email/Password
  function signup(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
  }
  
  // Google Sign-In
  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }
  
  // Logout
  function logout() {
    return auth.signOut();
  }