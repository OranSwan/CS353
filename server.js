const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 3000;
const saltRounds = 10;
const movieDetails = new mongoose.Schema({
  title: String,
});
const Movie = mongoose.model('Movie', movieDetails);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session setup
app.use(session({
  secret: 'your_secret_key', // Replace with a real secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB setup
const mongoURL = 'mongodb+srv://Group10DB:WeAreGroupTen10@group10cluster.df8uelv.mongodb.net/'; // Replace with your MongoDB connection string
const client = new MongoClient(mongoURL);

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/homepage', (req, res) => {
  // Render the homepage or redirect as needed
  res.render('homepage');
});


app.get('/settings', (req, res) => {
  if (req.session.user) {
    res.render('settings', { user: req.session.user });
  } else {
    res.redirect('/settings');
  }
});

app.get('/review', (req, res) => {
  // Render the review page
  res.render('review');
});

app.get('/index', (req, res) => {
  // Render the index page
  res.render('index');
});

app.get('/search', (req, res) => {
  res.render('search');
});

app.get('/create', function(req, res) {
  res.render('create');
});


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      res.send('An error occurred.');
    } else {
      res.redirect('/login');
    }
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db('MoviesRating');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      // Store additional user details in the session
      req.session.user = {
        username: user.username,
        email: user.email,
        firstName: user.firstname, // Assuming the field is 'firstname' in your MongoDB
        lastName: user.surname     // Assuming the field is 'surname' in your MongoDB
      };
      res.redirect('/homepage');
    } else {
      res.send('Invalid username or password.');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.send('An error occurred.');
  } finally {
    await client.close();
  }
});



app.post('/signup', async (req, res) => {
  const { username, password, firstname, surname, email } = req.body;

  try {
    await client.connect();
    const db = client.db('MoviesRating');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username });
    const existingEmail = await usersCollection.findOne({ email });

    if (existingUser || existingEmail) {
      res.send('Username or email already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = { username, password: hashedPassword, firstname, surname, email };
      await usersCollection.insertOne(newUser);
      res.send('Sign-up successful! You can now log in.');
    }
  } catch (error) {
    console.error('Error during sign up:', error);
    res.send('An error occurred.');
  } finally {
    await client.close();
  }

});
app.post('/updateUser', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    await client.connect();
    const db = client.db('MoviesRating');
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { username: req.session.user.username },
      { $set: { firstname: firstName, surname: lastName, email: email } }
    );

    // Update session data to reflect changes
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;
    req.session.user.email = email;

    // Redirect to the login page after updating the profile
    res.redirect('/login');
  } catch (error) {
    console.error('Error during user update:', error);
    res.send('An error occurred during the update.');
  } finally {
    await client.close();
  }
});



app.post('/deleteAccount', async (req, res) => {
  const { confirmPassword } = req.body;
  const username = req.session.user.username;

  try {
      await client.connect();
      const db = client.db('MoviesRating');
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ username });
      if (!user) {
          res.send('User not found.');
          return;
      }

      // Verify password
      const match = await bcrypt.compare(confirmPassword, user.password);
      if (!match) {
          res.send('Password is incorrect.');
          return;
      }

      // Delete user account
      await usersCollection.deleteOne({ username: username });

      // Destroy user session and redirect to login or home page
      req.session.destroy(() => {
          res.redirect('/login');
      });
  } catch (error) {
      console.error('Error during account deletion:', error);
      res.send('An error occurred during account deletion.');
  } finally {
      await client.close();
  }
});


app.post('/updatePassword', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.session.user.username;

  try {
    await client.connect();
    const db = client.db('MoviesRating');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (!user) {
      res.send('User not found.');
      return;
    }

    // Verify old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      res.send('Old password is incorrect.');
      return;
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await usersCollection.updateOne(
      { username: username },
      { $set: { password: hashedPassword } }
    );

    // Redirect to the homepage after updating the password
    res.redirect('/homepage');
  } catch (error) {
    console.error('Error during password update:', error);
    res.send('An error occurred during the password update.');
  } finally {
    await client.close();
  }
});

// Add this route handler to your existing server.js file
// Add this route handler to fetch reviews and render the review page
app.post('/submitReview', async (req, res) => {
  const { movieName, userName, reviewScore, reviewText } = req.body;

  try {
      await client.connect();
      const db = client.db('MoviesRating');
      const reviewsCollection = db.collection('reviews');

      // Assuming you have a 'reviews' collection in your MongoDB
      const newReview = {
          movieName,
          userName,
          reviewScore,
          reviewText,
          // You can add additional fields as needed
      };

      await reviewsCollection.insertOne(newReview);

      // Fetch all reviews from the database
      const allReviews = await reviewsCollection.find({}).toArray();

// res.render('review', { reviews: allReviews });

  } catch (error) {
      console.error('Error during review submission:', error);
      res.send('An error occurred during review submission.');
  } finally {
      await client.close();
  }
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

/////////// SEARCH ///////////////////////////////////////////////////////////////////////////////
app.post('/searchMovies', async (req, res) => {
  const { searchQuery } = req.body;

  try {
    await client.connect();
    const db = client.db('MoviesRating');
    const moviesCollection = db.collection('movies');

    // case insensitive search
    const regex = new RegExp(searchQuery, 'i');
    const matchingMovies = await moviesCollection.find({ title: regex }).toArray();

    res.render('searchResults', { movies: matchingMovies });
  } catch (error) {
    console.error('Error during movie search:', error);
    res.send('An error occurred during movie search.');
  } finally {
    await client.close();
  }
});