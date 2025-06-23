const API_KEY = 'b4dcc4d7e05faa999e28002a02c3607a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  loadWatchlist();
});

function displayListSkeleton(containerId, count = 5) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'skeleton';
    div.style.width = '150px';
    div.style.height = '225px';
    div.style.marginRight = '10px';
    container.appendChild(div);
  }
}

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

function displayBanner(item) {
  if (!item) return;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.loading = 'lazy';
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  const rating = Math.round(item.vote_average / 2);
  document.getElementById('modal-rating').innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  document.getElementById('modal-video').title = `${item.title || item.name} video player`;
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

let searchTimeout;
function searchTMDBDebounced() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchTMDB, 300);
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  container.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

function addToWatchlist() {
  let list = JSON.parse(localStorage.getItem('watchlist')) || [];
  if (!list.find(i => i.id === currentItem.id)) {
    list.push({
      id: currentItem.id,
      title: currentItem.title || currentItem.name,
      poster: currentItem.poster_path,
      media_type: currentItem.media_type
    });
    localStorage.setItem('watchlist', JSON.stringify(list));
    alert('Added to watchlist!');
    loadWatchlist();
  } else {
    alert('Already in watchlist');
  }
}

function loadWatchlist() {
  const container = document.getElementById('watchlist');
  if (!container) return;
  const list = JSON.parse(localStorage.getItem('watchlist')) || [];
  container.innerHTML = '';
  list.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster}`;
    img.alt = item.title;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

async function init() {
  displayListSkeleton('movies-list');
  displayListSkeleton('tvshows-list');
  displayListSkeleton('anime-list');

  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  if (movies.length > 0) {
    displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  }
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();
