const CONFIG = {
  STORAGE_KEYS: {
    RECENT: "recentNotes",
    AUTO_SAVE: "autoSave",
  },

  LIMITS: {
    TITLE_MAX_LENGTH: 24,
    RECENT_TITLE_RATIO: 10,
  },

  FILE: {
    DEFAULT_FILE_NAME: "nanote",
    EXPORT_FILE_NAME: "nanote-recent.json",
    FALLBACK_MIME: "application/octet-stream",
    MIME_TYPES: {
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
    },
  },

  FEEDBACK: {
    SUCCESS: {
      SAVE: '<i class="fa-solid fa-check"></i> Saved',
      COPY: '<i class="fa-solid fa-check"></i> Copied',
      DOWNLOAD: '<i class="fa-solid fa-check"></i> Downloaded',
      EXPORT: '<i class="fa-solid fa-check"></i> Exported',
      IMPORT: '<i class="fa-solid fa-check"></i> Imported',
      NEW: '<i class="fa-solid fa-sparkles"></i> New',
      CLEAR: '<i class="fa-solid fa-eraser"></i> Cleared',
      REMOVE: '<i class="fa-solid fa-broom"></i> Removed',
      DONE: '<i class="fa-solid fa-check"></i> Done'
    },

    ERROR: {
      GENERIC: '<i class="fa-solid fa-xmark"></i> Error',
    },

    CANCEL: {
      DEFAULT: '<i class="fa-solid fa-ban"></i> Canceled',
    }
  },

  MESSAGES: {
    CONFIRM_CLEAR: "Are you sure you want to clear the current note text?",
    CONFIRM_OVERWRITE: "A note with this title already exists.\nContinuing will overwrite the existing note.\n\nContinue?",
    CONFIRM_REMOVE: "Are you sure you want to remove this note?",
    CONFIRM_REMOVE_ALL: "Are you sure you want to remove all notes? This action cannot be undone.",
    CONFIRM_IMPORT: "Importing will REPLACE current recent notes.\nThis action is NOT reversible.\n\nContinue?",
    AUTO_SAVE_DISABLED: "Auto-save was turned off because the note was not saved.\nYou can turn it back later.",
    EXPORT_EMPTY: "No recent data to export.",
    IMPORT_SUCCESS: "Recent notes imported successfully.",
    IMPORT_ERROR: "Invalid recent data file.",
    UPDATE_AVAILABLE: "A new version is available. Reload now?",
  },

}


const DOM = {
  form: document.getElementById("note-form"),
  noteText: document.getElementById("note-text"),
  noteTitle: document.getElementById("note-title"),
  lastSave: document.getElementById("last-save"),
  noteSaveDate: document.getElementById("note-save-date"),
  autoSave: document.getElementById("auto-save"),
  recentItems: document.getElementById("recent-items"),
  saveNoteButton: document.getElementById("save-note"),
  clearNoteButton: document.getElementById("clear-note"),
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
  readingTime: document.getElementById("reading-time"),
  previewToggleButton: document.getElementById("preview-toggle"),
  markdownPreview: document.getElementById("markdown-preview"),
}

const state = {
  currentNoteText: null,
  currentNoteTitle: null,
  previewMode: false,
}

function getFileBaseName(filename) {
  const parts = filename.split(".");
  
  if (parts.length <= 1) {
    return filename;
  }

  return parts.slice(0, -1).join(".");
}

function showAlert(text, options = {}) {
  return Swal.fire({
    icon: options.icon || "info",
    text,
    confirmButtonText: options.confirmText || "OK",
  });
}

function showConfirm(text, options = {}) {
  return Swal.fire({
    icon: options.icon || "warning",
    text,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "OK",
    cancelButtonText: options.cancelText || "Cancel"
  });
}

function showPrompt(title, defaultValue = "", options = {}) {
  return Swal.fire({
    title,
    input: "text",
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "OK",
    cancelButtonText: options.cancelText || "Cancel"
  });
}

function showButtonFeedback(button, message, type = "success", timeout = 1200) {
  if (!button) return;
  
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.innerHTML;
  }

  button.classList.add("button-feedback", type);
  button.innerHTML = message;

  setTimeout(() => {
    button.innerHTML = button.dataset.originalText;
    button.classList.remove("success", "error", "cancel");
  }, timeout);
}

function getRecent() {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT) || "[]");
}

function setRecent(data) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT, JSON.stringify(data));
}

function getAutoSave() {
  return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTO_SAVE);
}

function setAutoSave(value) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.AUTO_SAVE, value);
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
    DOM.previewToggleButton.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
  } else {
    DOM.markdownPreview.style.display = "none";
    DOM.noteText.style.display = "block";
    DOM.previewToggleButton.innerHTML = '<i class="fa-regular fa-eye"></i> MD Preview';
  }
}


function openNoteFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const content = reader.result;
    DOM.noteText.value = content;
    const name = getFileBaseName(file.name);
    DOM.noteTitle.value = name;
    unlockTitle();
    DOM.noteSaveDate.textContent = "";
    DOM.lastSave.style.display = "none";
    updateStats();
    if (state.previewMode) {
      renderMarkdown();
    }
    showButtonFeedback(DOM.openNoteButton, CONFIG.FEEDBACK.SUCCESS.DONE);
  };

  reader.readAsText(file);
}

