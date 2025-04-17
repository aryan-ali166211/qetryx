  // Initialize Supabase client once for the entire application
  const supabase = window.supabase.createClient(
    'https://ogwufpqcthruhgpqseff.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd3VmcHFjdGhydWhncHFzZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTEzMDksImV4cCI6MjA2MDI4NzMwOX0.OrY_gSIIHmkylk76Jo6-89GIzRvTDhLHKzdPo6lgbSo'
  );

  // Function to check auth state
  async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      window.location.href = 'userlogin.html';
      return null;
    }

    return session;
  }

  // Function to handle logout
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = 'userlogin.html';
    }
  }

  // Make these available globally
  window.supabase = supabase;
  window.checkAuth = checkAuth;
  window.logout = logout;


  // Auth configuration
  const ALLOWED_EMAILS = [
    'qetryx@gamemodhub.com',
    'mujtabaali.i@gamemodhub.com'
  ];
  const REQUIRED_PASSWORD = 'gamemodhub@123';

  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');

  // Handle login form submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    // Show loading state
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
        Authenticating...
      `;

    try {
      // Validate credentials
      if (!ALLOWED_EMAILS.includes(email)) {
        throw new Error('Invalid email address');
      }

      if (password !== REQUIRED_PASSWORD) {
        throw new Error('Invalid password');
      }

      // If using Supabase auth (recommended for production):
      // const { error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password
      // });
      // if (error) throw error;

      // For demo purposes - simulate successful login
      showLoginMessage('Login successful! Redirecting...', 'success');

      // Store login state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);

      // Redirect to admin dashboard after 1.5 seconds
      setTimeout(() => {
        window.location.href = 'admin.html'; // Create this page for admin functions
      }, 1500);

    } catch (error) {
      showLoginMessage(error.message, 'error');
      console.error('Login error:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Show login status message
  function showLoginMessage(message, type = 'error') {
    loginMessage.classList.remove('hidden');
    loginMessage.className = `mt-4 p-3 rounded-md ${type === 'success'
        ? 'bg-green-900/80 text-green-300 border border-green-700'
        : 'bg-red-900/80 text-red-300 border border-red-700'
      }`;
    loginMessage.textContent = message;

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        loginMessage.classList.add('hidden');
      }, 5000);
    }
  }

  // Check auth state on page load
  function checkAuthState() {
    if (window.location.pathname.includes('login.html')) return;

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      window.location.href = 'login.html';
    }
  }

  // Initialize auth check
  document.addEventListener('DOMContentLoaded', checkAuthState);