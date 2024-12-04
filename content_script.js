let shiftStartTime = null;
let currentHoveredLink = null;
let port = null;
let previewElement = null;

// Track when shift is pressed/released
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !shiftStartTime) {
    shiftStartTime = Date.now();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    shiftStartTime = null;
  }
});

// Track link hover
document.addEventListener("mouseover", (e) => {
  let link = e.target.closest("a");
  if (link) {
    currentHoveredLink = link;
    checkShiftHold();
  }
});

document.addEventListener("mouseout", (e) => {
  if (e.target.closest("a")) {
    currentHoveredLink = null;
    if (port) {
      port.disconnect();
      port = null;
    }
    // remove preview element
    if (previewElement) {
      previewElement.remove();
      previewElement = null;
    }
  }
});

// Check if shift has been held long enough
function checkShiftHold() {
  if (shiftStartTime && currentHoveredLink) {
    const heldDuration = Date.now() - shiftStartTime;
    if (heldDuration >= 100 && !port) {
      initializeConnection();
    }
  }
}

// Create connection and handle messages
async function initializeConnection() {
  if (port) {
    console.log("Already connected");
    return;
  }

  const uuid = crypto.randomUUID();

  port = chrome.runtime.connect({ name: uuid });
  console.log("Connected to background");

  port.postMessage({
    type: "urlSummaryRequested",
    url: currentHoveredLink.href,
  });

  console.log("Sent message to background:", {
    type: "urlSummaryRequested",
    url: currentHoveredLink.href,
  });

  createPreviewElement(null);

  port.onMessage.addListener((response) => {
    if (response.type === "urlOgImageResult") {
      updateImageUrl(response.ogImage);
    }
    if (response.type === "urlSummaryResult") {
      updateSummary(response.summary);
    }
    console.log("Received response:", response);
  });
}

function updateSummary(summary) {
  if (previewElement) {
    const summaryEl = previewElement.querySelector("#chr-link-preview-summary");
    const skeletonEl = previewElement.querySelector(
      "#chr-link-preview-summary-skeleton"
    );

    if (summaryEl) {
      summaryEl.innerHTML = marked.parse(summary);
      summaryEl.style.opacity = "1";
      skeletonEl.style.opacity = "0";
      skeletonEl.style.display = "none";
    }
  }
}

function updateImageUrl(ogImageUrl) {
  if (previewElement) {
    previewElement.querySelector("img").src = ogImageUrl;
  }
  if (!ogImageUrl) {
    const container = previewElement.querySelector(
      "#chr-link-preview-container"
    );
    if (container) {
      container.style.display = "none";
    }
  }
}

function createPreviewElement(ogImageUrl) {
  if (!previewElement) {
    // Create wrapper with isolated styles
    previewElement = document.createElement("div");
    previewElement.id = "chr-link-preview-wrapper";
    previewElement.style.all = "initial";
    previewElement.style.position = "absolute";

    // Position the wrapper below the link
    const linkRect = currentHoveredLink.getBoundingClientRect();
    previewElement.style.left = `${linkRect.left + window.scrollX}px`;
    previewElement.style.top = `${linkRect.bottom + window.scrollY + 10}px`;
    previewElement.style.zIndex = "1000000";

    // Insert custom CSS styles to sheet
    const injectedStyle = document.createElement("style");
    injectedStyle.textContent = `
      #chr-link-preview { 
        font-size: 12px;
        color: black;
      }

      #chr-link-preview ul {
        padding-inline-start: 8px;
        list-style-type: none;
      }
        
      #chr-link-preview li:not(:last-child) {
        margin-bottom: 8px;
      }
    `;
    previewElement.appendChild(injectedStyle);

    // Create the actual preview container inside the wrapper
    const previewContainer = document.createElement("div");
    previewContainer.id = "chr-link-preview";
    previewContainer.style.width = "350px";
    previewContainer.style.minHeight = "150px";
    previewContainer.style.height = "fit-content";
    previewContainer.style.backgroundColor = "#fafaf6";
    previewContainer.style.boxShadow = "0 2px 15px rgba(0,0,0,0.2)";
    previewContainer.style.borderRadius = "8px";
    previewContainer.style.overflow = "visible";
    previewContainer.style.fontFamily = "sans-serif";

    // Move the existing container creation code here
    const container = document.createElement("div");
    container.id = "chr-link-preview-container";
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "150px";
    container.style.borderRadius = "8px";

    // Create skeleton placeholder for image
    const skeleton = document.createElement("div");
    skeleton.id = "chr-link-preview-skeleton";
    skeleton.style.position = "absolute";
    skeleton.style.top = "0";
    skeleton.style.left = "0";
    skeleton.style.width = "100%";
    skeleton.style.height = "100%";
    skeleton.style.backgroundColor = "#e0e0e0";
    skeleton.style.animation = "pulse 1.5s ease-in-out infinite";

    // Create and configure image
    const img = document.createElement("img");
    img.id = "chr-link-preview-img";
    img.src = ogImageUrl;
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.opacity = "0";
    img.style.transition = "opacity 0.3s";
    img.style.borderTopLeftRadius = "8px";
    img.style.borderTopRightRadius = "8px";

    // Show image and hide skeleton when loaded
    img.onload = () => {
      img.style.opacity = "1";
      skeleton.style.opacity = "0";
      skeleton.style.display = "none";
    };

    // Create summary container
    const summaryContainer = document.createElement("div");
    summaryContainer.style.padding = "4px 8px";
    summaryContainer.style.minHeight = "0";
    summaryContainer.style.height = "fit-content";
    summaryContainer.style.overflow = "auto";
    summaryContainer.style.borderTopLeftRadius = "8px";
    summaryContainer.style.borderTopRightRadius = "8px";

    // Create summary skeleton
    const summarySkeleton = document.createElement("div");
    summarySkeleton.id = "chr-link-preview-summary-skeleton";
    summarySkeleton.style.animation = "pulse 1.5s ease-in-out infinite";
    summarySkeleton.style.borderTopLeftRadius = "8px";
    summarySkeleton.style.borderTopRightRadius = "8px";
    summarySkeleton.style.padding = "8px 0px";

    // Create three skeleton lines
    for (let i = 0; i < 3; i++) {
      const line = document.createElement("div");
      line.style.height = "16px";
      line.style.backgroundColor = "#e0e0e0";
      line.style.marginBottom = "10px";
      line.style.borderRadius = "4px";
      line.style.width = i === 2 ? "60%" : "80%";
      summarySkeleton.appendChild(line);
    }

    // Create summary content div
    const summaryContent = document.createElement("div");
    summaryContent.id = "chr-link-preview-summary";
    summaryContent.style.opacity = "0";
    summaryContent.style.transition = "opacity 0.3s";

    // Add elements to container
    container.appendChild(skeleton);
    container.appendChild(img);
    summaryContainer.appendChild(summarySkeleton);
    summaryContainer.appendChild(summaryContent);
    previewContainer.appendChild(container);
    previewContainer.appendChild(summaryContainer);
    previewElement.appendChild(previewContainer);

    // Add keyframe animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(previewElement);
  }
}

// Check shift hold duration periodically
setInterval(checkShiftHold, 100);
