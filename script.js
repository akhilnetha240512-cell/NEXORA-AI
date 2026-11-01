
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// 1. Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYOMVQSo93Evtl4WUYQqBFwd0HqJDVxiM",
  authDomain: "nexora-ai-f5bb3.firebaseapp.com",
  projectId: "nexora-ai-f5bb3",
  storageBucket: "nexora-ai-f5bb3.firebasestorage.app",
  messagingSenderId: "268776875790",
  appId: "1:268776875790:web:cc8b143988e9631e1a195f"
};

// 2. Initialize Firebase Authentication
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let isSignup = false;

// 3. Create login screen
const loginScreen = document.createElement("div");
loginScreen.id = "nexoraLogin";

loginScreen.innerHTML = `
  <div class="login-card">
    <div class="login-logo">✦</div>
    <h1>NEXORA <span>AI</span></h1>
    <p class="login-subtitle">Your intelligent assistant</p>

    <div id="loginMessage"></div>

    <button id="googleLogin" class="google-login">
      <span>G</span> Continue with Google
    </button>

    <div class="login-divider">OR CONTINUE WITH EMAIL</div>

    <form id="emailForm">
      <input
        id="emailInput"
        type="email"
        placeholder="Email address"
        autocomplete="email"
        required
      >

      <input
        id="passwordInput"
        type="password"
        placeholder="Password (at least 6 characters)"
        autocomplete="current-password"
        minlength="6"
        required
      >

      <button id="emailSubmit" type="submit">
        Login
      </button>
    </form>

    <button id="forgotPassword" class="text-button">
      Forgot password?
    </button>

    <p class="signup-text">
      <span id="signupLabel">Don't have an account?</span>
      <button id="toggleSignup" class="text-button">
        Create account
      </button>
    </p>
  </div>
`;

const loginStyle = document.createElement("style");

loginStyle.textContent = `
  #nexoraLogin {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    background:
      radial-gradient(circle at 50% 20%, #39206d, transparent 45%),
      #080914;
    font-family: Arial, sans-serif;
    color: white;
  }

  .login-card {
    width: 100%;
    max-width: 410px;
    padding: 32px 25px;
    text-align: center;
    border: 1px solid #9b5cff55;
    border-radius: 22px;
    background: #11152b;
    box-shadow: 0 0 45px #7944d633;
  }

  .login-logo {
    width: 65px;
    height: 65px;
    display: grid;
    place-items: center;
    margin: 0 auto 15px;
    border-radius: 20px;
    font-size: 32px;
    background: linear-gradient(135deg, #9b5cff, #268bea);
  }

  .login-card h1 {
    letter-spacing: 3px;
    font-size: 25px;
  }

  .login-card h1 span {
    color: #9b70ff;
  }

  .login-subtitle {
    color: #a5a9c4;
    margin: 10px 0 25px;
  }

  .login-card input {
    width: 100%;
    padding: 15px;
    margin: 8px 0;
    border: 1px solid #373b5d;
    border-radius: 11px;
    background: #090d20;
    color: white;
    outline: none;
  }

  .login-card input:focus {
    border-color: #9b5cff;
  }

  .login-card button {
    cursor: pointer;
  }

  .google-login,
  #emailSubmit {
    width: 100%;
    padding: 14px;
    margin: 8px 0;
    border: 0;
    border-radius: 11px;
    color: white;
    font-weight: bold;
    background: linear-gradient(110deg, #8448ed, #287de7);
  }

  .google-login {
    background: #242943;
    border: 1px solid #535779;
  }

  .google-login span {
    margin-right: 10px;
    font-size: 18px;
    font-weight: bold;
  }

  .login-divider {
    margin: 22px 0;
    color: #858ba9;
    font-size: 10px;
    letter-spacing: 2px;
  }

  .text-button {
    border: 0;
    background: transparent;
    color: #a987ff;
    padding: 8px;
  }

  .signup-text {
    margin-top: 20px;
    color: #a5a9c4;
    font-size: 13px;
  }

  #loginMessage {
    margin-bottom: 12px;
    color: #ff9dba;
    font-size: 13px;
    line-height: 1.5;
  }

  #loginMessage:empty {
    display: none;
  }

  #nexoraUserBar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    color: #dcd5ff;
    font-size: 12px;
  }

  #nexoraLogout {
    padding: 8px 12px;
    border: 1px solid #8054bb;
    border-radius: 9px;
    color: white;
    background: #292044;
  }
`;

document.head.appendChild(loginStyle);
document.body.appendChild(loginScreen);

// 4. Login helpers
const $ = id => document.getElementById(id);

function showMessage(message) {
  $("loginMessage").textContent = message;
}

function setLoginMode(signup) {
  isSignup = signup;

  $("emailSubmit").textContent =
    signup ? "Create Account" : "Login";

  $("signupLabel").textContent =
    signup ? "Already have an account?" : "Don't have an account?";

  $("toggleSignup").textContent =
    signup ? "Login" : "Create account";

  $("passwordInput").autocomplete =
    signup ? "new-password" : "current-password";

  showMessage("");
}

// 5. Switch between login and registration
$("toggleSignup").addEventListener("click", () => {
  setLoginMode(!isSignup);
});

// 6. Google login
$("googleLogin").addEventListener("click", async () => {
  showMessage("Opening Google sign-in...");

  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    showMessage(error.message);
  }
});

// 7. Email login and registration
$("emailForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;

  showMessage("Please wait...");

  try {
    if (isSignup) {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
    } else {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }
  } catch (error) {
    const messages = {
      "auth/email-already-in-use":
        "This email already has an account. Please log in.",
      "auth/invalid-email":
        "Please enter a valid email address.",
      "auth/weak-password":
        "Choose a stronger password with at least 6 characters.",
      "auth/invalid-credential":
        "Email or password is incorrect.",
      "auth/network-request-failed":
        "Check your internet connection."
    };

    showMessage(messages[error.code] || error.message);
  }
});

// 8. Password reset
$("forgotPassword").addEventListener("click", async () => {
  const email = $("emailInput").value.trim();

  if (!email) {
    showMessage("Enter your email address first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset instructions have been sent.");
  } catch (error) {
    showMessage(error.message);
  }
});

// 9. Check Google redirect result
getRedirectResult(auth).catch(error => {
  showMessage(error.message);
});

// 10. Add logout control
const userBar = document.createElement("div");
userBar.id = "nexoraUserBar";
userBar.innerHTML = `
  <span id="nexoraUserEmail"></span>
  <button id="nexoraLogout">Logout</button>
`;

document.querySelector(".topbar")?.appendChild(userBar);

$("nexoraLogout").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(error.message);
  }
});

// 11. Watch authentication state
onAuthStateChanged(auth, user => {
  const website = document.querySelector(".app");

  if (user) {
    loginScreen.style.display = "none";

    if (website) website.style.display = "";

    $("nexoraUserEmail").textContent =
      user.displayName || user.email || "Signed in";

    userBar.style.display = "flex";

    console.log("NEXORA AI: User signed in.");
  } else {
    loginScreen.style.display = "flex";

    if (website) website.style.display = "none";

    userBar.style.display = "none";
  }
});

console.log("NEXORA AI authentication initialized.");
