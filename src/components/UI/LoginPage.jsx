import React, { useState, useEffect } from 'react';
import { useCarStore } from '../../store';
import { Mail, Lock, User, Eye, EyeOff, X, ShieldAlert, CheckCircle2, Loader2, Phone } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://tune-x-henna.vercel.app';
const GOOGLE_REDIRECT_URI = `${FRONTEND_URL}/google-callback.html`;

export default function LoginPage() {
  const showLoginModal = useCarStore(state => state.showLoginModal);
  const setShowLoginModal = useCarStore(state => state.setShowLoginModal);
  const setUser = useCarStore(state => state.setUser);
  const user = useCarStore(state => state.user);

  const [view, setView] = useState('auth'); // 'auth' | 'profile_completion'
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Credentials Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile Completion states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileGender, setProfileGender] = useState('Male');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Clear errors when switching tabs
  useEffect(() => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  }, [activeTab]);

  // Prefill profile name from active login info
  useEffect(() => {
    if (view === 'profile_completion' && user) {
      setProfileName(user.name || '');
    }
  }, [view, user]);

  // Listen for Google login message from popup window
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_CODE') {
        const { code, error: authError } = event.data;
        if (authError) {
          setError(authError);
          return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Google login failed');
          }

          setUser(data);

          if (data.profileCompleted === false) {
            setSuccess('Google verified. Initializing profile...');
            setTimeout(() => {
              setView('profile_completion');
              setSuccess('');
            }, 1000);
          } else {
            setSuccess('Access Granted. Google profile loaded.');
            setTimeout(() => {
              setShowLoginModal(false);
            }, 1200);
          }
        } catch (err) {
          console.error(err);
          setError(err.message || 'Google Auth Connection failed');
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setUser, setShowLoginModal]);

  if (!showLoginModal) return null;

  // Local signup/login submission
  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Input Validation
    if (!email || !password) {
      setError('All fields are required.');
      return;
    }
    
    if (activeTab === 'register') {
      if (!name) {
        setError('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload = activeTab === 'login' 
        ? { email, password } 
        : { email, password, name };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data);
      setSuccess(activeTab === 'login' ? 'Access Granted. Welcome back.' : 'Account created. Welcome to TuneX.');
      
      if (data.profileCompleted === false) {
        setTimeout(() => {
          setView('profile_completion');
          setSuccess('');
        }, 1000);
      } else {
        setTimeout(() => {
          setShowLoginModal(false);
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Profile completion form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profileName.trim()) {
      setError('Driver name is required.');
      return;
    }
    if (!profilePhone.trim()) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || email,
          name: profileName,
          phone: profilePhone,
          gender: profileGender
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Profile update failed.');
      }

      setUser(data);
      setSuccess('Profile secured. Welcome to the workspace.');
      setTimeout(() => {
        setShowLoginModal(false);
        setView('auth'); // reset view state
      }, 1200);
    } catch (err) {
      setError(err.message || 'Profile connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.');
      return;
    }

    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('include_granted_scopes', 'true');

    const popup = window.open(
      authUrl.toString(),
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=no,scrollbars=yes`
    );

    if (!popup) {
      setError('Popup blocker active. Please allow popups for Google sign-in.');
      return;
    }
  };

  return (`}
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sign in - Google Accounts</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #202124;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .card {
            border: 1px solid #dadce0;
            border-radius: 8px;
            padding: 36px 40px;
            width: 380px;
            box-sizing: border-box;
            text-align: center;
          }
          .logo {
            height: 28px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 22px;
            font-weight: 400;
            margin: 0 0 8px 0;
            color: #202124;
          }
          p {
            font-size: 15px;
            color: #5f6368;
            margin: 0 0 24px 0;
          }
          .account-list {
            margin: 0;
            padding: 0;
            list-style: none;
            text-align: left;
            border-top: 1px solid #dadce0;
          }
          .account-item {
            display: flex;
            align-items: center;
            padding: 12px 10px;
            border-bottom: 1px solid #dadce0;
            cursor: pointer;
            border-radius: 4px;
            margin: 2px 0;
            transition: background 0.2s;
          }
          .account-item:hover {
            background: #f8f9fa;
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #e8f0fe;
            color: #1a73e8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 14px;
            margin-right: 12px;
            overflow: hidden;
          }
          .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .details {
            display: flex;
            flex-direction: column;
          }
          .name {
            font-size: 14px;
            font-weight: 500;
            color: #3c4043;
          }
          .email {
            font-size: 12px;
            color: #5f6368;
          }
          .input-custom {
            margin-top: 18px;
            display: flex;
            flex-direction: column;
            text-align: left;
            border-top: 1px solid #eee;
            padding-top: 16px;
          }
          .input-custom label {
            font-size: 12px;
            font-weight: 500;
            color: #1a73e8;
            margin-bottom: 6px;
          }
          .input-custom input {
            padding: 8px 12px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 13px;
            outline: none;
            margin-bottom: 8px;
          }
          .input-custom input:focus {
            border-color: #1a73e8;
          }
          .btn-custom {
            background: #1a73e8;
            color: #fff;
            border: none;
            padding: 10px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            margin-top: 4px;
          }
          .btn-custom:hover {
            background: #1557b0;
          }
          .footer {
            font-size: 11px;
            color: #5f6368;
            margin-top: 24px;
            text-align: left;
            line-height: 1.5;
          }
          .footer a {
            color: #1a73e8;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <!-- Google logo -->
          <svg class="logo" viewBox="0 0 74 24" width="74" height="28" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.25 15.35c-2.45 0-4.48-1.92-4.48-4.47s2.03-4.47 4.48-4.47c1.23 0 2.27.48 3.08 1.25l-1.25 1.25c-.53-.51-1.18-.81-1.83-.81-1.63 0-2.92 1.34-2.92 2.78s1.29 2.78 2.92 2.78c.84 0 1.48-.38 1.95-.87.49-.49.78-1.16.88-2.02H7.25v-1.7h4.33c.04.22.07.48.07.75 0 1.15-.31 2.38-1.29 3.37-.96 1.01-2.18 1.51-3.61 1.51zm11.58-1.56c0 2.45-1.93 4.31-4.3 4.31s-4.3-1.86-4.3-4.31c0-2.47 1.93-4.31 4.3-4.31s4.3 1.84 4.3 4.31zm-1.8 0c0-1.61-1.16-2.69-2.5-2.69s-2.5 1.08-2.5 2.69c0 1.58 1.16 2.69 2.5 2.69s2.5-1.11 2.5-2.69zm10.22 0c0 2.45-1.93 4.31-4.3 4.31s-4.3-1.86-4.3-4.31c0-2.47 1.93-4.31 4.3-4.31s4.3 1.84 4.3 4.31zm-1.8 0c0-1.61-1.16-2.69-2.5-2.69s-2.5 1.08-2.5 2.69c0 1.58 1.16 2.69 2.5 2.69s2.5-1.11 2.5-2.69zm9.99 4.19c0 2.87-1.68 4.05-3.87 4.05-2.14 0-3.41-1.42-3.89-2.57l1.57-.65c.28.67.97 1.47 2.32 1.47 1.44 0 2.33-.89 2.33-2.57v-.63h-.06c-.44.54-1.28 1.01-2.34 1.01-2.22 0-4.24-1.92-4.24-4.47s2.02-4.49 4.24-4.49c1.06 0 1.9.47 2.34 1.01h.06v-.84h1.72v6.68zm-1.65-4.16c0-1.57-1.07-2.72-2.38-2.72-1.34 0-2.46 1.15-2.46 2.72s1.12 2.69 2.46 2.69c1.31 0 2.38-1.12 2.38-2.69zm5.55 4.04V3.12h1.77v14.65H41.1zm7.95-6.53c.96 0 1.7 1.03 1.7 2.44h-5.22c.1.98.88 1.62 1.82 1.62.8 0 1.41-.39 1.7-1.01l1.55.65c-.46 1.01-1.53 2.11-3.25 2.11-2.27 0-3.95-1.81-3.95-4.31 0-2.51 1.68-4.31 3.73-4.31s3.64 1.8 3.64 4.31c0 .26-.03.52-.07.7h-5.6zm-1.78-1.56c-.84 0-1.44.57-1.59 1.34h3.11c-.04-.77-.61-1.34-1.52-1.34z" fill="#757575"/>
          </svg>
          <h1>Choose an account</h1>
          <p>to continue to <b>TuneX AI Tuning</b></p>
          
          <ul class="account-list">
            <li class="account-item" onclick="selectAccount('Sebastian Vettel', 'vettel.f1@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop')">
              <div class="avatar"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop" /></div>
              <div class="details">
                <span class="name">Sebastian Vettel</span>
                <span class="email">vettel.f1@gmail.com</span>
              </div>
            </li>
            <li class="account-item" onclick="selectAccount('Lewis Hamilton', 'lewis44@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop')">
              <div class="avatar"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop" /></div>
              <div class="details">
                <span class="name">Lewis Hamilton</span>
                <span class="email">lewis44@gmail.com</span>
              </div>
            </li>
            <li class="account-item" onclick="selectAccount('Ayrton Senna', 'senna.legend@gmail.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop')">
              <div class="avatar"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop" /></div>
              <div class="details">
                <span class="name">Ayrton Senna</span>
                <span class="email">senna.legend@gmail.com</span>
              </div>
            </li>
          </ul>

          <div class="input-custom">
            <label>Use another email address</label>
            <input type="email" id="customEmail" placeholder="Enter your email..." required />
            <input type="text" id="customName" placeholder="Enter your name..." />
            <button class="btn-custom" onclick="submitCustomAccount()">Continue</button>
          </div>

          <div class="footer">
            To continue, Google will share your name, email address, language preference, and profile picture with TuneX. See their <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a>.
          </div>
        </div>

        <script>
          function selectAccount(name, email, avatar) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              profile: {
                email: email,
                name: name,
                avatar: avatar,
                googleId: 'google_' + Math.random().toString(36).substr(2, 9)
              }
            }, '*');
            window.close();
          }

          function submitCustomAccount() {
            var email = document.getElementById('customEmail').value;
            var name = document.getElementById('customName').value || email.split('@')[0];
            if (!email || !email.includes('@')) {
              alert('Please enter a valid email address.');
              return;
            }
            selectAccount(name, email, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop');
          }
        </script>
      </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(popupHtml);
    popup.document.close();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4 animate-in fade-in duration-300">
      
      {/* Glow ambient background behind the card */}
      <div className="absolute w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-[420px] p-8 md:p-10 bg-black/65 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col group overflow-hidden">
        
        {/* Glow corner line */}
        <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute top-0 left-0 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
        
        {/* Close button (only shown if not in mandatory profile completion) */}
        {view !== 'profile_completion' && (
          <button 
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 p-2 rounded-full transition-all duration-300 z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gold-500 font-bold mb-1 drop-shadow-md">T U N E X</span>
          <h2 className="text-xl font-light tracking-[0.2em] text-white uppercase">
            {view === 'profile_completion' ? 'Driver Profile' : 'Authentication'}
          </h2>
          <div className="w-12 h-px bg-white/20 mt-3" />
        </div>

        {/* Action Feedbacks */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 animate-in slide-in-from-top-2 duration-300">
            <ShieldAlert className="text-red-500 shrink-0 mt-[2px]" size={16} />
            <p className="text-xs text-red-200/90 leading-relaxed font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 animate-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="text-green-500 shrink-0 mt-[2px]" size={16} />
            <p className="text-xs text-green-200/90 leading-relaxed font-light">{success}</p>
          </div>
        )}

        {/* DYNAMIC SCREEN ROUTING */}
        {view === 'auth' ? (
          <>
            {/* Tab switchers */}
            <div className="flex bg-white/5 p-1 border border-white/5 rounded-lg mb-8 relative">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase rounded-md transition-all duration-300 relative z-10 ${
                  activeTab === 'login' ? 'text-black font-bold' : 'text-white/50 hover:text-white/80'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase rounded-md transition-all duration-300 relative z-10 ${
                  activeTab === 'register' ? 'text-black font-bold' : 'text-white/50 hover:text-white/80'
                }`}
              >
                Create Account
              </button>

              {/* Animated Tab highlight */}
              <div 
                className="absolute top-1 bottom-1 bg-white rounded-md transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ 
                  left: activeTab === 'login' ? '4px' : 'calc(50% + 2px)', 
                  width: 'calc(50% - 6px)' 
                }} 
              />
            </div>

            {/* Email/Password Sign-In & Registration Form */}
            <form onSubmit={handleLocalSubmit} className="flex flex-col gap-5">
              
              {/* Full name input (only for registration) */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Driver Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Sebastian Vettel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email input */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Email Terminal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    placeholder="driver@tunex.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Passkey</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-12 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password input (only for registration) */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Confirm Passkey</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Options: Remember me */}
              {activeTab === 'login' && (
                <div className="flex items-center justify-between mt-1 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-gold-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 transition-colors accent-gold-500"
                    />
                    <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-wider font-semibold">Remember Session</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); setError('Simulation: Please re-register or use Vettel account.'); }} className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider font-semibold">Lost Passkey?</a>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-white text-black font-bold tracking-widest uppercase text-xs py-4 rounded-xl hover:bg-gold-500 hover:text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  activeTab === 'login' ? 'Establish Access' : 'Create Credentials'
                )}
              </button>

            </form>

            {/* Separator */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google sign in button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        ) : (
          /* Profile Completion Screen */
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 animate-in slide-in-from-right duration-350">
            <p className="text-[11px] text-white/50 tracking-wider font-light leading-relaxed mb-2 uppercase text-center">
              Configure pilot credentials for telemetry tracking
            </p>

            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Driver Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Lewis Hamilton"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Phone size={15} />
                </div>
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold ml-1">Gender Segment</label>
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female', 'Other', 'Prefer Not to Say'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setProfileGender(g)}
                    className={`py-3 text-[10px] uppercase font-bold tracking-wider rounded-xl border transition-all duration-300 ${
                      profileGender === g 
                        ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] font-extrabold'
                        : 'border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:border-white/25'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Profile */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-white text-black font-bold tracking-widest uppercase text-xs py-4 rounded-xl hover:bg-gold-500 hover:text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                'Secure Pilot Log'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
