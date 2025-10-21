
class GameState {

  constructor({ length = 30, scoreCB, visualSearchBar, renderedStringCB } = {}) {
    this.ground = Array(length)
    this.ui = {
      obstacle: {
        top: '⠛',
        bottom: '⣤',
      },
      dino: {
        standing: '⠗',
        jumping: '⠉',
        ducking: '⠤',
      },
      cloison: {
        jumping: '⣭',
        ducking: '⣛',
        crash: '💥',
      }
    }
    this.stance = 'standing'

    this.moveLock;
    this.moveTimeOut = 4;
    this.moveColdDown = 1;

    this.guaranteedSpace = 4; // there will always be 4 space between obstacles
    this.additionalSpaceProbability = 6; // X chances of spawning space against 2 chances of spawning obstacles (spawnPossibilities)

    this.spawnPossibilities = [this.ui.obstacle.top, this.ui.obstacle.bottom]

    this.dinoPosition = 0;

    this.visualSearchBar = visualSearchBar;

    this.score = 0;
    this.scoreCB = () => {
      this.score += 1;

      if (typeof scoreCB === 'function')
        scoreCB(this.score)
    }

    this.renderedStringCB = () => {
      this.updateURL()

      if (typeof scoreCB === 'function')
        renderedStringCB(this.renderedString)
    }

    this.eventListener()

    // Run
    this.gameInterval = setInterval(() => this.loop(), 1000 / 4)

    let level = 0;
    let levelUpInterval = setInterval(() => {
      if (!this.gameInterval) {
        clearInterval(levelUpInterval)
        return;
      }

      level += 1;

      clearInterval(this.gameInterval)
      this.gameInterval = setInterval(() => this.loop(), 1000 / (5 + level))

    }, 4000)
  }

  eventListener() {
    document.addEventListener('keydown', (event) => {
      if (this.moveLock)
        return;

      switch (event.key) {
        case "ArrowUp":
        case " ":
        case "w":
          this.stance = 'jumping'
          break;

        case "ArrowDown":
        case "Control":
        case "s":
          this.stance = 'ducking'
          break;
      }

      this.moveLock = this.moveTimeOut;
    })
  }

  spawnObstacle() {
    this.ground.shift()

    const lastItems = this.ground.slice(-this.guaranteedSpace);

    if (lastItems.some((item) => this.spawnPossibilities.includes(item)))
      return this.ground.push(undefined);

    const random = Math.floor(Math.random() * (this.spawnPossibilities.length + this.additionalSpaceProbability));
    this.ground.push(this.spawnPossibilities[random])
  }

  render() {
    const ground = [...this.ground];
    const dinoPosition = this.dinoPosition;

    const block = ground[dinoPosition];

    if (!block) {
      ground[dinoPosition] = this.ui.dino[this.stance]
    }

    else if (
      block === this.ui.obstacle.top && this.stance === 'ducking'
      || block === this.ui.obstacle.bottom && this.stance === 'jumping'
    ) {
      ground[dinoPosition] = this.ui.cloison[this.stance]
    }

    else {
      clearInterval(this.gameInterval)
      this.gameInterval = undefined;

      ground[dinoPosition] = this.ui.cloison.crash
    }

    this.renderedString = ground.join('_')
  }

  updateURL() {
    window.history.replaceState(undefined, undefined, location.pathname + '?' + this.renderedString + `⢎[Score:${this.score}]`)
  }

  loop() {
    this.scoreCB()

    this.spawnObstacle()

    this.render()
    this.renderedStringCB()

    if (this.moveLock > 0)
      this.moveLock -= 1;

    if (this.moveLock <= this.moveColdDown)
      this.stance = 'standing'
  }

}

class HighestScore {
  key = 'highestScore';
  static highestScore = Number(HighestScore.read()) || 0;
  timeout;

  static save(score) {
    HighestScore.highestScore = score;
    clearTimeout(this.timeout)

    this.timeout = setTimeout(() => {
      localStorage.setItem(this.key, score)
    }, 200)
  }

  static read() {
    return localStorage.getItem(this.key)
  }
}

window.history.replaceState(undefined, undefined, location.pathname)

const currentScore = document.getElementById('current-score');
const highestScore = document.getElementById('highest-score');
const visualSearchBar = document.getElementById('visual-search-bar');

highestScore.innerText = HighestScore.highestScore;

const UrlPrefix = location.origin + location.pathname + '?';

const option = {
  length: 30,
  scoreCB: (score) => {
    currentScore.innerText = score;

    if (score <= HighestScore.highestScore)
      return;

    HighestScore.save(score)
    highestScore.innerText = score;
  },
  renderedStringCB: (renderedString) => {
    visualSearchBar.innerText = UrlPrefix + renderedString;
  },
}

let game = new GameState(option);
document.addEventListener('keydown', (event) => {
  if (game?.gameInterval)
    return;

  switch (event.key) {
    case "ArrowUp":
    case " ":
    case "w":
    case "ArrowDown":
    case "Enter":
    case "s":
      break;

    default:
      return;
  }

  game = new GameState(option);
})