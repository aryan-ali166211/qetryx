// auth.js - Supabase Authentication Helper File

// Initialize Supabase
const supabaseUrl = 'https://taitgdhpomjkolaqvkxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXRnZGhwb21qa29sYXF2a3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTI2OTksImV4cCI6MjA2MDAyODY5OX0.oMf2P5UnNzANPRLr17PfEsuKC1b4GGO5CK0XMjyrYUQ';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ======================
// 1. Authentication Functions
// ======================

// Sign up new users
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  
  if (error) {
    console.error('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data.user };
}

// Sign in existing users
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) {
    console.error('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data.user };
}

// Sign out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error.message);
    return false;
  }
  
  return true;
}

// ======================
// 2. User State Management
// ======================

// Check current auth state
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Get user error:', error.message);
    return null;
  }
  
  return user;
}

// Listen for auth state changes
function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null);
  });
}

// ======================
// 3. Helper Functions
// ======================

// Check if user is logged in
async function isLoggedIn() {
  const user = await getCurrentUser();
  return user !== null;
}

// Get user ID
async function getUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

// ======================
// 4. Initialize Auth System
// ======================

// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  console.log('Initial auth state:', user ? 'Logged in' : 'Not logged in');
  
  // Update UI based on auth state
  updateAuthUI(user);
});

// Update UI elements based on auth state
function updateAuthUI(user) {
  const loginElements = document.querySelectorAll('.show-when-logged-out');
  const logoutElements = document.querySelectorAll('.show-when-logged-in');
  
  if (user) {
    // User is logged in
    loginElements.forEach(el => el.style.display = 'none');
    logoutElements.forEach(el => el.style.display = 'block');
    
    // Show user email if element exists
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = user.email;
      el.style.display = 'inline';
    });
  } else {
    // User is logged out
    loginElements.forEach(el => el.style.display = 'block');
    logoutElements.forEach(el => el.style.display = 'none');
  }
}

// ======================
// 5. Export Functions
// ======================

// Make functions available globally (or use module exports if using ES modules)
window.auth = {
  supabase,       // The Supabase client instance
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  isLoggedIn,
  getUserId
};