console.log("LET'S GO!");
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

async function getSongs() {
    try {
        // Fetch the list of songs from the server
        let response = await fetch("http://127.0.0.1:5500/songs/");
        let text = await response.text();
        console.log(text);

        // Create a temporary div to parse the response HTML
        let div = document.createElement("div");
        div.innerHTML = text;

        // Extract all the anchor tags
        let links = div.getElementsByTagName("a");
        console.log(links);

        // Filter out the .mp3 files and decode the song names
        let songs = [];
        for (let i = 0; i < links.length; i++) {
            const element = links[i];
            if (element.href.endsWith(".mp3")) {
                // Decode URI component to handle special characters
                songs.push(decodeURIComponent(element.href.split("/songs/")[1]));
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playMusic = (track, currentSong, pause = false) => {
    // Ensure a track is provided
    if (!track) return;

    // Pause the current song if it is playing
    if (currentSong) {
        currentSong.pause();
        currentSong.src = '';
    }

    // Create a new audio object for the selected track and play it
    currentSong = new Audio("/songs/" + encodeURIComponent(track));
    currentSong.play();
    play.src = "pause.svg"; // Change to pause button
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Show Duration
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

        // Move circle of seekbar by changing its left property
        const percent = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = percent + "%";
    });

    // Add event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    return currentSong;
};

async function main() {
    let currentSong = null;
    let currentSongIndex = 0; // Variable to keep track of the current song index

    // Get the list of all songs
    let songs = await getSongs();
    console.log(songs);

    // Add songs to the library and show all the songs in the playlist
    let songUl = document.querySelector(".songlist ul");
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

    // Function to play a song by its index
    function playSongByIndex(index) {
        if (index < 0 || index >= songs.length) {
            return; // Index out of range
        }
        let songName = songs[index];
        currentSong = playMusic(songName, currentSong);
        currentSongIndex = index; // Update current song index
    }

    // Play the first song by default
    playSongByIndex(0);

    // Attach event listener to the "next" button
    next.addEventListener("click", () => {
        // Increment the current song index
        currentSongIndex++;
        // Check if the index exceeds the number of songs, loop back to the first song
        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }
        // Play the next song
        playSongByIndex(currentSongIndex);
    });

    // Attach event listener to the "prev" button
    prev.addEventListener("click", () => {
        // Decrement the current song index
        currentSongIndex--;
        // Check if the index is less than 0, loop back to the last song
        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }
        // Play the previous song
        playSongByIndex(currentSongIndex);
    });

    // Attach event listeners to each song
    Array.from(document.querySelectorAll(".songlist li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playSongByIndex(index); // Play the clicked song
        });
    });

    // Attach event listener to play/pause button
    play.addEventListener("click", () => {
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
    // Add event to voume 
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change" , (e)=>{
         
         currentSong.volume = parseInt(e.target.value)/100 ; 
         if(currentSong.volume ==0){
            vll.src="mute.svg" ;
         }else{
            vll.src="volume.svg"
         }
    })

}
    /*
    Changes and Improvements:
    1. Renamed `responce` to `response` for correct spelling.
    2. Used `decodeURIComponent` and `encodeURIComponent` to handle special characters in song names, ensuring that song names are correctly parsed and played.
    3. Added code to pause the current song and clear its source before playing a new one, to ensure only one song plays at a time.
    4. Simplified the creation and appending of list items by using `createElement` and `appendChild` for better readability and performance.
    5. Added comments to explain each step and significant changes from the previous version, improving code maintainability and readability.
    6. Added an event listener to the seekbar circle to allow seeking to a specific point in the song.
    7. Set the first song's
*/

main()
