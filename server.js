const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 3000;
const saltRounds = 10;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session setup
app.use(session({
  secret: 'your_secret_key', // Use a secure, unique secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB setup
const mongoURL = 'mongodb+srv://Group10DB:WeAreGroupTen10@group10cluster.df8uelv.mongodb.net/';
const client = new MongoClient(mongoURL);

// Homepage route
app.get('/', (req, res) => {
  // Check if the user is logged in
  if (req.session.user) {
    res.render('homepage', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    // Set a session variable to indicate the user is logged in
    req.session.user = username;
    res.redirect('/');
  } else {
    res.send('Invalid credentials');
  }

  await client.close();
});

app.get('/settings', (req, res) => {
  if (req.session.user) {
    res.render('settings', { user: req.session.user });
  } else {
    res.redirect('/login'); // Redirect to login if not logged in
  }
});

app.get('/create', (req, res) => {
  res.render('create.ejs');
});

app.post('/signup', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;  // Get the password from request
  const firstname = req.body.firstname;
  const surname = req.body.surname;
  const email = req.body.email;

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const existingUser = await usersCollection.findOne({ username });
  const existingEmail = await usersCollection.findOne({ email });

  if (existingUser) {
    res.send('Username already taken. Please choose another username.');
  } else if (existingEmail) {
    res.send('Email already exists. Please log in.');
  } else {
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = { username, password: hashedPassword, firstname, surname, email };
    await usersCollection.insertOne(newUser);
    res.send('Sign-up successful! You can now <a href="/login">log in</a>.');
  }

  await client.close();
});
app.post('/updateUser', async (req, res) => {
  const { username, newFirstname, newSurname, newEmail } = req.body;

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const updatedUser = await usersCollection.updateOne(
    { username: username },
    { $set: { firstname: newFirstname, surname: newSurname, email: newEmail } }
  );

  const session = require('express-session');

app.use(session({
  secret: 'your_secret_key', // Use a secure, unique secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

  if(updatedUser.modifiedCount > 0) {
    res.send('User updated successfully.');
  } else {
    res.send('No updates made to the user.');
  }

  await client.close();
});
app.post('/deleteUser', async (req, res) => {
  const { username } = req.body;

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const deletedUser = await usersCollection.deleteOne({ username: username });

  if(deletedUser.deletedCount > 0) {
    res.send('User deleted successfully.');
  } else {
    res.send('No user found with the provided username.');
  }

  await client.close();
});
app.post('/updateEmail', async (req, res) => {
  const { username, newEmail } = req.body;

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const updatedEmail = await usersCollection.updateOne(
    { username: username },
    { $set: { email: newEmail } }
  );

  if(updatedEmail.modifiedCount > 0) {
    res.send('Email updated successfully.');
  } else {
    res.send('No updates made to the email.');
  }

  await client.close();
});
app.post('/updatePassword', async (req, res) => {
  const { username, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await client.connect();
  const db = client.db('MoviesRating');
  const usersCollection = db.collection('users');

  const updatedPassword = await usersCollection.updateOne(
    { username: username },
    { $set: { password: hashedPassword } }
  );

  if(updatedPassword.modifiedCount > 0) {
    res.send('Password updated successfully.');
  } else {
    res.send('No updates made to the password.');
  }

  await client.close();
});


app.use(express.static('public'));
app.post('/updateEmail', async (req, res) => {
  // Your code to update email
});
app.post('/updatePassword', async (req, res) => {
  // Your code to update password
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);

});