function getMimeType(ext) {
  return CONFIG.FILE.MIME_TYPES[ext] || CONFIG.FILE.FALLBACK_MIME;
}

function downloadNote() {
  const title = DOM.noteTitle.value.trim() || CONFIG.FILE.DEFAULT_FILE_NAME;
  const text = DOM.noteText.value;
  const defaultName =
    (title.replace(/\s+/g, "_") || CONFIG.FILE.DEFAULT_FILE_NAME) + ".txt";
  showPrompt(
    "File Name:",
    defaultName
  )
  .then(result => {
    if (!result.isConfirmed || !result.value) {
      showButtonFeedback(
        DOM.downloadNoteButton,
        CONFIG.FEEDBACK.CANCEL.DEFAULT,
        "cancel"
      );

      return;
    }
    const cleanName = result.value.trim();
    const parts = cleanName.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
    const mime = getMimeType(ext);
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = cleanName;
    a.click();
    URL.revokeObjectURL(a.href);
    showButtonFeedback(DOM.downloadNoteButton, CONFIG.FEEDBACK.SUCCESS.DONE);
  });
}

function lockTitle() {
  DOM.noteTitle.disabled = true;
}

function unlockTitle() {
  DOM.noteTitle.disabled = false;
  state.currentNoteText = null;
  state.currentNoteTitle = null;
}


function truncateTitle(title, maxLength = CONFIG.LIMITS.TITLE_MAX_LENGTH) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function validateForm(callback) {
  const titleText = DOM.noteTitle.value.trim();
  if (titleText.length === 0) {
    DOM.noteTitle.setCustomValidity("please fill out this field");
    DOM.noteTitle.reportValidity();
    callback(false);
    return;
  }
  DOM.noteTitle.setCustomValidity("");
  let recent = getRecent();
  recent = recent.filter(item => item.title === titleText);
  if (recent.length > 0 && !state.currentNoteTitle) {
    showConfirm(CONFIG.MESSAGES.CONFIRM_OVERWRITE)
    .then(result => {
      callback(result.isConfirmed);
    });
  }
  else {
    callback(true);
  }
}

function updateStats() {
  const text = DOM.noteText.value;
  const chars = text.length;

  const words = text.trim().length === 0
    ? 0
    : text.trim().split(/\s+/).length;
  
  const readingMinutes = Math.max(1, Math.ceil(words / 200));

  DOM.charCount.textContent = `${chars} chars`;
  DOM.wordCount.textContent = `${words} words`;
  DOM.readingTime.textContent = words === 0 ? "0 min read" : `${readingMinutes} min read`;
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
  if (state.previewMode) {
    renderMarkdown();
  }
}

function removeNote(title) {
  showConfirm(CONFIG.MESSAGES.CONFIRM_REMOVE)
  .then(result => {
    if (result.isConfirmed) {
      let recent = getRecent();
      recent = recent.filter(item => !(item.title===title));
      setRecent(recent);
      if (state.currentNoteTitle === title) {
        unlockTitle();
      }
      renderRecent();
    }
  });
}

function removeAllNotes() {
  showConfirm(CONFIG.MESSAGES.CONFIRM_REMOVE_ALL)
  .then(result => {
    if (result.isConfirmed) {
      setRecent([]);
      unlockTitle();
      renderRecent();
      showButtonFeedback(DOM.removeAllButton, CONFIG.FEEDBACK.SUCCESS.REMOVE);
    }
    else {
      showButtonFeedback(DOM.removeAllButton, CONFIG.FEEDBACK.CANCEL.DEFAULT, "cancel");
    }
  });
}

function copyNote() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(DOM.noteText.value)
    .then(() => showButtonFeedback(DOM.copyNoteButton, CONFIG.FEEDBACK.SUCCESS.COPY))
    .catch(() => showButtonFeedback(DOM.copyNoteButton, CONFIG.FEEDBACK.ERROR.GENERIC, "error"));
  }
  else {
    showButtonFeedback(DOM.copyNoteButton, CONFIG.FEEDBACK.ERROR.GENERIC, "error");
  }
}

function clearNote() {
  showConfirm(CONFIG.MESSAGES.CONFIRM_CLEAR)
  .then(result => {
    if (!result.isConfirmed) {
      showButtonFeedback(DOM.clearNoteButton, CONFIG.FEEDBACK.CANCEL.DEFAULT, "cancel");
      return;
    }
    DOM.noteText.value = "";

    if (state.previewMode) {
      renderMarkdown();
    }
    updateStats();
    showButtonFeedback(DOM.clearNoteButton, CONFIG.FEEDBACK.SUCCESS.CLEAR);
  });
}


