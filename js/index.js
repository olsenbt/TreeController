let currentPage = null;
let debouncedSetLights = debounce(setLights, 300);
let adventContents = [];
const MAX_COLORS = 5;
let selectedColors = [];
let activeColorIndex = 0;
const debouncedSendColors = debounce(sendColorsToApi, 300);
let lastApiCall = null; // Store the last API call to replay when turning back on

// Move renderColorSlots outside of DOMContentLoaded so it's always accessible
function renderColorSlots() {
  const container = document.getElementById("colorSlots");
  if (!container) return; // Guard in case element doesn't exist yet
  
  container.innerHTML = "";

  const slotCount = Math.min(selectedColors.length + 1, MAX_COLORS);

  for (let i = 0; i < slotCount; i++) {
    const slot = document.createElement("div");
    slot.classList.add("color-slot");

    if (selectedColors[i]) {
      slot.classList.add("filled");
      slot.style.backgroundColor = `#${selectedColors[i]}`;
    }

    if (i === activeColorIndex) {
      slot.classList.add("active");
    }

    slot.addEventListener("click", () => {
      activeColorIndex = i;
      renderColorSlots();
    });

    container.appendChild(slot);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  currentPage = localStorage.getItem('password') ? document.getElementById('buttonsPage') : document.getElementById('loginPage');
  showPage(currentPage.id);

  // Initialize color slots if logged in
  if (localStorage.getItem('password')) {
    renderColorSlots();
  }

  // Add event listener to login form
  var loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var password = document.getElementById('password').value;
    localStorage.setItem('password', password);
    renderColorSlots();
    showPage('buttonsPage');
  });

  let buttonsPage = document.getElementById('buttonsPage').querySelectorAll('button');

  buttonsPage.forEach(function (button) {
    button.addEventListener("click", function () {
      clearActive();
      let dot = document.getElementById('stopButton');
      dot.classList.remove('activeButton');
      this.classList.add('activeButton');
    });
  });

  let powerButton = document.getElementById('powerButton');
  powerButton.addEventListener("click", function () {
    let stopButton = document.getElementById("stopButton");
    
    // If lights are currently off, turn them back on with last command
    if (stopButton.classList.contains("activeButton")) {
      if (lastApiCall) {
        fetch(lastApiCall)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
            return response.text();
          })
          .then(result => {
            console.log(result);
            stopButton.classList.remove('activeButton');
          })
          .catch(error => {
            console.error(error);
            alert(`Error turning lights back on: ${error.message}`);
          });
      } else {
        // No previous state, just turn off the indicator
        stopButton.classList.remove('activeButton');
      }
    } else {
      // Lights are on, turn them off
      runScript('stop');
      clearActive();
      stopButton.classList.add('activeButton');
    }
  });

  document.getElementById("clearColorsBtn").addEventListener("click", () => {
    selectedColors = [];
    activeColorIndex = 0;
    renderColorSlots();
  });

  // Load Pokemon Page
  loadPokemonSprites();
  let searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', filterPokemon);

  let randomButton = document.getElementById('randomPokemon');

  document.body.addEventListener('click', function (event) {
    if (currentPage == 'pokemonPage' && event.target !== randomButton &&
      !randomButton.contains(event.target)) {
      if (!event.target.closest(".card")) {
        filterPokemon();
      }
    }
  });

  // Add event listeners to navigation buttons
  var buttons = document.querySelectorAll('.nav-item');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      buttons.forEach(function (otherButton) {
        let otherPageValue = otherButton.getAttribute('data-page');
        otherButton.querySelectorAll('img')[0].src = "assets/" + otherPageValue + "Empty.svg";
      });

      let dataPageValue = this.getAttribute('data-page');
      this.querySelectorAll('img')[0].src = "assets/" + dataPageValue + "Full.svg";

      this.classList.add('active');

      currentPage = this.getAttribute('data-page');
      showPage(currentPage);
    });
  });

  // Initialize the iro.js color picker with color wheel and darkness slider
  var colorPicker = new iro.ColorPicker('#colorControls', {
    width: 300,
    borderWidth: 1,
    borderColor: '#fff',
    layout: [{
      component: iro.ui.Wheel
    },
    {
      component: iro.ui.Slider,
      options: {
        sliderType: 'value'
      }
    }
    ],
    color: "#ff0000"
  });

  // Event listener for color changes (while dragging - just visual preview)
  colorPicker.on('color:change', function (color) {
    const hex = color.hexString.replace("#", "");
    
    // Just update the current slot color, don't add new slots yet
    selectedColors[activeColorIndex] = hex;
    renderColorSlots();
  });

  // Fires when ANY input is released (wheel or slider)
  colorPicker.on('input:end', function (color) {
    const hex = color.hexString.replace("#", "");
    
    // Update the current slot
    selectedColors[activeColorIndex] = hex;

    // Move to next slot if we just filled the last one and haven't hit max
    if (
      activeColorIndex === selectedColors.length - 1 &&
      selectedColors.length < MAX_COLORS
    ) {
      activeColorIndex++;
    }

    renderColorSlots();
    debouncedSendColors();
  });

  // Event listener for darkness slider changes
  colorPicker.on('input:change', function (color) {
    if (color && color._color && typeof color._color.v !== 'undefined') {
      var brightness = 1 - color._color.v;
      colorPicker.color.set({
        v: brightness
      });
    }
  });

  // Show login page if password is not stored
  if (localStorage.getItem('password') == null) {
    showLoginPage();
  }

  var apiUrl = 'https://api.bennettolsen.us/status';

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.text();
    })
    .then(result => {
      console.log(result);
      let currentButton = document.getElementById(result + 'Button');
      if (currentButton) {
        currentButton.classList.add('activeButton');
      } else if (result.charAt(0) == "{") {
        let jsonResult = JSON.parse(result);
        console.log("setting color wheel: " + jsonResult);
        colorPicker.color.set(jsonResult);
      }
    })
    .catch(error => {
      console.error(error);
      alert(`Error executing Set Lights script: ${error.message}`);
    });

  try {
    loadAdventContents().then(() => {
      initAdvent();
      renderAdventEffectsGroup();
    });
  } catch (e) {
    console.error('Error initializing advent calendar:', e);
  }
});

