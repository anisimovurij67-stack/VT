window.onload = function () {
  const currentTimeEl = document.getElementById("currentTime");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const secondsInput = document.getElementById("secondsInput");
  const startBtn = document.getElementById("startBtn");
  const countdownBox = document.getElementById("countdownBox");

  let countdownInterval = null;
  function updateCurrentClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    currentTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
  }
  updateCurrentClock();
  setInterval(updateCurrentClock, 1000);
  function openModal() {
    modalOverlay.classList.remove("hidden");
    secondsInput.value = "";
    secondsInput.focus();
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
  }

  openModalBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  secondsInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
    if (this.value !== "") {
      let num = parseInt(this.value, 10);
      if (num > 9999) {
        this.value = "9999";
      }
    }
  });
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  function resetToInitialState() {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownBox.classList.add("hidden");
    openModalBtn.classList.remove("hidden");
  }
  startBtn.addEventListener("click", function () {
    const rawVal = secondsInput.value.trim();
    let totalSeconds = parseInt(rawVal, 10);
    if (isNaN(totalSeconds) || totalSeconds < 0) {
      alert("Пожалуйста, введите корректное число секунд (от 0 до 9999)");
      secondsInput.focus();
      return;
    }
    closeModal();
    openModalBtn.classList.add("hidden");
    countdownBox.classList.remove("hidden");
    countdownBox.textContent = formatTime(totalSeconds);
    if (totalSeconds === 0) {
      setTimeout(() => {
        alert("Таймер завершён!");
        resetToInitialState();
      }, 100);
      return;
    }
    countdownInterval = setInterval(function () {
      totalSeconds--;
      countdownBox.textContent = formatTime(totalSeconds);

      if (totalSeconds <= 0) {
        clearInterval(countdownInterval);
        setTimeout(function () {
          alert("Таймер завершён!");
          resetToInitialState();
        }, 100);
      }
    }, 1000);
  });
};