const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');

const app = express();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://votesecure-dfvaz9635-manibalan195s-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / server calls

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/elections',  require('./routes/electionRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/votes',      require('./routes/voteRoutes'));
app.use('/api/voters',     require('./routes/voterRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', college: process.env.COLLEGE_NAME, time: new Date() })
);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

module.exports = app;