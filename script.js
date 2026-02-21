const form = document.getElementById("note-form");
const noteText = document.getElementById("note-text");
const noteTitle = document.getElementById("note-title");
const lastSave = document.getElementById("last-save");
const noteSaveDate = document.getElementById("note-save-date");
const autoSave = document.getElementById("auto-save");
const recentItems = document.getElementById("recent-items");
const newNoteButton = document.getElementById("new-note");
const copyNoteButton = document.getElementById("copy-note");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const installButton = document.getElementById("install-button");
const closeInstallButton = document.getElementById("close-install");
const installBanner = document.getElementById("install-banner");
const recentFile = document.getElementById("recent-file");
const removeAllButton = document.getElementById("remove-all-button");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const recentKey = "recentNotes";
const autoSaveKey = "autoSave";

let currentNoteText = null;
let currentNoteTitle = null;

function lockTitle() {
  noteTitle.disabled = true;
}

function unlockTitle() {
  noteTitle.disabled = false;
  currentNoteText = null;
  currentNoteTitle = null;
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    String(hours).padStart(2, "0") + ":" +
    String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0")
  );
}


function truncateTitle(title, maxLength = 24) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function validateForm() {
  const titleText = noteTitle.value.trim();
  if (titleText.length === 0) {
    noteTitle.setCustomValidity("please fill out this field");
    noteTitle.reportValidity();
    return false;
  }
  noteTitle.setCustomValidity("");
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recent = recent.filter(item => item.title === titleText);
  if (recent.length > 0 && !currentNoteTitle) {
    const ok = confirm("A note with this title already exists.\nContinuing will overwrite the existing note.\n\nContinue?");
    return ok;
  }
  return true;
}

function updateStats() {
  const text = noteText.value;
  const chars = text.length;

  const words = text.trim().length === 0
    ? 0
    : text.trim().split(/\s+/).length;

  charCount.textContent = `${chars} chars`;
  wordCount.textContent = `${words} words`;
}

function saveNote(title, text) {
  if (!currentNoteTitle) {
    currentNoteTitle = title;
    currentNoteText = text;
    lockTitle();
  }
  let saveDate = new Date().toGMTString()
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recent = recent.filter(item => item.title !== title);
  recent.unshift({title, text, saveDate});
  localStorage.setItem(recentKey, JSON.stringify(recent));
  lastSave.style.display = "block";
  noteSaveDate.textContent = new Date(saveDate).toLocaleString();
  renderRecent();
}

function loadNote(title, text, saveDate) {
  noteText.value = text;
  noteTitle.value = title;
  currentNoteTitle = title;
  currentNoteText = text;
  lockTitle();
  form.scrollIntoView({ behavior: "smooth" });
  lastSave.style.display = "block";
  noteSaveDate.textContent = new Date(saveDate).toLocaleString();
  updateStats();
}

function removeNote(title) {
  const ok = confirm("Are you sure you want to remove this note?");
  if (ok) {
    let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
    recent = recent.filter(item => !(item.title===title));
    localStorage.setItem(recentKey, JSON.stringify(recent));
    if (currentNoteTitle === title) {
      unlockTitle();
    }
    renderRecent();
  }
}

function removeAllNotes() {
  const ok = confirm("Are you sure you want to remove all notes? This action cannot be undone.");
  if (ok) {
    localStorage.setItem(recentKey, "[]");
    unlockTitle();
    renderRecent();
  }
}

function copyNote() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(noteText.value);
  }
}



