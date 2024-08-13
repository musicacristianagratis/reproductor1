const RADIO_NAME = '♫ MusicaCristiana ♪';

// Change Stream URL Here, Supports, ICECAST, ZENO, SHOUTCAST, RADIOJAR and any other stream service.
const URL_STREAMING = 'https://stream.zeno.fm/efy4auvgp9duv';

var TYPE_API ='SPOTIFY'; //selecciona entre itunes , deezer o spotify xd

//API URL /
const API_URL = 'https://apikpop.conexionkpop.com/api_v4.php?url='+URL_STREAMING

// Visit https://api.vagalume.com.br/docs/ to get your API key
const API_KEY = "18fe07917957c289983464588aabddfb";

let userInteracted = true;

// Cache para la API 
const cache = {};


const getDataFromConexionKpop = async (artist, title, defaultArt, defaultCover) => {
    let text;
    if (artist === title) {
            text = `${title}`;
    } else {
            text = `${artist} - ${title}`;
    }
    const cacheKey = text.toLowerCase();
    if (cache[cacheKey]) {
            return cache[cacheKey];
    }

    
    const response = await fetch(`https://apikpop.conexionkpop.com/buscador.php?query=${encodeURIComponent(text)}&service=` + TYPE_API.toLowerCase());
    if (response.status === 403) {
            const results = {
                    title,
                    artist,
                    art: defaultArt,
                    cover: defaultCover,
                    stream_url: "#not-found",
            };
            
            return results;
    }
    const data = response.ok ? await response.json() : {};
    if (!data.results || data.results.length === 0) {
            const results = {
                    title,
                    artist,
                    art: defaultArt,
                    cover: defaultCover,
                    stream_url: "#not-found",
            };
            
            return results;
    }
    const stream = data.results;
    const results = {
            title: title,
            artist: artist,
            thumbnail: stream.artwork.medium || defaultArt,
            art: stream.artwork.medium || defaultArt,
            cover: stream.artwork.medium || defaultCover,
            stream_url: "#not-found",
    };
    cache[cacheKey] = results;
    return results;
};





window.addEventListener('load', () => { 
    const page = new Page();
    page.changeTitlePage();
    page.setVolume();

    const player = new Player();
    player.play();

    
    getStreamingData();

    
    const streamingInterval = setInterval(getStreamingData, 10000);

    
    const coverArt = document.querySelector('.cover-album'); 
    if (coverArt) { 
      coverArt.style.height = `${coverArt.offsetWidth}px`;
    } else {
      console.warn("Elemento .cover-album no encontrado.");
    }
});

// DOM control
class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function(song, artist) {
            const currentSong = document.getElementById('currentSong');
            const currentArtist = document.getElementById('currentArtist');
            const lyricsSong = document.getElementById('lyricsSong');
        
