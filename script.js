const SKILL_CATALOG = [
  { name: "JavaScript", terms: ["javascript"] },
  { name: "TypeScript", terms: ["typescript"] },
  { name: "Python", terms: ["python"] },
  { name: "Java", terms: ["java"] },
  { name: "C#", terms: ["c#", "c sharp"] },
  { name: "C++", terms: ["c++", "c plus plus"] },
  { name: "React", terms: ["react"] },
  { name: "Angular", terms: ["angular"] },
  { name: "Vue", terms: ["vue"] },
  { name: "Node.js", terms: ["node.js", "nodejs"] },
  { name: "HTML", terms: ["html", "html5"] },
  { name: "CSS", terms: ["css", "css3"] },
  { name: "SQL", terms: ["sql"] },
  { name: "PostgreSQL", terms: ["postgresql", "postgres"] },
  { name: "MySQL", terms: ["mysql"] },
  { name: "MongoDB", terms: ["mongodb"] },
  { name: "REST APIs", terms: ["rest api", "rest apis", "restful api", "restful apis"] },
  { name: "GraphQL", terms: ["graphql"] },
  { name: "Git", terms: ["git"] },
  { name: "Docker", terms: ["docker"] },
  { name: "Kubernetes", terms: ["kubernetes"] },
  { name: "AWS", terms: ["aws", "amazon web services"] },
  { name: "Azure", terms: ["azure"] },
  { name: "Linux", terms: ["linux"] },
  { name: "CI/CD", terms: ["ci/cd", "continuous integration", "continuous delivery"] },
  { name: "Machine Learning", terms: ["machine learning"] },
  { name: "TensorFlow", terms: ["tensorflow"] },
  { name: "PyTorch", terms: ["pytorch"] },
  { name: "Figma", terms: ["figma"] },
  { name: "Agile", terms: ["agile"] },
];

const dropzone = document.querySelector("#dropzone");
const fileInput = document.querySelector("#file-input");
const browseButton = document.querySelector("#browse-button");
const uploadStatus = document.querySelector("#upload-status");
const statusText = document.querySelector("#status-text");
const analysisState = document.querySelector("#analysis-state");
let currentAnalysis = 0;

function setAnalysisState(message) {
  const indicator = document.createElement("span");
  indicator.className = "live-dot";
  indicator.setAttribute("aria-hidden", "true");
  analysisState.replaceChildren(indicator, document.createTextNode(` ${message}`));
}

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function renderSkills(container, skills) {
  if (skills.length === 0) {
    const emptyMessage = document.createElement("span");
    emptyMessage.className = "skill-empty";
    emptyMessage.textContent = "None detected";
    container.replaceChildren(emptyMessage);
    return;
  }

  container.replaceChildren(...skills.map((skill, index) => {
    const chip = document.createElement("span");
    chip.className = "skill-chip";
    chip.textContent = skill;
    chip.style.animationDelay = `${index * 25}ms`;
    return chip;
  }));
}

function clearResults(filename = "Upload a PDF to see your results.") {
  document.querySelector("#score-number").textContent = "—";
  document.querySelector("#score-message").textContent = "Upload a PDF to calculate a score.";
  document.querySelector("#keyword-match").textContent = "—";
  document.querySelector("#found-count").textContent = "—";
  document.querySelector("#missing-count").textContent = "—";
  document.querySelector("#file-name").textContent = filename;
  document.querySelector("#found-caption").textContent = "From your PDF";
  document.querySelector("#missing-caption").textContent = "From our keyword list";
  document.querySelector("#ring-value").style.strokeDashoffset = 2 * Math.PI * 51;
  document.querySelector("#score-ring").setAttribute("aria-label", "Resume score not available yet");
  renderSkills(document.querySelector("#found-skills"), []);
  renderSkills(document.querySelector("#missing-skills"), []);
}

function showStatus(message, hasError = false) {
  statusText.textContent = message;
  uploadStatus.classList.toggle("has-error", hasError);
}