function createRecentItem(item, maxLimit) {
  const nowDate = new Date();
  const li = document.createElement("li");
  const spanTitle = document.createElement("span");
  const spanRemove = document.createElement("span");
  const spanSaveDate = document.createElement("span");
  spanTitle.textContent = truncateTitle(item.title, maxLimit);
  spanTitle.className = "recent-title";
  spanRemove.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
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
  const recent = getRecent();
  DOM.recentItems.innerHTML="";
  let maxLimit = DOM.recentItems.offsetWidth  / CONFIG.LIMITS.RECENT_TITLE_RATIO;
  recent.forEach(item=>{
    const { li, spanTitle, spanRemove } = createRecentItem(item, maxLimit);
    attachRecentEvents(item, spanTitle, spanRemove)
    DOM.recentItems.appendChild(li);
  });
  DOM.exportButton.style.display = recent.length ? "inline-block" : "none";
  DOM.removeAllButton.style.display = recent.length ? "inline-block" : "none";
}

function resetCurrentNote() {
  DOM.noteTitle.value = "";
  DOM.noteText.value = "";
  DOM.noteSaveDate.textContent = "";
  DOM.lastSave.style.display = "none";
  unlockTitle();
  updateStats();
  if (state.previewMode) {
    renderMarkdown();
  }
}


DOM.form.addEventListener("submit", function(e) {
  e.preventDefault();
  validateForm(ok => {
    if (ok) {
      saveNote(DOM.noteTitle.value.trim(), DOM.noteText.value);
      showButtonFeedback(DOM.saveNoteButton, CONFIG.FEEDBACK.SUCCESS.SAVE);
    }
    else {
      showButtonFeedback(DOM.saveNoteButton, CONFIG.FEEDBACK.ERROR.GENERIC, "error");
    }
  });
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
      validateForm(ok => {
        if (ok) {
          saveNote(DOM.noteTitle.value.trim(), DOM.noteText.value);
        }
        else {
          DOM.autoSave.checked = false;
          showAlert(CONFIG.MESSAGES.AUTO_SAVE_DISABLED, {icon: "warning"});
        }
      });
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
  resetCurrentNote();
  DOM.noteTitle.focus();
  showButtonFeedback(DOM.newNoteButton, CONFIG.FEEDBACK.SUCCESS.NEW);
});

DOM.copyNoteButton.addEventListener("click", copyNote);
DOM.clearNoteButton.addEventListener("click", clearNote);

DOM.exportButton.addEventListener("click", () => {
  const data = getRecent();
  if (!data) {
    showButtonFeedback(DOM.exportButton, CONFIG.FEEDBACK.ERROR.GENERIC, "error");
    showAlert(CONFIG.MESSAGES.EXPORT_EMPTY, {icon: "error"});
    return;
  }
  showPrompt(
    "File Name:",
    CONFIG.FILE.EXPORT_FILE_NAME
  )
  .then(result => {
    if (!result.isConfirmed) {
      showButtonFeedback(
        DOM.exportButton,
        CONFIG.FEEDBACK.CANCEL.DEFAULT,
        "cancel"
      );

      return;
    }
    let fileName = result.value.trim();
    fileName = fileName.replaceAll(" ", "-");
    if (!fileName) {
      fileName = CONFIG.FILE.EXPORT_FILE_NAME;
    }
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    showButtonFeedback(DOM.exportButton, CONFIG.FEEDBACK.SUCCESS.EXPORT);
  });
});

DOM.importButton.addEventListener("click", () => {
  const recent = getRecent();
  if (recent.length > 0) {
    showConfirm(CONFIG.MESSAGES.CONFIRM_IMPORT)
    .then(result => {
      if (result.isConfirmed) {
        DOM.recentFile.click();
      }
      else {
        showButtonFeedback(DOM.importButton, CONFIG.FEEDBACK.CANCEL.DEFAULT, "cancel");
      }
    });
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
  if (!file) {
    showButtonFeedback(
      DOM.importButton,
      CONFIG.FEEDBACK.CANCEL.DEFAULT,
      "cancel"
    );
    return;
  }
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
      showAlert(CONFIG.MESSAGES.IMPORT_SUCCESS, {icon: "success"});
      showButtonFeedback(DOM.importButton, CONFIG.FEEDBACK.SUCCESS.IMPORT);
    } catch {
      showAlert(CONFIG.MESSAGES.IMPORT_ERROR, {icon: "error"});
      showButtonFeedback(DOM.importButton, CONFIG.FEEDBACK.ERROR.GENERIC, "error");
    }
    DOM.recentFile.value = "";
  };
  reader.readAsText(file);
});
window.addEventListener("resize", renderRecent);

function showUpdateAlert(registration) {
  if (!registration.waiting) return;
  showConfirm(
    CONFIG.MESSAGES.UPDATE_AVAILABLE,
    {
    icon: "info",
    confirmText: "Reload"
    }
  )
  .then(result => {
    if (result.isConfirmed) {
      registration.waiting.postMessage({
        type: "SKIP_WAITING"
      });
    }
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("service-worker.js");

    if (reg.waiting) {
      showUpdateAlert(reg);
    }

    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller && reg.waiting) {
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

document.addEventListener("keydown", (event) => {
  const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
  if (!isSaveShortcut) {
    return;
  }
  event.preventDefault();
  DOM.form.requestSubmit();
});
