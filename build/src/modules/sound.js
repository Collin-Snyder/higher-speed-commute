export class Sound {
    constructor(src, loop, startMusic) {
        this.sound = document.createElement("audio");
        this.source = document.createElement("source");
        this.source.src = src;
        this.source.type = "audio/mp3";
        this.sound.onplay = (ev) => {
            console.log("playing sound: ", ev);
        };
        if (loop)
            this.sound.loop = true;
        this.sound.appendChild(this.source);
    }
    play() {
        this.sound.play();
    }
    pause() {
        this.sound.pause();
    }
    setRate(rate) {
        this.sound.playbackRate = rate;
    }
    resetRate() {
        this.sound.playbackRate = 1;
    }
}
class BufferLoader {
    constructor(context, sounds, onfinished) { }
}
class Sounds {
    constructor() {
        //@ts-ignore
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.sounds = {};
        // this.bufferLoader = new BufferLoader();
        this.div = document.getElementById("sounds");
    }
    loadSounds(sounds) { }
    get names() {
        return Object.keys(this.sounds);
    }
    addSound(name, src, loop, startMusic) {
        if (this.sounds[name])
            return false;
        let newSound = new Sound(src, loop, startMusic);
        this.sounds[name] = newSound;
        this.div.appendChild(newSound.sound);
        return true;
    }
    play(name) {
        this.sounds[name].play();
    }
    pause(name) {
        this.sounds[name].pause();
    }
    get(name) {
        return this.sounds[name];
    }
}
export default Sounds;
