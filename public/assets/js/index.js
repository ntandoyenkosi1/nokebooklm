document.getElementById('file-input').addEventListener('change', handleFileSelect);
let sources = JSON.parse(localStorage.getItem("sources")) || []
let title = localStorage.getItem("title") == "undefined" ? "Tech Talk" : localStorage.getItem("title") || "Tech Talk"
document.querySelector("#summary").innerText = localStorage.getItem("summary") == "undefined" ? "No summary yet" : localStorage.getItem("summary") || "No summary yet"

document.querySelector("#perfect-title").innerText = localStorage.getItem("perfect-title") ? "No title yet" : localStorage.getItem("perfect-title") || "No title yet"
document.querySelector("#title").value = title
localStorage.setItem("title", title)
document.querySelector("#title").addEventListener("input", (e) => {
  title = e.target.value
  localStorage.setItem("title", title)
})

document.querySelector("#title").addEventListener("change", function () {
  localStorage.setItem("title", document.querySelector("#title").value)
})
function handleFileSelect(event) {
  const file = event.target.files[0];

  if (file && file.type == "application/pdf") {
    const reader = new FileReader();

    reader.onload = function (e) {
      const pdfData = new Uint8Array(e.target.result);

      // Load the PDF using pdf.js
      pdfjsLib.getDocument(pdfData).promise.then(function (pdf) {
        let textArray = '';
        const numPages = pdf.numPages;

        // Extract text from each page
        const extractTextFromPage = (pageNumber) => {
          return pdf.getPage(pageNumber).then(function (page) {
            return page.getTextContent().then(function (text) {
              // Concatenate the text from the current page
              return text.items.map(item => item.str).join(' ') + '\n';
            });
          });
        };

        // Create an array of promises for all pages
        const pagePromises = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          pagePromises.push(extractTextFromPage(pageNum));
        }

        // Wait for all pages to be processed
        Promise.all(pagePromises).then(function (pageTexts) {
          // Combine all the page texts into one variable
          textArray = pageTexts.join('');
          sources.push({ text: textArray, type: "pdf" })
          localStorage.setItem("sources", JSON.stringify(sources))
          closeModal();
          renderSources()
        }).catch(function (error) {
          console.error('Error extracting text from pages:', error);
          showError('Error extracting text from pages:')
        });


      }).catch(function (error) {
        showError('Error loading PDF. Ensure the PDF file has text.')
        console.error('Error loading PDF: ', error);
      });
    };

    reader.readAsArrayBuffer(file);
  }
  else if (file && file.type == "text/plain") {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const textData = e.target.result;
        sources.push({ text: textData, type: "text" })
        localStorage.setItem("sources", JSON.stringify(sources))
        closeModal();
        renderSources()
      };

      reader.readAsText(file);
    }
  }
  else if (file && file.type == "" && /.+/i.test(file.name)) {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        let textData = e.target.result;
        textData = textData.replace(/([*_]{1,2})(.*?)(\1)/g, '$2')
          .replace(/^#+\s*(.*)/gm, '$1')
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/!\[([^\]]+)\]\([^\)]+\)/g, '')
          .replace(/\n/g, ' ')
          .trim();
        sources.push({ text: textData, type: "markdown" })
        localStorage.setItem("sources", JSON.stringify(sources))
        closeModal();
        renderSources()
      };

      reader.readAsText(file);
    }
  }
}
// Show loader
function showLoader() {
  document.getElementById('loader').style.display = 'block';
}

// Hide loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

