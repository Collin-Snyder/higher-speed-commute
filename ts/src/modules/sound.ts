import Game from "../main";

export class Sound {
  public sound: HTMLAudioElement;
  public source: HTMLSourceElement;
  constructor(src: string, loop: boolean, startMusic?: boolean) {
    this.sound = document.createElement("audio");
    this.source = document.createElement("source");
    this.source.src = src;
    this.source.type = "audio/mp3";
    this.sound.onplay = (ev) => {
      console.log("playing sound: ", ev);
    };
    if (loop) this.sound.loop = true;
    this.sound.appendChild(this.source);
  }

  play() {
    this.sound.play();
  }

  pause() {
    this.sound.pause();
  }

  setRate(rate: number) {
    this.sound.playbackRate = rate;
  }

  resetRate() {
    this.sound.playbackRate = 1;
  }
}

class BufferLoader {
  constructor(context: AudioContext, sounds: string[], onfinished: Function) {}
}

class Sounds {
  public context: AudioContext;
  //   public bufferLoader: BufferLoader;
  public sounds: { [name: string]: Sound };
  private div: HTMLElement;
  constructor() {
    //@ts-ignore
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.sounds = {};
    // this.bufferLoader = new BufferLoader();
    this.div = <HTMLElement>document.getElementById("sounds");
  }

  loadSounds(sounds: string[]) {}

  get names() {
    return Object.keys(this.sounds);
  }

  addSound(name: string, src: string, loop: boolean, startMusic?: boolean) {
    if (this.sounds[name]) return false;
    let newSound = new Sound(src, loop, startMusic);
    this.sounds[name] = newSound;
    this.div.appendChild(newSound.sound);
    return true;
  }

  play(name: string) {
    this.sounds[name].play();
  }

  pause(name: string) {
    this.sounds[name].pause();
  }

  get(name: string) {
    return this.sounds[name];
  }
}

export default Sounds;