function sendColorsToApi() {
  clearActive();

  // Filter out empty slots to get only filled colors
  const colors = selectedColors.filter(Boolean);
  
  if (colors.length === 0) return;

  // Always use set_colors endpoint for consistency
  let apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}`;
  colors.forEach((color, i) => {
    apiUrl += `&color${i + 1}=${color}`;
  });

  lastApiCall = apiUrl; // Store for power button toggle

  fetch(apiUrl)
    .then(r => {
      if (!r.ok) {
        throw new Error(`Error: ${r.status}`);
      }
      return r.text();
    })
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.error(error);
      alert(`Error setting colors: ${error.message}`);
    });
}

function setLights(r, g, b) {
  clearActive();
  var apiUrl = `https://api.bennettolsen.us/set_lights?password=${localStorage.getItem('password')}&r=${r}&g=${g}&b=${b}`;

  lastApiCall = apiUrl; // Store for power button toggle

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.text();
    })
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.error(error);
      alert(`Error executing Set Lights script: ${error.message}`);
    });
}

function setLights2(r, g, b) {
  clearActive();
  var apiUrl = `https://api.bennettolsen.us/set_lights?password=${localStorage.getItem('password')}&r=${r}&g=${g}&b=${b}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.text();
    })
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.error(error);
      alert(`Error executing Set Lights script: ${error.message}`);
    });
}

function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      func.apply(context, args);
    }, delay);
  };
}

function showPage(pageId) {
  var pages = document.querySelectorAll('[id$="Page"]');
  var searchBar = document.getElementById('searchBar');
  var randomPokemon = document.getElementById('randomPokemon');

  pages.forEach(function (page) {
    page.style.display = (page.id === pageId) ? 'flex' : 'none';
  });

  if (pageId === 'pokemonPage') {
    searchBar.style.display = 'block';
    randomPokemon.style.display = 'block';
  } else {
    searchBar.style.display = 'none';
    randomPokemon.style.display = 'none';
  }

  var navbar = document.getElementById('navbar');
  navbar.style.display = (pageId === 'loginPage') ? 'none' : 'flex';
}

function runScript(scriptName) {
  let apiUrl = `https://api.bennettolsen.us/run_script?password=${localStorage.getItem('password')}&script=${scriptName}`;

  if (scriptName == "warm") {
    apiUrl = `https://api.bennettolsen.us/set_lights?password=${localStorage.getItem('password')}&r=215&g=185&b=50`;
  } else if (scriptName == "red_green") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=00ff00&color2=ff0000`;
  } else if (scriptName == "huskies") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=32006E&color2=FFEB82`;
  } else if (scriptName == "cougars") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=848A89&color2=AB0003`;
  } else if (scriptName == "seahawks") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=00FF00&color2=0000FF`;
  } else if (scriptName == "vikings") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=FFC62F&color2=4F2683`;
  } else if (scriptName == "vintage") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=FF0000&color2=0000FF&color3=00FF00&color4=FF6600`;
  } else if (scriptName == "ocean") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=0000FF&color2=00FFFF&color3=0080FF&color4=4096FF`;
  } else if (scriptName == "redgreenwhite") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=FF0000&color2=00FF00&color3=FFFFFF`;
  } else if (scriptName == "classic") {
    apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=FF5100&color2=0F3BFF&color3=FF0A0A&color4=FF000D&color5=31FF26`;
  }

  // Don't store 'stop' command as the last API call
  if (scriptName !== 'stop') {
    lastApiCall = apiUrl;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.text();
    })
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.error(error);
      alert(`Error executing ${scriptName} script: ${error.message}`);
    });
}

function showLoginPage() {
  document.getElementById('navbar').style.display = 'none';
  var pages = document.querySelectorAll('[id$="Page"]');
  pages.forEach(function (page) {
    page.style.display = 'none';
  });

  var loginPage = document.getElementById('loginPage');
  loginPage.style.display = 'block';
}

function clearActive() {
  let dot = document.getElementById('stopButton');
  dot.classList.remove('activeButton');
  let buttonsPage = document.getElementById('buttonsPage').querySelectorAll('button');
  buttonsPage.forEach(function (btn) {
    btn.classList.remove('activeButton');
  });
}

let pokemonImgs = null;
let allPokemonData = [];
let selectedPokemonId = null;

async function loadPokemonSprites() {
  const totalPokemon = 1025;
  const pokedex = document.getElementById("pokedex");

  const promises = [];

  for (let i = 1; i <= totalPokemon; i++) {
    promises.push(getPokemonData(i));
  }

  try {
    const pokemon = await Promise.all(promises);
    allPokemonData = pokemon;
    pokemon.forEach((pokemon, i) => {
      let pokedexEntry = genPokedexEntry(pokemon);
      pokedexEntry.addEventListener('click', () => handlePokemonClick(pokemon.id));
      pokedex.appendChild(pokedexEntry);
    });
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
  }
}

function filterPokemon() {
  const searchBar = document.getElementById('searchBar');
  const searchTerm = searchBar.value.toLowerCase();
  const pokedex = document.getElementById('pokedex');

  while (pokedex.firstChild) {
    pokedex.removeChild(pokedex.firstChild);
  }

  const filteredPokemon = allPokemonData.filter(pokemon => pokemon.name.startsWith(searchTerm));

  filteredPokemon.forEach((pokemon, i) => {
    let pokedexEntry = genPokedexEntry(pokemon);
    pokedexEntry.addEventListener('click', () => handlePokemonClick(pokemon.id));
    pokedex.appendChild(pokedexEntry);
  });
}

async function getPokemonData(pokemonId) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  const data = await response.json();
  return data;
}

function genPokedexEntry(pokemon) {
  let pokedexEntry = document.createElement('div');
  pokedexEntry.classList.add("grid_item");
  pokedexEntry.setAttribute('id', pokemon.id);

  let card = document.createElement('div');
  card.classList.add("card");

  let pokemonImg = document.createElement('img');
  pokemonImg.src = pokemon.sprites.front_default;

  let cardContent = document.createElement('div');
  cardContent.classList.add("card_content");

  let pokemonName = document.createElement('p');
  pokemonName.innerHTML = capitalizeFirstLetter(pokemon.name);
  pokemonName.classList.add("card_text");

  cardContent.appendChild(pokemonName);
  card.appendChild(pokemonImg);
  card.appendChild(cardContent);
  pokedexEntry.appendChild(card);

  return pokedexEntry;
}

function capitalizeFirstLetter(string) {
  return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

function handlePokemonClick(id) {
  clearActive();
  highlightSelectedPokemon(null);

  fetch('pokemonColors.json')
    .then(response => response.json())
    .then(pokemonColors => {
      const colors = pokemonColors[id].map(color => color.replace('#', ''));

      const apiUrl = `https://api.bennettolsen.us/set_colors?password=${localStorage.getItem('password')}&color1=${colors[0]}&color2=${colors[1]}&color3=${colors[2]}`;
      
      lastApiCall = apiUrl; // Store for power button toggle
      
      console.log(apiUrl);
      fetch(apiUrl)
        .then(apiResponse => {
          if (!apiResponse.ok) {
            throw new Error(`API request failed with status: ${apiResponse.status}`);
          }
          return apiResponse.text();
        })
        .then(responseText => {
          console.log(responseText);
        })
        .catch(error => {
          console.error('Error making API request:', error);
        });

      highlightSelectedPokemon(id);
    })
    .catch(error => {
      console.error('Error reading pokemonColors.json:', error);
    });
}