            if (song !== currentSong.textContent || artist !== currentArtist.textContent) { 
               
                currentSong.classList.add('fade-out');
                currentArtist.classList.add('fade-out');
        
                setTimeout(function() {
                    
                    currentSong.textContent = song; 
                    currentArtist.textContent = artist;
                    lyricsSong.textContent = song + ' - ' + artist;
        
                    
                    currentSong.classList.remove('fade-out');
                    currentSong.classList.add('fade-in');
                    currentArtist.classList.remove('fade-out');
                    currentArtist.classList.add('fade-in');
                }, 500); 
        
                setTimeout(function() {
                    
                    currentSong.classList.remove('fade-in');
                    currentArtist.classList.remove('fade-in');
                }, 1000); 
            }
        };
          
        this.refreshHistoric = async function (info, n) {
            const historicDiv = document.querySelectorAll('#historicSong article')[n];
            const songName = document.querySelectorAll('#historicSong article .music-info .song')[n];
            const artistName = document.querySelectorAll('#historicSong article .music-info .artist')[n];
            const coverHistoric = document.querySelectorAll('#historicSong article .cover-historic')[n];
            
            const defaultCoverArt = "../img/cover.png"; //imagen default
            //const defaultArt = 'img/logan.png';
            
            const music = info.song.replace(/'/g, '\'').replace(/&/g, '&');
            const artist = info.artist.replace(/'/g, '\'').replace(/&/g, '&');
          
            songName.innerHTML = music;
            artistName.innerHTML = artist;
        
            try {
                const data = await getDataFromConexionKpop(artist, music, defaultCoverArt);
        
                
                coverHistoric.style.backgroundImage = 'url(' + (data.art || defaultCoverArt) + ')';
            } catch (error) {
                console.error("Error al obtener datos de la API :", error);
                coverHistoric.style.backgroundImage = 'url(' + defaultCoverArt + ')';
            }
        
            
            historicDiv.classList.add('animated', 'slideInRight');
            setTimeout(() => historicDiv.classList.remove('animated', 'slideInRight'), 2000); 
        };
        
        this.refreshCover = async function (song = '', artist) {
            const coverArt = document.getElementById('currentCoverArt');
            const coverBackground = document.getElementById('bgCover');
            const defaultCoverArt = "../img/cover.png"; // imagen default
        
            try {
                const data = await getDataFromConexionKpop(artist, song, defaultCoverArt);
        
                
                coverArt.style.backgroundImage = 'url(' + data.art + ')';
                coverBackground.style.backgroundImage = 'url(' + data.cover + ')';
        
                
                coverArt.classList.add('animated', 'bounceInLeft');
                setTimeout(() => coverArt.classList.remove('animated', 'bounceInLeft'), 2000);
              
                
                if ('mediaSession' in navigator) {
                    const artwork = [
                        { src: data.art, sizes: '96x96',   type: 'image/png' },
                        { src: data.art, sizes: '128x128', type: 'image/png' },
                        { src: data.art, sizes: '192x192', type: 'image/png' },
                        { src: data.art, sizes: '256x256', type: 'image/png' },
                        { src: data.art, sizes: '384x384', type: 'image/png' },
                        { src: data.art, sizes: '512x512', type: 'image/png' },
                    ];
                
                    navigator.mediaSession.metadata = new MediaMetadata({ 
                        title: song, 
                        artist: artist, 
                        artwork 
                    });
                }
            } catch (error) {
                console.error("Error al obtener datos de la API ", error);
                
            }
        };

        this.changeVolumeIndicator = function(volume) {
            document.getElementById('volIndicator').textContent = volume; 
          
            if (typeof Storage !== 'undefined') {
              localStorage.setItem('volume', volume);
            }
          };
          
        this.setVolume = function() {
            if (typeof Storage !== 'undefined') {
              const volumeLocalStorage = localStorage.getItem('volume') || 95; 
          
              document.getElementById('volume').value = volumeLocalStorage;
              document.getElementById('volIndicator').textContent = volumeLocalStorage;
            }
          };

        this.refreshLyric = async function (currentSong, currentArtist) {
            const openLyric = document.getElementsByClassName('lyrics')[0];
            const modalLyric = document.getElementById('modalLyrics');
            
            try {
              const response = await fetch('https://api.vagalume.com.br/search.php?apikey=' + API_KEY + '&art=' + currentArtist + '&mus=' + currentSong.toLowerCase());
              const data = await response.json();
          
              if (data.type === 'exact' || data.type === 'aprox') {
                const lyric = data.mus[0].text;
          
                
                document.getElementById('lyric').innerHTML = lyric.replace(/\n/g, '<br />');
                openLyric.style.opacity = "1";
                openLyric.setAttribute('data-toggle', 'modal');
          
               
                modalLyric.style.display = "none";
                modalLyric.setAttribute('aria-hidden', 'true');
                if (document.getElementsByClassName('modal-backdrop')[0]) {
                  document.getElementsByClassName('modal-backdrop')[0].remove();
                }
              } else {
                openLyric.style.opacity = "0.3";
                openLyric.removeAttribute('data-toggle');
              }
            } catch (error) {
              console.error("Error al buscar letras de canciones:", error);
              openLyric.style.opacity = "0.3";
              openLyric.removeAttribute('data-toggle');
            }
        };
    }
}


async function getStreamingData() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Error en la solicitud de API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      console.log('%cdebug', 'font-size: 22px'); 
    } else {
      const page = new Page();

     
      const currentSong = data.currentSong.replace(/'/g, '\'').replace(/&/g, '&');
      const currentArtist = data.currentArtist.replace(/'/g, '\'').replace(/&/g, '&');

      
      document.title = currentSong + ' - ' + currentArtist + ' | ' + RADIO_NAME;

      if (document.getElementById('currentSong').innerHTML !== currentSong) {
        page.refreshCover(currentSong, currentArtist);
        page.refreshCurrentSong(currentSong, currentArtist);
        page.refreshLyric(currentSong, currentArtist);

        
        for (let i = 0; i < data.songHistory.length; i++) {
          page.refreshHistoric(data.songHistory[i], i);
        }
      }
    }
  } catch (error) {
    console.error("Error al obtener datos de transmisiÃ³n:", error);
    //alert("Ocorreu um erro ao buscar informaÃ§Ãµes da mÃºsica. Por favor, tente novamente mais tarde."); 
  }
}

