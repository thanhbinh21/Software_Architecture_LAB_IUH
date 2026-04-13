require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.MOVIE_SERVICE_PORT) || 8082;

// In-memory movie DB with seed data
const movies = [
  {
    id: uuidv4(),
    title: 'Avengers: Secret Wars',
    genre: 'Action/Sci-Fi',
    duration: 180,
    price: 120000,
    seats: 100,
    availableSeats: 100,
    description: 'The ultimate Marvel crossover event',
    showtime: '2025-06-15 19:00',
    rating: 'PG-13',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Avengers'
  },
  {
    id: uuidv4(),
    title: 'Dune: Part Three',
    genre: 'Sci-Fi/Adventure',
    duration: 165,
    price: 110000,
    seats: 80,
    availableSeats: 80,
    description: 'The final chapter of the Dune saga',
    showtime: '2025-06-20 20:00',
    rating: 'PG-13',
    poster: 'https://via.placeholder.com/300x450/0f3460/e94560?text=Dune'
  },
  {
    id: uuidv4(),
    title: 'The Dark Knight Returns',
    genre: 'Action/Drama',
    duration: 152,
    price: 100000,
    seats: 120,
    availableSeats: 120,
    description: 'Batman comes back from retirement',
    showtime: '2025-06-22 18:30',
    rating: 'PG-13',
    poster: 'https://via.placeholder.com/300x450/16213e/e94560?text=Batman'
  }
];

// GET /movies
app.get('/movies', (req, res) => {
  console.log('[MOVIE-SERVICE] GET /movies - returning', movies.length, 'movies');
  res.json({
    success: true,
    count: movies.length,
    movies
  });
});

// GET /movies/:id
app.get('/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  res.json({ success: true, movie });
});

// POST /movies
app.post('/movies', (req, res) => {
  try {
    const { title, genre, duration, price, seats, description, showtime, rating } = req.body;

    if (!title || !genre || !duration || !price || !seats) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMovie = {
      id: uuidv4(),
      title,
      genre,
      duration: parseInt(duration),
      price: parseInt(price),
      seats: parseInt(seats),
      availableSeats: parseInt(seats),
      description: description || '',
      showtime: showtime || 'TBD',
      rating: rating || 'PG',
      poster: `https://via.placeholder.com/300x450/1a1a2e/e94560?text=${encodeURIComponent(title)}`
    };

    movies.push(newMovie);
    console.log(`[MOVIE-SERVICE] New movie added: ${title}`);
    res.status(201).json({ success: true, message: 'Movie added', movie: newMovie });
  } catch (err) {
    console.error('[MOVIE-SERVICE] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /movies/:id
app.put('/movies/:id', (req, res) => {
  const idx = movies.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  movies[idx] = { ...movies[idx], ...req.body };
  res.json({ success: true, message: 'Movie updated', movie: movies[idx] });
});

// PATCH /movies/:id/seats - reduce available seats
app.patch('/movies/:id/seats', (req, res) => {
  const { seatsBooked } = req.body;
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  if (movie.availableSeats < seatsBooked) {
    return res.status(400).json({ error: 'Not enough seats available' });
  }

  movie.availableSeats -= seatsBooked;
  console.log(`[MOVIE-SERVICE] Seats updated for "${movie.title}": ${movie.availableSeats} remaining`);
  res.json({ success: true, availableSeats: movie.availableSeats });
});

// PATCH /movies/:id/seats/release — hoàn ghế khi thanh toán ví thất bại / rollback
app.patch('/movies/:id/seats/release', (req, res) => {
  const { seatsReleased } = req.body;
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  const n = parseInt(seatsReleased, 10);
  if (!n || n < 1) return res.status(400).json({ error: 'seatsReleased must be a positive number' });

  movie.availableSeats = Math.min(movie.seats, movie.availableSeats + n);
  console.log(`[MOVIE-SERVICE] Seats released for "${movie.title}": ${movie.availableSeats} remaining`);
  res.json({ success: true, availableSeats: movie.availableSeats });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'movie-service', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[MOVIE-SERVICE] Running on port ${PORT}`);
  console.log(`[MOVIE-SERVICE] ${movies.length} movies pre-loaded`);
});
