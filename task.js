const svgToDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const artworkImage = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#12243c"/>
        <stop offset="100%" stop-color="#2f5f8f"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#sky)"/>
    <circle cx="460" cy="80" r="34" fill="#f7de7c"/>
    <rect x="0" y="280" width="600" height="120" fill="#295b36"/>
    <path d="M80 320 L180 180 L280 320 Z" fill="#7b8b99"/>
    <path d="M210 320 L320 150 L430 320 Z" fill="#5c6977"/>
    <rect x="430" y="210" width="80" height="110" rx="6" fill="#c98e4b"/>
    <rect x="452" y="238" width="20" height="34" fill="#59331b"/>
    <text x="24" y="42" font-family="Arial, sans-serif" font-size="28" fill="#ffffff">Study the artwork</text>
  </svg>
`);

const mapImage = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 420">
    <rect width="700" height="420" fill="#efe5cf"/>
    <rect x="45" y="45" width="610" height="330" rx="18" fill="#f8f1de" stroke="#9d8d69" stroke-width="8"/>
    <path d="M120 320 C220 250 300 240 390 280 S560 300 610 190" fill="none" stroke="#4f83c2" stroke-width="18" stroke-linecap="round"/>
    <path d="M175 110 L255 160 L240 250 L150 270 L110 180 Z" fill="#92b96d" opacity="0.85"/>
    <path d="M430 90 L560 105 L535 220 L410 210 Z" fill="#c9a86a" opacity="0.85"/>
    <circle cx="310" cy="155" r="36" fill="#d77a61" opacity="0.85"/>
    <text x="78" y="92" font-family="Arial, sans-serif" font-size="22" fill="#4f4130">Click the remembered location</text>
  </svg>
`);

const taskHtml = `
  <div class="task-wrap">
    <div class="scene">
      <div class="panel">
        <h3>Target artwork</h3>
        <img class="art-img" src="${artworkImage}" alt="Artwork to remember" />
      </div>
      <div class="panel">
        <h3>Response map</h3>
        <div class="map-container">
          <img id="map-image" class="map-img" src="${mapImage}" alt="Map for response selection" />
          <div id="marker" class="marker" hidden></div>
        </div>
        <div class="conf-wrap">
          <p>Select the remembered location, then rate confidence.</p>
          <div>
            <button class="jspsych-btn conf-btn" data-confidence="low">Low confidence</button>
            <button class="jspsych-btn conf-btn" data-confidence="medium">Medium confidence</button>
            <button class="jspsych-btn conf-btn" data-confidence="high">High confidence</button>
          </div>
          <p id="status" class="small">No location selected.</p>
        </div>
      </div>
    </div>
  </div>
`;

const jsPsych = initJsPsych({
  on_finish() {
    jsPsych.data.displayData();
  },
});

const preload = {
  type: jsPsychPreload,
  images: [artworkImage, mapImage],
};

const instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width: 720px; margin: 0 auto; line-height: 1.5;">
      <h2>Spatial memory task</h2>
      <p>Study the artwork, then click the remembered location on the map and rate your confidence.</p>
      <p>This is a lightweight jsPsych version of the PsychoPy spatial task scaffold.</p>
    </div>
  `,
  choices: ["Begin"],
};

const spatialTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: taskHtml,
  choices: "NO_KEYS",
  on_load() {
    const mapImageElement = document.getElementById("map-image");
    const marker = document.getElementById("marker");
    const status = document.getElementById("status");
    const confidenceButtons = document.querySelectorAll(".conf-btn");
    const trialState = {
      x: null,
      y: null,
      confidence: null,
    };

    const finishIfReady = () => {
      if (trialState.x === null || trialState.confidence === null) {
        return;
      }

      jsPsych.finishTrial({
        x_pct: Number(trialState.x.toFixed(4)),
        y_pct: Number(trialState.y.toFixed(4)),
        confidence: trialState.confidence,
      });
    };

    mapImageElement.addEventListener("click", (event) => {
      const rect = mapImageElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      trialState.x = Math.min(Math.max(x, 0), 1);
      trialState.y = Math.min(Math.max(y, 0), 1);

      marker.hidden = false;
      marker.style.left = `${trialState.x * 100}%`;
      marker.style.top = `${trialState.y * 100}%`;
      status.textContent = trialState.confidence
        ? `Location selected. Confidence: ${trialState.confidence}.`
        : "Location selected. Choose a confidence rating to continue.";
      finishIfReady();
    });

    confidenceButtons.forEach((button) => {
      button.addEventListener("click", () => {
        trialState.confidence = button.dataset.confidence;
        status.textContent = trialState.x === null
          ? `Confidence set to ${trialState.confidence}. Select a location to continue.`
          : `Location selected. Confidence: ${trialState.confidence}.`;
        finishIfReady();
      });
    });
  },
};

const completion = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width: 720px; margin: 0 auto; line-height: 1.5;">
      <h2>Task complete</h2>
      <p>Your response has been recorded.</p>
    </div>
  `,
  choices: ["Finish"],
};

jsPsych.run([preload, instructions, spatialTrial, completion]);
