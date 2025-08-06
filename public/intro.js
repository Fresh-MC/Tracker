// Move the stack from bottom to middle using GSAP
window.addEventListener('DOMContentLoaded', function() {
  const stack = document.getElementById('filledStack');
  const layers = stack.querySelectorAll('.layer');
  // Set initial position at bottom and rotated
  gsap.set(stack, { y: 1200, rotateX: 50, rotateZ: 87 });

  const tl = gsap.timeline();
  // Move up
  tl.to(stack, {
    y: 0,
    duration: 2.4,
    ease: 'power3.out'
  });
  // Rotate to normal, starts 0.4s after timeline starts (overlaps with move up)
  tl.to(stack, {
    rotateX: 0,
    rotateZ: 0,
    duration: 1.2,
    ease: 'power3.out'
  }, 0.4); // Start at 0.4s into the timeline

  // After previous, rotate stack to 80deg
  tl.to(stack, {
    rotateZ: 80,
    duration: 0.8,
    ease: 'power2.inOut'
    
  });

  // Move layer 1 left, layer 3 right, fade out layer 2
  tl.to(layers[0], {
    x: -82,
    duration: 0.8,
    ease: 'power2.inOut'
  }, '<');
  tl.to(layers[2], {
    x: 82,
    duration: 0.8,
    ease: 'power2.inOut'
  }, '<');
  tl.to(layers[1], {
    opacity: 0,
    duration: 0.5,
    ease: 'power1.inOut',
    onStart: function() {
      gsap.to('#stackText', { opacity: 1, duration: 1, ease: 'power1.in' });
    }
  }, '<');

  // After 2s delay, move layer 1 and 3 diagonally opposite and show/expand box
  tl.to([layers[0], layers[2]], {
    x: (i) => i === 0 ? '-=300' : '+=300',
    y: (i) => i === 0 ? '-=300' : '+=300',
    duration: 1.2,
    ease: 'power2.inOut',
    delay: 2,
    onStart: function() {
      gsap.to('#expandBox', {
        opacity: 1,
        width: 200,
        height: 120,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: function() {
          gsap.to('#expandBox', {
            width: 560,
            height: 780,
            duration: 0.8,
            ease: 'power2.out'
          });
        }
      });
    }
  });
});

// Tab switching logic
const showLoginBtn = document.getElementById('showLogin');
const showSignupBtn = document.getElementById('showSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (showLoginBtn && showSignupBtn && loginForm && signupForm) {
  showLoginBtn.addEventListener('click', () => {
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    loginForm.style.display = '';
    signupForm.style.display = 'none';
  });
  showSignupBtn.addEventListener('click', () => {
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    signupForm.style.display = '';
  });
}

// Email validation helper
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Login logic
// In intro.js, replace the existing loginForm event listener with this:
// In intro.js
// In intro.js

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!isValidEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', 
 {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Check if the server responded with a success code
      if (res.ok) {
        
        // **THIS IS THE KEY FIX**
        // We must check that the 'user' object exists in the response
        if (data && data.user) {
          // If it exists, save the token and the user data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Then redirect to the dashboard
          window.location.href = "http://localhost:5173/dashboard";
        } else {
          // Handle the rare case where login is ok but data is missing
          alert('Login successful, but user data was not received.');
          console.error('Server response OK but missing user data:', data);
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error("An error occurred during login:", error);
      alert("An error occurred. Please check the console.");
    }
  });
}
// Sign Up logic
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const role = document.getElementById('signupRole').value;
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (password !== confirm) return alert('Passwords do not match');
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
   // In intro.js

// ... inside signupForm event listener
  if (res.ok) {
    alert('Registered successfully! Please log in.');
    
    // Switch to the login form
    document.getElementById('showLogin').click();

  } else {
// ...{
      alert(data.message || 'Registration failed');
    }
  });
}
