console.log("LET'S GO!");
let currfolder;
let currentSong = null; // Move currentSong to a higher scope
let currentSongIndex = 0; // Move currentSongIndex to a higher scope

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currfolder = folder;
    try {
        // Fetch the list of songs from the server
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        let text = await response.text();

        // Create a temporary div to parse the response HTML
        let div = document.createElement("div");
        div.innerHTML = text;

        // Extract all the anchor tags
        let links = div.getElementsByTagName("a");

        // Filter out the .mp3 files and decode the song names
        let songs = [];
        for (let i = 0; i < links.length; i++) {
            const element = links[i];
            if (element.href.endsWith(".mp3")) {
                // Decode URI component to handle special characters
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Update the song list in the UI
        let songUl = document.querySelector(".songlist ul");
        songUl.innerHTML = "";
        songs.forEach(song => {
            let li = document.createElement("li");
            li.innerHTML = `
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Song Artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>`;
            songUl.appendChild(li);
        });

        // Reattach event listeners to each song
        attachSongEventListeners(songs);

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playMusic = (track) => {
    // Ensure a track is provided
    if (!track) return;

    // Pause the current song if it is playing
    if (currentSong) {
        currentSong.pause();
        currentSong.src = '';
    }

    // Create a new audio object for the selected track
    currentSong = new Audio(`/${currfolder}/` + encodeURIComponent(track));
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Update the UI with the current time and duration of the song
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

        // Move circle of seekbar by changing its left property
        const percent = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = percent + "%";
    });

    // Add event listener to seekbar for seeking within the song
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    return currentSong;
};

async function displayAlbum() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let res = await a.text();
    let cardContainer = document.querySelector(".cardContainer");
    let div = document.createElement("div");
    div.innerHTML = res;
    let anchors = div.getElementsByTagName("a");

    // Traditional for loop instead of forEach
    for (let i = 0; i < anchors.length; i++) {
        let e = anchors[i];
        if (e.href.includes("/songs")) {
            let albm = e.href.split("/").slice(-1)[0];
            // Get metaData of FOLDER
            fetch(`http://127.0.0.1:5500/songs/${albm}/info.json`)
                .then(response => response.json())
                .then(res => {
                    let cardHTML = `<div data-folder="${albm}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="30" height="30">
                                <circle cx="15" cy="15" r="15" fill="green" />
                                <path d="M11 10v10l8-5-8-5z" fill="black" stroke="black" stroke-width="1" />
                            </svg>
                        </div>
                        <img src="/songs/${albm}/cover.jpg" alt="">
                        <h2>${res.title}</h2>
                        <p>${res.description}</p>
                    </div>`;
                    cardContainer.innerHTML += cardHTML;
                })
                .catch(error => {
                    console.error('Error fetching JSON:', error);
                });
        }
    }

    // Add event listeners to each card after they are all created
    setTimeout(() => {
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                let folder = item.currentTarget.dataset.folder;
                let songs = await getSongs(`songs/${folder}`);
                // Play the first song of the new folder by default
                if (songs.length > 0) {
                    playSongByIndex(0, songs);
                }
            });
        });
    }, 100);
}

async function main() {
    // Get the list of all songs
    let songs = await getSongs("songs/ncs");

    // Display albums on the page
    displayAlbum();

    // Function to play a song by its index
    function playSongByIndex(index, songList) {
        if (index < 0 || index >= songList.length) {
            return; // Index out of range
        }
        let songName = songList[index];
        currentSong = playMusic(songName);
        currentSongIndex = index; // Update current song index
    }

    // Display the first song's information by default
    if (songs.length > 0) {
        playSongByIndex(0, songs);
    }

    // Attach event listener to the "next" button
    next.addEventListener("click", async () => {
        currentSongIndex++;
        // Fetch songs from the current folder
        let songs = await getSongs(currfolder);
        // Check if the index exceeds the number of songs, loop back to the first song
        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }
        // Play the next song
        playSongByIndex(currentSongIndex, songs);
        currentSong.play();
        play.src = "pause.svg"; // Change to pause button
    });

    // Attach event listener to the "prev" button
    prev.addEventListener("click", async () => {
        currentSongIndex--;
        // Fetch songs from the current folder
        let songs = await getSongs(currfolder);
        // Check if the index is less than 0, loop back to the last song
        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }
        // Play the previous song
        playSongByIndex(currentSongIndex, songs);
        currentSong.play();
        play.src = "pause.svg"; // Change to pause button
    });

    // Attach event listeners to the initial song list
    attachSongEventListeners(songs);

    // Attach event listener to play/pause button
    play.addEventListener("click", () => {
        if (!currentSong) return; // No song selected

        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg"; // Change to pause button
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Add event listener for hamburger
    let hamb = document.querySelector(".hamburger");
    hamb.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add event listener on cross
    let cross = document.querySelector(".close");
    cross.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    // Add event to volume control
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume == 0) {
            vll.src = "mute.svg";
        } else {
            vll.src = "volume.svg";
        }
       
    });

    // Function to play a song by its index
    function playSongByIndex(index, songList) {
        if (index < 0 || index >= songList.length) {
            return; // Index out of range
        }
        let songName = songList[index];
        currentSong = playMusic(songName);
        currentSongIndex = index; // Update current song index
    }
}

// Attach event listeners to each song and the volume control
function attachSongEventListeners(songs) {
    // Attach click event listeners to each song in the song list
    Array.from(document.querySelectorAll(".songlist li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playSongByIndex(index, songs); // Play the clicked song
            currentSong.play();
            play.src = "pause.svg"; // Change to pause button
        });
    });

    // Add event listener to volume control
    // Add event listener to volume control
document.querySelector(".volu").addEventListener("click", e => {
    let volumeIcon = e.target;
    if (volumeIcon.src.includes("volume.svg")) {
        volumeIcon.src = "mute.svg"; // Change to mute icon
        currentSong.volume = 0; // Mute the current song
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else if (volumeIcon.src.includes("mute.svg")) {
        volumeIcon.src = "volume.svg"; // Change to volume icon
        currentSong.volume = 0.6; // Unmute the current song (adjust this as needed)
        document.querySelector(".range").getElementsByTagName("input")[0].value = currentSong.volume * 100;
    }
});


    // Function to play a song by its index
    function playSongByIndex(index, songList) {
        if (index < 0 || index >= songList.length) {
            return; // Index out of range
        }
        let songName = songList[index];
        currentSong = playMusic(songName);
        currentSongIndex = index; // Update current song index
    }
}

main();