function openModal() {
  document.querySelector(".modal").style.display = "block"
  document.body.style.background = "rgba(0, 0, 0, .7)";
}
function closeModal() {
  document.querySelector(".modal").style.display = "none"
  document.body.style.background = "white";
}
document.querySelector(".x").addEventListener("click", function () {
  closeModal()
})
document.querySelector("#add-source").addEventListener("click", function () {
  openModal()
})
function renderSources() {
  document.querySelector("#sources").innerText = ""
  sources = JSON.parse(localStorage.getItem("sources")) || []
  sources.length != 0 ? (sources.map((x, i) => {
    let el = document.createElement("li")
    let container = document.createElement("div")
    let icon = document.createElement("img")

    const trash = document.createElement("img")
    trash.setAttribute("title", "Remove source")
    trash.src = "assets/images/trash3.svg"
    if (x?.type == "pdf") {
      icon.setAttribute("title", "Pdf file")
      icon.src = "assets/images/file-earmark-text.svg"
    }
    else if (x?.type == "text") {
      icon.setAttribute("title", "Pasted text")
      icon.src = "assets/images/window-sidebar.svg"
    }
    else if (x?.type == "youtube") {
      icon.setAttribute("title", "YouTube video")
      icon.src = "assets/images/youtube.svg"
    }
    else if (x?.type == "markdown") {
      icon.setAttribute("title", "Markdown file")
      icon.src = "assets/images/markdown.svg"
    }
    container.appendChild(icon)
    const text = document.createElement("span")
    text.innerText = `Source ${i + 1}`
    text.title = `Source ${i + 1}`
    trash.style.cursor = "pointer"
    trash.addEventListener("click", () => {
      sources = sources.filter(y => y.text != x.text)
      localStorage.setItem("sources", JSON.stringify(sources))
      renderSources()
    })
    container.appendChild(text)

    el.appendChild(container)
    el.appendChild(trash)
    document.querySelector("#sources").append(el)
  }), document.querySelector("#source-number").innerText = `${sources.length} Source(s)`
  ) : (document.querySelector("#sources").innerText = "No sources added yet", document.querySelector("#source-number").innerText = "No sources added yet")
}
renderSources()
document.querySelector("#generate-btn").addEventListener("click", function () {
  if (sources.length == 0) {
    return showError("Please add sources to begin!")
  }
  showLoader()
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    textInput: sources.map(x => x.text),
    selections: getSelections()
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  fetch("/generate", requestOptions)
    .then((response) => response.json())
    .then((result) => {
      if (result.summary && result.longTitle && result.audioContent) {
        localStorage.setItem("audio", result.audioContent)
        localStorage.setItem("summary", result.summary)
        localStorage.setItem("perfect-title", result.longTitle)
        document.querySelector("#summary").innerText = result.summary
        document.querySelector("#perfect-title").innerText = result.longTitle
        const audioEl = document.createElement("audio")
        audioEl.setAttribute("controls", "")

        audioEl.src = `data:audio/mp3;base64,${result.audioContent}`;
        document.querySelector(".audio-player").innerText = ""
        document.querySelector(".audio-player").appendChild(audioEl)
        hideLoader()
      }
      else {
        showError("An error occured while generating your audio from the server.")
        hideLoader()
        // error
      }
    })
    .catch((error) => {
      showError("An error occured while generating your audio from the server. There was an issue with the request.")
      console.error(error)
      hideLoader()
    })
})

function loadAudio() {
  const audio = localStorage.getItem("audio")
  audio ? document.querySelector('audio').src = `data:audio/mp3;base64,${audio}` : document.querySelector(".audio-player").innerText = "Generated audio overview will show here";
}
loadAudio()
function loadVoiceOptions(e) {
  e.preventDefault()
  const speakers = document.querySelector(".voice-column")
  speakers.style.display == "flex" ? (speakers.style.display = "none", document.querySelector("#advanced-options > img").style.src = "assets/images/caret-up.svg") : (speakers.style.display = "flex", document.querySelector("#advanced-options > img").style.src = "assets/images/caret-up.svg")
}
document.querySelector("#advanced-options").addEventListener("click", (e) => {
  loadVoiceOptions(e)
})

function getSelections() {
  const voice1 = document.querySelector("#speaker1-voice")
  const voice2 = document.querySelector("#speaker2-voice")
  const voice3 = document.querySelector("#speaker3-voice")
  const name1 = document.querySelector("#speaker1-name")
  const name2 = document.querySelector("#speaker2-name")
  const name3 = document.querySelector("#speaker3-name")
  title = localStorage.getItem("title")
  return { voice1: voice1.value, voice2: voice2.value, voice3: voice3.value, name1: name1.value, name2: name2.value, name3: name3.value, title: title }
}

