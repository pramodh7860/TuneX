require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tunex';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tune-x-snowy.vercel.app';

// CORS — allow frontend origin
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'TuneX Backend Active', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// AI Tuning Endpoint
app.post('/api/ai-tune', async (req, res) => {
  try {
    const { goal, systemPrompt } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: goal }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (response.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'API quota exceeded. Please wait and try again.' });
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', response.status, errBody);
      return res.status(response.status).json({ error: `Gemini API returned ${response.status}` });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json(JSON.parse(rawText));
  } catch (error) {
    console.error('AI Tune Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// USER DATABASE SCHEMA & MODEL
// ==========================================

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Optional for Google OAuth users
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    trim: true,
    default: ''
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  savedCarConfig: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true,
  toObject: { flattenMaps: true },
  toJSON: { flattenMaps: true }
});

// Pre-save hook to hash password securely
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// ==========================================
// USER AUTHENTICATION & PROFILE APIS
// ==========================================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const newUser = new User({
      email: email.toLowerCase(),
      password,
      name,
      provider: 'local'
    });

    await newUser.save();

    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.provider !== 'local') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google sign-in/up endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        name,
        avatar,
        provider: 'google',
        profileCompleted: false
      });
    } else {
      user.provider = 'google';
      if (avatar) user.avatar = avatar;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile update (Name, Phone, Gender) endpoint
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, name, phone, gender } = req.body;
    if (!email || !name || !phone || !gender) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = name;
    user.phone = phone;
    user.gender = gender;
    user.profileCompleted = true;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Car Tuning Configuration endpoint
app.post('/api/auth/save-car', async (req, res) => {
  try {
    const { email, config } = req.body;
    if (!email || !config) {
      return res.status(400).json({ error: 'Email and configuration details are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.savedCarConfig = config;
    user.markModified('savedCarConfig');
    await user.save();

    res.json({ success: true, message: 'Configuration secured to your garage.' });
  } catch (error) {
    console.error('Save configuration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`TuneX Backend running on port ${PORT}`);
});