function renderRecent(){
  const nowDate = new Date();
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recentItems.innerHTML="";
  let maxLimit = recentItems.offsetWidth  / 10;
  recent.forEach(item=>{
    const li = document.createElement("li");
    const spanTitle = document.createElement("span");
    const spanRemove = document.createElement("span");
    const spanSaveDate = document.createElement("span");
    spanTitle.textContent = truncateTitle(item.title, maxLimit);
    spanTitle.className = "recent-title";
    spanRemove.textContent = "🗑️";
    spanRemove.className = "recent-remove";
    if (nowDate.toLocaleDateString() === new Date(item.saveDate).toLocaleDateString()) {
      spanSaveDate.textContent = new Date(item.saveDate).toLocaleTimeString();
    }
    else {
      spanSaveDate.textContent = new Date(item.saveDate).toLocaleDateString();
    }
    spanSaveDate.className = "recent-save-date";
    li.appendChild(spanRemove);
    li.appendChild(spanTitle);
    li.appendChild(spanSaveDate);
    spanRemove.addEventListener("click", ()=>{
      removeNote(item.title);
    });
    spanTitle.addEventListener("click", ()=>{
      loadNote(item.title, item.text, item.saveDate);
    });
    recentItems.appendChild(li);
  });

  exportButton.style.display = recent.length ? "inline-block" : "none";
  removeAllButton.style.display = recent.length ? "inline-block" : "none";
}


form.addEventListener("submit", function(e){
  e.preventDefault();
  if (validateForm()) {
    saveNote(noteTitle.value.trim(), noteText.value);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  renderRecent();
  autoSave.checked = localStorage.getItem(autoSaveKey) === "true";
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  if (recent.length > 0) {
    loadNote(recent[0].title, recent[0].text, recent[0].saveDate);
  }
});

noteText.addEventListener("input", () => {
  updateStats();
  if (autoSave.checked){
    if (!currentNoteTitle) {
      const ok = validateForm();
      if (ok) {
        saveNote(noteTitle.value.trim(), noteText.value);
      }
      else {
        autoSave.checked = false;
        alert("Auto-save was turned off because the note was not saved.\nYou can turn it back later.")
      }
    }
    else {
      saveNote(noteTitle.value.trim(), noteText.value);
    }
  }
});

autoSave.addEventListener("change", () => {
  localStorage.setItem(autoSaveKey, autoSave.checked);
})

newNoteButton.addEventListener("click", () => {
  noteTitle.value = "";
  noteText.value = "";
  updateStats();
  unlockTitle();
  noteTitle.focus();
});

copyNoteButton.addEventListener("click", copyNote);

exportButton.addEventListener("click", () => {
  const data = localStorage.getItem(recentKey);
  if (!data) {
    alert("No recent data to export.");
    return;
  }
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nanote-recent.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

importButton.addEventListener("click", () => {
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  if (recent.length > 0) {
    const ok = confirm(
    "Importing will REPLACE current recent notes.\nThis action is NOT reversible.\n\nContinue?");
    if (ok) recentFile.click();
  }
  else {
    recentFile.click();
  }
  
});

removeAllButton.addEventListener("click", removeAllNotes);

noteTitle.addEventListener("input", () => {
  noteTitle.setCustomValidity("");
});

recentFile.addEventListener("change", () => {
  const file = recentFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error();
      const isValid = parsed.every(item =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.text === "string" &&
        typeof item.saveDate === "string"
      );
      if (!isValid) throw new Error();
      localStorage.setItem(recentKey, JSON.stringify(parsed));
      renderRecent();
      if (parsed.length > 0) {
        loadNote(parsed[0].title, parsed[0].text, parsed[0].saveDate);
      }
      alert("Recent notes imported successfully.");
    } catch {
      alert("Invalid recent data file.");
    }
    recentFile.value = "";
  };
  reader.readAsText(file);
});
window.addEventListener("resize", renderRecent);

function showUpdateAlert(registration) {
  if (confirm("🚀 A new version is available. Reload now?")) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("/service-worker.js");

    if (reg.waiting) {
      showUpdateAlert(reg);
    }

    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateAlert(reg);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}


let deferredPrompt = null;
let isInstalled = false;



window.addEventListener("appinstalled", () => {
  isInstalled = true;
  deferredPrompt = null;
  installBanner.style.display = "none";
  console.log("PWA installed");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  // Save the event
  deferredPrompt = event;

  if (!isInstalled) {
    installBanner.style.display = "block";
  }
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  console.log("User choice:", outcome);

  deferredPrompt = null;
  installBanner.style.display = "none";
});

closeInstallButton.addEventListener("click", () => {
  installBanner.style.display = "none";
});
