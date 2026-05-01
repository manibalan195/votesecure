require('dotenv').config();
const http = require('http');
const app  = require('./app');
const { initSocket }   = require('./config/socket');
const { startCronJobs } = require('./services/cronService');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);
startCronJobs();
app.get("/", (req, res) => {
  res.send("✅ VoteSecure Backend is Live");
});
server.listen(PORT, () => {
  console.log(`\n🗳️  MSEC Election Portal — Server running`);
  console.log(`   http://localhost:${PORT}\n`);
});
