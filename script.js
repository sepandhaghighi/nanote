const DOM = {
  form: document.getElementById("note-form"),
  noteText: document.getElementById("note-text"),
  noteTitle: document.getElementById("note-title"),
  lastSave: document.getElementById("last-save"),
  noteSaveDate: document.getElementById("note-save-date"),
  autoSave: document.getElementById("auto-save"),
  recentItems: document.getElementById("recent-items"),
  newNoteButton: document.getElementById("new-note"),
  copyNoteButton: document.getElementById("copy-note"),
  downloadNoteButton: document.getElementById("download-note"),
  openNoteButton: document.getElementById("open-note"),
  openFileInput: document.getElementById("open-file"),
  exportButton: document.getElementById("export-button"),
  importButton: document.getElementById("import-button"),
  installButton: document.getElementById("install-button"),
  closeInstallButton: document.getElementById("close-install"),
  installBanner: document.getElementById("install-banner"),
  recentFile: document.getElementById("recent-file"),
  removeAllButton: document.getElementById("remove-all-button"),
  charCount: document.getElementById("char-count"),
  wordCount: document.getElementById("word-count"),
  previewToggleButton: document.getElementById("preview-toggle"),
  markdownPreview: document.getElementById("markdown-preview"),
}

const recentKey = "recentNotes";
const autoSaveKey = "autoSave";

const state = {
  currentNoteText: null,
  currentNoteTitle: null,
  previewMode: false,
}

function getRecent() {
  return JSON.parse(localStorage.getItem(recentKey) || "[]");
}

function setRecent(data) {
  localStorage.setItem(recentKey, JSON.stringify(data));
}

function getAutoSave() {
  return localStorage.getItem(autoSaveKey);
}

function setAutoSave(value) {
  localStorage.setItem(autoSaveKey, value);
}

function renderMarkdown() {
  const text = DOM.noteText.value;
  const rawHtml = marked.parse(text);
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  DOM.markdownPreview.innerHTML = cleanHtml;
}

function togglePreview() {
  state.previewMode = !state.previewMode;

  if (state.previewMode) {
    renderMarkdown();
    DOM.markdownPreview.style.display = "block";
    DOM.noteText.style.display = "none";
    DOM.previewToggleButton.textContent = "✏️ Edit";
  } else {
    DOM.markdownPreview.style.display = "none";
    DOM.noteText.style.display = "block";
    DOM.previewToggleButton.textContent = "👁 MD Preview";
  }
}


function openNoteFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const content = reader.result;
    DOM.noteText.value = content;
    const name = file.name.replace(/\.[^/.]+$/, "");
    DOM.noteTitle.value = name;
    unlockTitle();
    updateStats();
  };

  reader.readAsText(file);
}

