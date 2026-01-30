const STAKES = [
  {
    tier: "Low",
    entry: 10,
    rewardRange: [18, 20],
    league: "Bronze",
    minBalance: 0,
  },
  {
    tier: "Medium",
    entry: 50,
    rewardRange: [90, 100],
    league: "Silver",
    minBalance: 200,
  },
  {
    tier: "High",
    entry: 200,
    rewardRange: [360, 400],
    league: "Gold",
    minBalance: 800,
  },
  {
    tier: "Elite",
    entry: 1000,
    rewardRange: [1800, 2000],
    league: "Platinum",
    minBalance: 2500,
  },
];

const STARTING_TOKENS = 300;
const STORAGE_KEY = "token-clash-balance";

const tokenBalanceEl = document.getElementById("tokenBalance");
const stakeOptionsEl = document.getElementById("stakeOptions");
const indicatorEl = document.getElementById("indicator");
const targetEl = document.getElementById("target");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resultEl = document.getElementById("result");
const leagueInfoEl = document.getElementById("leagueInfo");
const leagueProgressEl = document.getElementById("leagueProgress");

let tokenBalance = loadBalance();
let selectedStake = STAKES[0];
let animationFrame = null;
let direction = 1;
let indicatorPosition = 0;
let roundActive = false;

function loadBalance() {
  const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10);
  return Number.isNaN(saved) ? STARTING_TOKENS : saved;
}

function saveBalance() {
  localStorage.setItem(STORAGE_KEY, String(tokenBalance));
}

function formatTokens(value) {
  return value.toLocaleString();
}

function updateBalance() {
  tokenBalanceEl.textContent = formatTokens(tokenBalance);
  saveBalance();
  updateLeagueInfo();
}

function updateLeagueInfo() {
  const nextLeague = STAKES.find((stake) => tokenBalance < stake.minBalance);
  const currentLeague = nextLeague ? previousStake(nextLeague) : STAKES[STAKES.length - 1];
  const currentMin = currentLeague?.minBalance ?? 0;
  const nextMin = nextLeague?.minBalance ?? currentMin + 1000;
  const progress = Math.min((tokenBalance - currentMin) / (nextMin - currentMin), 1);

  leagueInfoEl.textContent = `${currentLeague?.league ?? "Bronze"} League · Entry ${currentMin} tokens`;
  leagueProgressEl.style.width = `${Math.max(progress, 0.05) * 100}%`;
}

function previousStake(current) {
  const index = STAKES.indexOf(current);
  return index > 0 ? STAKES[index - 1] : STAKES[0];
}

function renderStakes() {
  stakeOptionsEl.innerHTML = "";
  STAKES.forEach((stake) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stake__button";
    button.innerHTML = `
      <strong>${stake.tier}</strong>
      <span>${stake.entry} tokens · ${stake.rewardRange[0]}–${stake.rewardRange[1]} reward</span>
    `;
    button.addEventListener("click", () => selectStake(stake, button));
    if (stake === selectedStake) {
      button.classList.add("stake__button--active");
    }
    stakeOptionsEl.appendChild(button);
  });
}

function selectStake(stake, button) {
  if (roundActive) {
    return;
  }
  selectedStake = stake;
  document.querySelectorAll(".stake__button").forEach((btn) => {
    btn.classList.remove("stake__button--active");
  });
  button.classList.add("stake__button--active");
  resultEl.textContent = `Selected ${stake.tier} stake. Entry ${stake.entry} tokens.`;
}

function startRound() {
  if (roundActive) {
    return;
  }
  if (tokenBalance < selectedStake.entry) {
    resultEl.textContent = "Not enough tokens. Choose a lower stake or wait for rewards.";
    return;
  }

  tokenBalance -= selectedStake.entry;
  updateBalance();

  roundActive = true;
  startButton.disabled = true;
  stopButton.disabled = false;
  resultEl.textContent = "Round started! Tap when the indicator hits the center.";

  indicatorPosition = 0;
  direction = 1;
  animateIndicator();
}

function animateIndicator() {
  const trackWidth = indicatorEl.parentElement.offsetWidth - indicatorEl.offsetWidth;
  const speed = 4 + selectedStake.entry / 150;

  indicatorPosition += direction * speed;
  if (indicatorPosition <= 0 || indicatorPosition >= trackWidth) {
    direction *= -1;
    indicatorPosition = Math.max(0, Math.min(trackWidth, indicatorPosition));
  }

  indicatorEl.style.left = `${indicatorPosition}px`;
  animationFrame = requestAnimationFrame(animateIndicator);
}

function stopRound() {
  if (!roundActive) {
    return;
  }

  cancelAnimationFrame(animationFrame);
  roundActive = false;
  startButton.disabled = false;
  stopButton.disabled = true;

  const track = indicatorEl.parentElement;
  const trackRect = track.getBoundingClientRect();
  const indicatorRect = indicatorEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const indicatorCenter = indicatorRect.left + indicatorRect.width / 2;
  const targetCenter = targetRect.left + targetRect.width / 2;
  const maxDistance = trackRect.width / 2;
  const distance = Math.abs(indicatorCenter - targetCenter);
  const accuracy = Math.max(0, 1 - distance / maxDistance);

  const minReward = selectedStake.rewardRange[0];
  const maxReward = selectedStake.rewardRange[1];
  const reward = Math.round(minReward + (maxReward - minReward) * accuracy);

  tokenBalance += reward;
  updateBalance();

  const accuracyPercent = Math.round(accuracy * 100);
  resultEl.innerHTML = `
    <strong>Accuracy:</strong> ${accuracyPercent}% · 
    <strong>Reward:</strong> +${reward} tokens · 
    <strong>Net:</strong> ${reward - selectedStake.entry} tokens
  `;
}

function resetWithSpacebar(event) {
  if (event.code !== "Space") {
    return;
  }
  event.preventDefault();
  if (roundActive) {
    stopRound();
  } else {
    startRound();
  }
}

startButton.addEventListener("click", startRound);
stopButton.addEventListener("click", stopRound);
document.addEventListener("keydown", resetWithSpacebar);

renderStakes();
updateBalance();
resultEl.textContent = "Choose a stake and press Start Round.";