function findSkills(resumeText) {
  const text = resumeText.toLowerCase();
  const found = [];
  const missing = [];

  for (const skill of SKILL_CATALOG) {
    const wasFound = skill.terms.some((term) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}(?=$|[^a-z0-9])`, "i");
      return pattern.test(text);
    });

    (wasFound ? found : missing).push(skill.name);
  }

  return { found, missing };
}

function estimateSections(resumeText) {
  const text = resumeText.toLowerCase();
  const sections = [
    /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(resumeText)
      || /\b(?:\+?\d[\d\s().-]{7,}\d)\b/.test(resumeText),
    /\b(experience|employment|work history|professional background)\b/.test(text),
    /\b(education|academic|university|college|bachelor|master|degree)\b/.test(text),
    /\b(skills|technical skills|technologies|competencies)\b/.test(text),
    /\b(projects|personal projects|selected projects)\b/.test(text),
    /\b(summary|profile|objective|about me)\b/.test(text),
  ];

  return Math.round((sections.filter(Boolean).length / sections.length) * 100);
}

function updateResults(filename, resumeText) {
  const { found, missing } = findSkills(resumeText);
  const keywordMatch = Math.round((found.length / SKILL_CATALOG.length) * 100);
  const sectionMatch = estimateSections(resumeText);
  const score = Math.round((keywordMatch * 0.35) + (sectionMatch * 0.65));

  document.querySelector("#score-number").textContent = score;
  document.querySelector("#score-message").textContent =
    score >= 80
      ? "Great coverage of common resume sections and keywords."
      : score >= 55
        ? "A useful foundation, with a few areas to review."
        : "Consider adding more common resume sections and skills.";
  document.querySelector("#keyword-match").textContent = `${keywordMatch}%`;
  document.querySelector("#found-count").textContent = found.length;
  document.querySelector("#missing-count").textContent = missing.length;

  const circumference = 2 * Math.PI * 51;
  const ring = document.querySelector("#ring-value");
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference * (1 - score / 100);
  document.querySelector("#score-ring").setAttribute(
    "aria-label",
    `Estimated resume score: ${score} out of 100`,
  );

  document.querySelector("#file-name").textContent = filename;
  document.querySelector("#found-caption").textContent = "Recognized in your PDF";
  document.querySelector("#missing-caption").textContent = "Not detected in your PDF";
  renderSkills(document.querySelector("#found-skills"), found);
  renderSkills(document.querySelector("#missing-skills"), missing);
}

function escapeHtmlText(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("The PDF reader did not load. Check your internet connection and try again.");
  }

  const documentTask = window.pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const pdf = await documentTask.promise;
  const pageTexts = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str || "").join(" "));
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return escapeHtmlText(pageTexts.join(" "));
}

async function handleFile(file) {
  if (!file) return;

  const requestId = ++currentAnalysis;
  const isPdf = file.name.toLowerCase().endsWith(".pdf")
    && (!file.type || ["application/pdf", "application/x-pdf", "application/octet-stream"].includes(file.type));

  if (!isPdf) {
    fileInput.value = "";
    clearResults("No results — choose a PDF resume.");
    setAnalysisState("WAITING FOR PDF");
    showStatus("That file is not a PDF. Please choose a PDF resume.", true);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    fileInput.value = "";
    clearResults("No results — choose a PDF resume.");
    setAnalysisState("WAITING FOR PDF");
    showStatus("This PDF is larger than 10 MB. Please choose a smaller file.", true);
    return;
  }

  clearResults(`Reading ${file.name}…`);
  setAnalysisState("READING PDF");
  showStatus("Reading your resume locally in this browser…");

  try {
    const text = await extractPdfText(file);
    if (requestId !== currentAnalysis) return;

    if (text.length < 20) {
      throw new Error("No readable text was found. This may be a scanned PDF; image-only PDFs are not supported.");
    }

    updateResults(file.name, text);
    setAnalysisState("ANALYSIS COMPLETE");
    showStatus("Analysis complete. Your PDF was processed in this browser and was not uploaded.");
  } catch (error) {
    if (requestId !== currentAnalysis) return;

    clearResults("No results — choose a readable PDF.");
    setAnalysisState("ANALYSIS UNAVAILABLE");
    showStatus(error.message || "We could not read this PDF. Please try a different file.", true);
  }
}

dropzone.addEventListener("click", (event) => {
  if (event.target !== browseButton) fileInput.click();
});

dropzone.addEventListener("keydown", (event) => {
  if (event.target === dropzone && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    fileInput.click();
  }
});

browseButton.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files;
  fileInput.value = "";
  handleFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
}

dropzone.addEventListener("drop", (event) => {
  handleFile(event.dataTransfer.files[0]);
});

clearResults();
