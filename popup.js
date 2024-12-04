const radioButtons = document.querySelectorAll('input[name="model"]');
const nanoDesc = document.getElementById("nano-description");
const proDesc = document.getElementById("pro-description");

radioButtons.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "nano") {
      nanoDesc.classList.add("active");
      proDesc.classList.remove("active");
    } else {
      proDesc.classList.add("active");
      nanoDesc.classList.remove("active");
    }

    chrome.storage.sync.set({ model: e.target.value }, () => {
      console.log("Model updated to:", e.target.value);
    });
  });
});

let modelSelect = document.querySelector('input[name="model"]:checked');
let languageSelect = document.getElementById("language");

// Initial load of values from storage
chrome.storage.sync.get(["model", "language"], ({ model, language }) => {
  console.log("Loading initial values - Model:", model, "Language:", language);

  if (model) {
    const radioButton = document.querySelector(
      `input[name="model"][value="${model}"]`
    );
    if (radioButton) {
      radioButton.checked = true;
      radioButton.dispatchEvent(new Event("change"));
    }
  }

  if (language) {
    languageSelect.value = language;
  }
});

// Listen for changes in storage and update UI
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.model) {
      console.log("Model changed in storage:", changes.model.newValue);
      const radioButton = document.querySelector(
        `input[name="model"][value="${changes.model.newValue}"]`
      );
      if (radioButton) {
        radioButton.checked = true;
        radioButton.dispatchEvent(new Event("change"));
      }
    }
    if (changes.language) {
      console.log("Language changed in storage:", changes.language.newValue);
      languageSelect.value = changes.language.newValue;
    }
  }
});

// Listen for user changes to language select
languageSelect.addEventListener("change", (e) => {
  const newLanguage = e.target.value;
  chrome.storage.sync.set({ language: newLanguage }, () => {
    console.log("Language updated to:", newLanguage);
  });
});