function chooseRandomPokemon() {
  const pokedex = document.getElementById('pokedex');

  while (pokedex.firstChild) {
    pokedex.removeChild(pokedex.firstChild);
  }

  const randomIndex = Math.floor(Math.random() * allPokemonData.length);
  const randomPokemon = allPokemonData[randomIndex];

  let pokedexEntry = genPokedexEntry(randomPokemon);
  pokedexEntry.addEventListener('click', () => handlePokemonClick(randomPokemon.id));
  pokedex.appendChild(pokedexEntry);

  pokedexEntry.scrollIntoView({
    behavior: 'smooth'
  });

  document.getElementById('searchBar').value = '';

  highlightSelectedPokemon(randomPokemon.id);
}

function highlightSelectedPokemon(pokemonId) {
  if (selectedPokemonId !== null) {
    const prevSelectedButton = document.getElementById(selectedPokemonId);
    if (prevSelectedButton) {
      prevSelectedButton.style.backgroundColor = '';
    }
  }

  const selectedButton = document.getElementById(pokemonId);
  if (selectedButton) {
    selectedButton.style.backgroundColor = '#3f7539';
    selectedPokemonId = pokemonId;
  }
}

async function loadAdventContents() {
  try {
    const response = await fetch('adventContents.json');
    adventContents = await response.json();
    console.log('Advent contents loaded:', adventContents);
  } catch (e) {
    console.error('Error loading adventContents.json:', e);
    adventContents = [];
  }
}