document.querySelector("#pasted-text").addEventListener("click", () => {
  // activate the pasting modal
  document.querySelector("textarea").value = ""
  document.querySelector("#paste-text-modal h2").innerText = ""
  document.querySelector("textarea").placeholder = "Paste text to include in the discussion"
  document.querySelector("#paste-text-modal").style.display = "flex"
  document.querySelector("#paste-text-modal button").setAttribute("text-type", "text")
  document.querySelector("textarea").maxLength = "10000000"
  document.querySelector("textarea").removeEventListener("input", validateYouTubeUrl)
  document.querySelector("textarea").removeEventListener("paste", validateYouTubeUrl)
  validationStatus.innerText = ''
  closeModal()
  document.body.style.background = "rgba(0, 0, 0, .7)";
})
document.querySelector("#youtube-text").addEventListener("click", () => {
  document.querySelector("#paste-text-modal").style.display = "flex"
  document.querySelector("#paste-text-modal h2").innerText = "Paste YouTube url below"
  document.querySelector("#paste-text-modal button").setAttribute("text-type", "youtube")
  document.querySelector("textarea").placeholder = "Paste YouTube URL here"
  document.querySelector("textarea").value = ""
  document.querySelector("textarea").maxLength = "100"
  closeModal()
  const youtubeInput = document.getElementById('youtubeInput');
  document.body.style.background = "rgba(0, 0, 0, .7)";
  youtubeInput.addEventListener('input', validateYouTubeUrl);
})

document.querySelector("#paste-text-modal button").addEventListener("click", () => {
  closeModal()
  const textType = document.querySelector("#paste-text-modal button").getAttribute("text-type")
  const text = document.querySelector("textarea").value
  if (textType == "text" && text) {
    const existingSources = JSON.parse(localStorage.getItem("sources")) || []
    existingSources.push({ type: "text", text })
    localStorage.setItem("sources", JSON.stringify(existingSources))
    renderSources()
    document.querySelector("#paste-text-modal").style.display = "none"
  }
  else if (textType == "youtube" && text) {
    let hostname = window.location.hostname
    if (hostname != "localhost" && hostname != "127.0.0.1") {
      showError("This functionality is currently disabled in production. Reloading soon")
      //setTimeout(()=>window.location.reload(),3000)
      return window.location.reload()
    }
    if (!/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(text)) {
      document.querySelector("#paste-text-modal").style.display = "none"
      return showError("Invalid YouTube URL. Try again!")
    }
    showLoader()
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "videoUrl": text.trim()
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch("/transcribe", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        const existingSources = JSON.parse(localStorage.getItem("sources")) || []
        const transcript = result?.transcript
        existingSources.push({ type: "youtube", text: transcript })
        localStorage.setItem("sources", JSON.stringify(existingSources))
        hideLoader()
        renderSources()
        document.querySelector("#paste-text-modal").style.display = "none"
      })
      .catch((error) => {
        showError("An error occured with the provided video link")
        console.error(error)
      });
  }
  document.querySelector("#paste-text-modal").style.display = "none"
})
function showError(message = 'Error: Something went wrong!') {
  const container = document.getElementById('errorContainer');
  const countdownText = document.getElementById('countdownText');
  let seconds = 5;

  // Reset previous timers
  clearTimeout(window.errorTimeout);
  clearInterval(window.countdownInterval);

  // Update message and show
  container.querySelector('.error-message').textContent = `⚠️ ${message}`;
  container.style.display = 'block';

  // Trigger countdown bar animation
  setTimeout(() => {
    document.querySelector('.countdown-bar').style.transform = 'scaleX(0)';
  }, 10);

  // Update countdown text
  countdownText.textContent = seconds;
  window.countdownInterval = setInterval(() => {
    seconds--;
    countdownText.textContent = seconds;
  }, 1000);

  // Hide after 5 seconds
  window.errorTimeout = setTimeout(() => {
    container.style.display = 'none';
    clearInterval(window.countdownInterval);
    countdownText.textContent = '5';
    document.querySelector('.countdown-bar').style.transform = 'scaleX(1)';
  }, 5000);
}
const youtubeInput = document.getElementById('youtubeInput');
const validationStatus = document.getElementById('validationStatus');
const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

function validateYouTubeUrl() {
  const input = youtubeInput.value.trim();
  const isValid = youtubeRegex.test(input);

  youtubeInput.classList.toggle('invalid', !isValid);

  if (input === '') {
    validationStatus.textContent = '';
    youtubeInput.classList.remove('invalid');
  } else {
    validationStatus.textContent = isValid
      ? '✓ Valid YouTube URL'
      : '⚠ Invalid YouTube URL';
    validationStatus.style.color = isValid ? '#4CAF50' : '#ff4444';
  }
}

document.querySelector(".reset").addEventListener("click", () => {
  localStorage.clear()
  document.location.reload()
})