const API_KEY = 'b4dcc4d7e05faa999e28002a02c3607a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem;

// Fetch trending items
async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let results = [];
  for (let page = 1; page <= 2; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    results = results.concat(filtered);
  }
  return results;
}

// Display banner
function displayBanner(item) {
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

// Display lists
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.loading = 'lazy';
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// Modal functions
function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview || 'No description available.';
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2)) || 'N/A';
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function changeServer() {
  if (!currentItem) return;
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === 'movie' ? 'movie' : 'tv';
  let embedURL = '';

  if (server === 'vidsrc.cc') {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === 'vidsrc.me') {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === 'player.videasy.net') {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

// Search
let debounceTimeout;
function searchTMDBDebounced() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(searchTMDB, 300);
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const results = document.getElementById('search-results');
  results.innerHTML = '';

  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    results.appendChild(img);
  });
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

// Theme toggle
function toggleTheme() {
  if (document.body.dataset.theme === 'light') {
    document.body.dataset.theme = 'dark';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.dataset.theme = 'light';
    localStorage.setItem('theme', 'light');
  }
}

// Watchlist
function addToWatchlist() {
  if (!currentItem) return;
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  if (!watchlist.find(item => item.id === currentItem.id)) {
    watchlist.push(currentItem);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
    alert('Added to watchlist!');
  } else {
    alert('Already in watchlist!');
  }
}

function renderWatchlist() {
  const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const container = document.getElementById('watchlist');
  container.innerHTML = '';
  watchlist.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// Init
async function init() {
  const movies = await fetchTrending('movie');
  const tv = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tv, 'tvshows-list');
  displayList(anime, 'anime-list');
  renderWatchlist();

  // Load theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.dataset.theme = savedTheme;
}

init();