function getMimeType(ext) {
  const mimeTypes = {
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    htm: "text/html",
    json: "application/json",
    csv: "text/csv",
    xml: "application/xml",
    yaml: "application/x-yaml",
    yml: "application/x-yaml",
    js: "text/javascript",
    py: "text/x-python",
    css: "text/css",
    log: "text/plain"
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function downloadNote() {
  const title = DOM.noteTitle.value.trim() || "nanote";
  const text = DOM.noteText.value;
  const defaultName =
    (title.replace(/\s+/g, "_") || "nanote") + ".txt";
  const fileName = prompt("Enter file name (example: note.txt):", defaultName);
  if (!fileName) return;
  const cleanName = fileName.trim();
  const parts = cleanName.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
  const mime = getMimeType(ext);
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = cleanName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function lockTitle() {
  DOM.noteTitle.disabled = true;
}

function unlockTitle() {
  DOM.noteTitle.disabled = false;
  state.currentNoteText = null;
  state.currentNoteTitle = null;
}


function truncateTitle(title, maxLength = 24) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function validateForm() {
  const titleText = DOM.noteTitle.value.trim();
  if (titleText.length === 0) {
    DOM.noteTitle.setCustomValidity("please fill out this field");
    DOM.noteTitle.reportValidity();
    return false;
  }
  DOM.noteTitle.setCustomValidity("");
  let recent = getRecent();
  recent = recent.filter(item => item.title === titleText);
  if (recent.length > 0 && !state.currentNoteTitle) {
    const ok = confirm("A note with this title already exists.\nContinuing will overwrite the existing note.\n\nContinue?");
    return ok;
  }
  return true;
}

function updateStats() {
  const text = DOM.noteText.value;
  const chars = text.length;

  const words = text.trim().length === 0
    ? 0
    : text.trim().split(/\s+/).length;

  DOM.charCount.textContent = `${chars} chars`;
  DOM.wordCount.textContent = `${words} words`;
}

function saveNote(title, text) {
  if (!state.currentNoteTitle) {
    state.currentNoteTitle = title;
    state.currentNoteText = text;
    lockTitle();
  }
  let saveDate = new Date().toGMTString()
  let recent = getRecent();
  recent = recent.filter(item => item.title !== title);
  recent.unshift({title, text, saveDate});
  setRecent(recent);
  DOM.lastSave.style.display = "block";
  DOM.noteSaveDate.textContent = new Date(saveDate).toLocaleString();
  renderRecent();
}

function loadNote(title, text, saveDate) {
  DOM.noteText.value = text;
  DOM.noteTitle.value = title;
  state.currentNoteTitle = title;
  state.currentNoteText = text;
  lockTitle();
  DOM.form.scrollIntoView({ behavior: "smooth" });
  DOM.lastSave.style.display = "block";
  DOM.noteSaveDate.textContent = new Date(saveDate).toLocaleString();
  updateStats();
}

function removeNote(title) {
  const ok = confirm("Are you sure you want to remove this note?");
  if (ok) {
    let recent = getRecent();
    recent = recent.filter(item => !(item.title===title));
    setRecent(recent);
    if (state.currentNoteTitle === title) {
      unlockTitle();
    }
    renderRecent();
  }
}

function removeAllNotes() {
  const ok = confirm("Are you sure you want to remove all notes? This action cannot be undone.");
  if (ok) {
    setRecent([]);
    unlockTitle();
    renderRecent();
  }
}

function copyNote() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(DOM.noteText.value);
  }
}


function createRecentItem(item, maxLimit) {
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

  return { li, spanTitle, spanRemove };
}

function attachRecentEvents(item, spanTitle, spanRemove) {
  spanRemove.addEventListener("click", () => {
    removeNote(item.title);
  });
  spanTitle.addEventListener("click", () => {
    loadNote(item.title, item.text, item.saveDate);
  });
}

function renderRecent(){
  const nowDate = new Date();
  const recent = getRecent();
  DOM.recentItems.innerHTML="";
  let maxLimit = DOM.recentItems.offsetWidth  / 10;
  recent.forEach(item=>{
    
    
    DOM.recentItems.appendChild(li);
  });

  DOM.exportButton.style.display = recent.length ? "inline-block" : "none";
  DOM.removeAllButton.style.display = recent.length ? "inline-block" : "none";
}


DOM.form.addEventListener("submit", function(e) {
  e.preventDefault();
  if (validateForm()) {
    saveNote(DOM.noteTitle.value.trim(), DOM.noteText.value);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  renderRecent();
  DOM.autoSave.checked = getAutoSave() === "true";
  const recent = getRecent();
  if (recent.length > 0) {
    loadNote(recent[0].title, recent[0].text, recent[0].saveDate);
  }
});

DOM.noteText.addEventListener("input", () => {
  updateStats();
  if (DOM.autoSave.checked){
    if (!state.currentNoteTitle) {
      const ok = validateForm();
      if (ok) {
        saveNote(DOM.noteTitle.value.trim(), DOM.noteText.value);
      }
      else {
        DOM.autoSave.checked = false;
        alert("Auto-save was turned off because the note was not saved.\nYou can turn it back later.")
      }
    }
    else {
      saveNote(DOM.noteTitle.value.trim(), DOM.noteText.value);
    }
  }
});

DOM.autoSave.addEventListener("change", () => {
  setAutoSave(DOM.autoSave.checked);
})

DOM.newNoteButton.addEventListener("click", () => {
  DOM.noteTitle.value = "";
  DOM.noteText.value = "";
  DOM.noteSaveDate.textContent = "";
  DOM.lastSave.style.display = "none";
  updateStats();
  unlockTitle();
  DOM.noteTitle.focus();
});

DOM.copyNoteButton.addEventListener("click", copyNote);

DOM.exportButton.addEventListener("click", () => {
  const data = getRecent();
  if (!data) {
    alert("No recent data to export.");
    return;
  }
  let fileName = prompt("File Name:", "nanote-recent.json").trim();
  fileName = fileName.replaceAll(" ", "-");
  if (!fileName) {
    fileName = "nanote-recent.json";
  }
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
});

DOM.importButton.addEventListener("click", () => {
  const recent = getRecent();
  if (recent.length > 0) {
    const ok = confirm(
    "Importing will REPLACE current recent notes.\nThis action is NOT reversible.\n\nContinue?");
    if (ok) DOM.recentFile.click();
  }
  else {
    DOM.recentFile.click();
  }
  
});

DOM.removeAllButton.addEventListener("click", removeAllNotes);

DOM.noteTitle.addEventListener("input", () => {
  DOM.noteTitle.setCustomValidity("");
});

DOM.recentFile.addEventListener("change", () => {
  const file = DOM.recentFile.files[0];
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
      setRecent(parsed);
      renderRecent();
      if (parsed.length > 0) {
        loadNote(parsed[0].title, parsed[0].text, parsed[0].saveDate);
      }
      alert("Recent notes imported successfully.");
    } catch {
      alert("Invalid recent data file.");
    }
    DOM.recentFile.value = "";
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
    const reg = await navigator.serviceWorker.register("service-worker.js");

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
  DOM.installBanner.style.display = "none";
  console.log("PWA installed");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  // Save the event
  deferredPrompt = event;

  if (!isInstalled) {
    DOM.installBanner.style.display = "block";
  }
});

DOM.installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  console.log("User choice:", outcome);

  deferredPrompt = null;
  DOM.installBanner.style.display = "none";
});

DOM.closeInstallButton.addEventListener("click", () => {
  DOM.installBanner.style.display = "none";
});

DOM.downloadNoteButton.addEventListener("click", downloadNote);

DOM.openNoteButton.addEventListener("click", () => {
  DOM.openFileInput.click();
});

DOM.openFileInput.addEventListener("change", () => {
  const file = DOM.openFileInput.files[0];
  if (!file) return;
  openNoteFromFile(file);
  DOM.openFileInput.value = "";
});

DOM.previewToggleButton.addEventListener("click", togglePreview);