function getAdventContent(day) {
  return adventContents.find(item => item.day === day) || { day, name: `Day ${day}`, script: `advent${day}` };
}

function loadOpenedDays() {
  try {
    const raw = localStorage.getItem('advent_opened');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveOpenedDays(days) {
  localStorage.setItem('advent_opened', JSON.stringify(days));
}

function initAdvent() {
  buildAdventGrid();

  const unlockBtn = document.getElementById('adventUnlockBtn');
  const closeBtn = document.getElementById('adventCloseBtn');

  if (unlockBtn) {
    unlockBtn.addEventListener('click', function () {
      const day = parseInt(unlockBtn.getAttribute('data-day'), 10);
      unlockDay(day);
      closeAdvent();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      closeAdvent();
    });
  }
}

function buildAdventGrid() {
  const container = document.getElementById('adventCalendar');
  if (!container) return;
  container.innerHTML = '';
  const opened = loadOpenedDays();

  for (let day = 1; day <= 25; day++) {
    const cell = document.createElement('div');
    cell.classList.add('advent-cell');
    cell.setAttribute('data-day', day);
    cell.textContent = day;

    const isOpened = opened.indexOf(day) !== -1;
    const unlocked = isOpened || isDayUnlocked(day);

    if (!unlocked) cell.classList.add('locked');
    if (isOpened) cell.classList.add('opened');

    if (isOpened) {
      const badge = document.createElement('div');
      badge.classList.add('advent-badge');
      badge.textContent = '✓';
      cell.appendChild(badge);
    }

    cell.addEventListener('click', function () {
      openAdvent(day);
    });

    container.appendChild(cell);
  }
}

function isDayUnlocked(day) {
  const now = new Date();
  const override = localStorage.getItem('advent_override');
  let today = now;
  if (override) {
    const o = new Date(override);
    if (!isNaN(o.getTime())) today = o;
  }

  if (today.getMonth() === 11) {
    return today.getDate() >= day;
  }
  return false;
}

function openAdvent(day) {
  const opened = loadOpenedDays();
  const isOpened = opened.indexOf(day) !== -1;
  const unlocked = isOpened || isDayUnlocked(day);
  const content = getAdventContent(day);

  const modal = document.getElementById('adventModal');
  const title = document.getElementById('adventModalTitle');
  const body = document.getElementById('adventModalBody');
  const unlockBtn = document.getElementById('adventUnlockBtn');

  if (!modal || !title || !body || !unlockBtn) return;

  title.textContent = `Day ${day}`;

  if (!unlocked) {
    body.textContent = `This gift is locked until December ${day}.`;
    unlockBtn.style.display = 'none';
  } else if (isOpened) {
    body.textContent = `You've already opened Day ${day}.\n\n🎄 ${content.name}\n\nYou can run this effect from the Effects page.`;
    unlockBtn.style.display = 'none';
  } else {
    body.textContent = `Unlock Day ${day} to get:\n\n🎄 ${content.name}`;
    unlockBtn.style.display = 'inline-block';
    unlockBtn.setAttribute('data-day', day);
  }

  modal.style.display = 'flex';
}

function closeAdvent() {
  const modal = document.getElementById('adventModal');
  if (modal) modal.style.display = 'none';
}

function unlockDay(day) {
  const opened = loadOpenedDays();
  if (opened.indexOf(day) === -1) {
    opened.push(day);
    opened.sort((a, b) => a - b);
    saveOpenedDays(opened);
  }

  buildAdventGrid();
  renderAdventEffectsGroup();
}

function renderAdventEffectsGroup() {
  const buttonsPage = document.getElementById('buttonsPage');
  if (!buttonsPage) return;

  buttonsPage.querySelectorAll('.advent-effect-button').forEach(btn => btn.remove());

  const opened = loadOpenedDays();
  opened.forEach(day => {
    const content = getAdventContent(day);
    const btn = document.createElement('button');
    btn.textContent = content.name;
    btn.className = 'advent-effect-button';
    btn.addEventListener('click', function () {
      clearActive();
      this.classList.add('activeButton');
      runScript(content.script);
    });
    buttonsPage.appendChild(btn);
  });
}