// AUDIO 



var audio = new Audio(URL_STREAMING);


class Player {
    constructor() {
        this.play = async function () {
            await audio.play();

            var defaultVolume = document.getElementById('volume').value;

            if (typeof (Storage) !== 'undefined') {
                if (localStorage.getItem('volume') !== null) {
                    audio.volume = intToDecimal(localStorage.getItem('volume'));
                } else {
                    audio.volume = intToDecimal(defaultVolume);
                }
            } else {
                audio.volume = intToDecimal(defaultVolume);
            }
            document.getElementById('volIndicator').innerHTML = defaultVolume;
            
            togglePlay(); // Adiciona esta linha para atualizar o botÃ£o
        };

        this.pause = function () {
            audio.pause();
        };
    }
}

// On play, change the button to pause
audio.onplay = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao.className === 'fa fa-play') {
        botao.className = 'fa fa-pause';
        bplay.firstChild.data = 'PAUSAR';
    }
}

// On pause, change the button to play
audio.onpause = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao.className === 'fa fa-pause') {
        botao.className = 'fa fa-play';
        bplay.firstChild.data = 'PLAY';
    }
}

// Unmute when volume changed
audio.onvolumechange = function () {
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

audio.onerror = function () {
    var confirmacao = confirm('TransmisiÃ³n inactiva/Error de red. \nHaga clic en Aceptar para intentarlo de nuevo.');

    if (confirmacao) {
        window.location.reload();
    }
}

document.getElementById('volume').oninput = function () {
    audio.volume = intToDecimal(this.value);

    var page = new Page();
    page.changeVolumeIndicator(this.value);
}


function togglePlay() {
    const playerButton = document.getElementById("playerButton");
    const isPlaying = playerButton.classList.contains("fa-pause-circle");
  
    if (isPlaying) {
      playerButton.classList.remove("fa-pause-circle");
      playerButton.classList.add("fa-play-circle");
      playerButton.style.textShadow = "0 0 5px black";
      audio.pause();
    } else {
      playerButton.classList.remove("fa-play-circle");
      playerButton.classList.add("fa-pause-circle");
      playerButton.style.textShadow = "0 0 5px black";
      audio.load();
      audio.play();
    }
  }

function volumeUp() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0 && audio.volume < 1) {
            audio.volume = (vol + .01).toFixed(2);
        }
    }
}

function volumeDown() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0.01 && audio.volume <= 1) {
            audio.volume = (vol - .01).toFixed(2);
        }
    }
}

function mute() {
    if (!audio.muted) {
        document.getElementById('volIndicator').innerHTML = 0;
        document.getElementById('volume').value = 0;
        audio.volume = 0;
        audio.muted = true;
    } else {
        var localVolume = localStorage.getItem('volume');
        document.getElementById('volIndicator').innerHTML = localVolume;
        document.getElementById('volume').value = localVolume;
        audio.volume = intToDecimal(localVolume);
        audio.muted = false;
    }
}

document.addEventListener('keydown', function (event) {
    var key = event.key;
    var slideVolume = document.getElementById('volume');
    var page = new Page();

    switch (key) {
        // Arrow up
        case 'ArrowUp':
            volumeUp();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Arrow down
        case 'ArrowDown':
            volumeDown();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Spacebar
        case ' ':
        case 'Spacebar':
            togglePlay();
            break;
        // P
        case 'p':
        case 'P':
            togglePlay();
            break;
        // M
        case 'm':
        case 'M':
            mute();
            break;
        // Numeric keys 0-9
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            var volumeValue = parseInt(key);
            audio.volume = volumeValue / 10;
            slideVolume.value = volumeValue * 10;
            page.changeVolumeIndicator(volumeValue * 10);
            break;
    }
});


function intToDecimal(vol) {
    return vol / 100;
}

function decimalToInt(vol) {
    return vol * 100;
}

