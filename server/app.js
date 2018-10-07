const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config/database');

//NEVER FORGET TO CHANGE DEV TO PROD
mongoose.Promise = require('bluebird');
var options = {
  useMongoClient: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30
};
mongoose.connect(config.database, options);

// On Connection
mongoose.connection.on('connected', () => {
  console.log('This database ish is running hella good at '+config.database);
});

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err);
});


const app = express();

const iosRoutes = require('./routes/ios');
// const desktopRoutes = require('./routes/desktop');
// const appRoutes = require('./routes/adminRoutes');
// const employeeRoutes = require('./routes/employeeRoutes');

// Port Number
const port = process.env.PORT || 3000;

// CORS Middleware
app.use(cors());

// Set Static Folder
// app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.json());

app.use(cookieParser());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

app.use('/api/i', iosRoutes);
// app.use('/api/d', desktopRoutes);
// app.use('/apptree', appRoutes);
// app.use('/employee', employeeRoutes);

// Index Route
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/index.html'));
// });
//
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/index.html'));
// });

// Start Server
app.listen(port, () => {
  console.log('Server started on port '+port);
});
