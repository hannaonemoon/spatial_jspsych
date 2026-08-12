(() => {
  let studyFinalized = false;

  // participant_id and session_date are set after prompts; captured by closure.
  let participant_id = "";
  let session_date = "";

  function saveDataAsCSV() {
    const filename = `spatial_task_${participant_id || "unknown"}_${session_date || Date.now()}.csv`;
    jsPsych.data.get().localSave("csv", filename);
  }

  function finalizeStudy(message) {
    if (studyFinalized) return;
    studyFinalized = true;
    saveDataAsCSV();
    // End the jsPsych timeline (triggers on_finish, but studyFinalized guards it).
    jsPsych.endExperiment(message);
    // Ensure the message is visible regardless of how endExperiment renders it.
    document.body.innerHTML = `<div style='padding:40px;color:white;font-family:Arial'>${message}</div>`;
  }

  const jsPsych = initJsPsych({
    on_finish: () => {
      if (!studyFinalized) {
        // Normal completion path — experiment ended naturally
        studyFinalized = true;
        saveDataAsCSV();
        document.body.innerHTML = "<div style='padding:40px;color:white;font-family:Arial'>Done. CSV downloaded.</div>";
      }
      // If studyFinalized is already true, endExperiment() called on_finish
      // after saving; no duplicate save needed.
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "9") {
      e.preventDefault();
      if (!studyFinalized) {
        finalizeStudy("Study ended early. CSV downloaded.");
      }
    }
  }, { capture: true });


  participant_id = (prompt("Participant ID:") || "").trim();
  if (!participant_id) {
    alert("Participant ID required.");
    return;
  }

  const defaultDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  session_date = (prompt("Date (YYYY-MM-DD):", defaultDate) || "").trim();
  if (!session_date) {
    alert("Date required.");
    return;
  }

  const floorplanPath = "floorplan.png";

  const artworkFiles = [
    "Argote_2of6_Small.png",
    "Argote_4of6_Small.png",
    "Argote_6of6_Small.png",
    "Caboco_2of2_Small.png",
    "Chaile_1aof4_Small.png",
    "Chaile_2of4_Small.png",
    "Dominguez_10of12_Small.png",
    "Dominguez_11of12_Small.png",
    "Dominguez_1of12_Small.png",
    "Dominguez_7of12_Small.png",
    "Dominguez_9of12_Small.png",
    "Dominiguez_6of12_Small.png",
    "Esbell_1of3_Small.png",
    "Esbell_3aof3_Small.png",
    "Gutierrez_1of8_Small.png",
    "Gutierrez_2of8_Small.png",
    "Gutierrez_4of8_Small.png",
    "Gutierrez_5of8_Small.png",
    "Hakihiiwe_12of22_Small.png",
    "Hakihiiwe_14of22_Small.png",
    "Hakihiiwe_16of22_Small.png",
    "Hakihiiwe_17of22_Small.png",
    "Hakihiiwe_4of22_Small.png",
    "Hakihiiwe_6of22_Small.png",
    "Hakihiiwe_7of22_Small.png",
    "Hakihiiwe_9of22_Small.png",
    "Halfmoon_1of1_Small.png",
    "Maravilla_1of5_Small.png",
    "Maravilla_2of5_Small.png",
    "Maravilla_3of5_Small.png",
    "Maravilla_5of5_Small.png",
    "Merida_1of1_Small.png",
    "Simpson_11of14_Small.png",
    "Simpson_13of14_Small.png",
    "Simpson_1of14_Small.png",
    "Simpson_3of14_Small.png",
    "Simpson_4of14_Small.png",
    "Simpson_7of14_Small.png",
    "Sully_1of2_Small.png",
    "Sully_2of2_Small.png",
    "Tavares_2of7_Small.png",
    "Tavares_3of7_Small.png",
    "Tavares_4of7_Small.png",
    "Tavares_6of7_Small.png",
    "Toledo_1of1_Small.png",
    "Yahuarcani_1of3_Small.png",
    "Yahuarcani_3of3_Small.png",
    "deBaca_1of1_Small.png"
  ];

  const trials = artworkFiles.map((file, i) => ({
    artwork_id: `ART${String(i + 1).padStart(3, "0")}`,
    artwork_name: file.replace(".png", ""),
    artwork_path: `artworks/${file}`,
    floorplan_path: floorplanPath
  }));

  const randomized = jsPsych.randomization.shuffle(trials);

  const images = [];
  randomized.forEach(t => images.push(t.artwork_path, t.floorplan_path));

  const preload = { type: jsPsychPreload, images };

  const intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="conf-wrap">
        <div style="max-width:800px;margin:0 auto;text-align:center;line-height:1.5">
          <h2>Memory for Artwork Locations</h2>
          <p>You will see one artwork at a time.</p>
          <p><b>Task:</b> On the museum floorplan, click where you think the artwork was located.</p>
          <p>After your click, rate your confidence: Low, Med, or High.</p>
          <p>Respond as accurately as possible. There is no time limit.</p>
        </div>
      </div>
    `,
    choices: ["Begin"]
  };

  function makeFloorTrial(t, idx) {
    let clickRecord = null;

    return {
      timeline: [
        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `
            <div class="task-wrap">
              <div class="scene">
                <div class="panel">
                  <h3>Artwork</h3>
                  <img class="art-img" src="${t.artwork_path}" alt="${t.artwork_name}"/>
                </div>
                <div class="panel">
                  <h3>Floorplan</h3>
                  <div id="map-container" class="map-container" style="position:relative;display:inline-block;">
                    <img id="map-img" class="map-img" src="${t.floorplan_path}" alt="floorplan"/>
                  </div>
                  <div class="small">Click once on the floorplan.</div>
                </div>
              </div>
            </div>
          `,
          choices: "NO_KEYS",
          data: {
            task: "spatial",
            phase: "map_click",
            artwork_id: t.artwork_id,
            artwork_name: t.artwork_name,
            artwork_path: t.artwork_path,
            trial_index: idx + 1,
            participant_id,
            session_date
          },
          on_load: () => {
            const start = performance.now();
            const map = document.getElementById("map-img");
            const container = document.getElementById("map-container");

            function clickHandler(e) {
              const rect = map.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

              const marker = document.createElement("div");
              marker.className = "marker";
              marker.style.position = "absolute";
              marker.style.width = "14px";
              marker.style.height = "14px";
              marker.style.borderRadius = "50%";
              marker.style.background = "#ff3b30";
              marker.style.border = "2px solid #fff";
              marker.style.left = `${x - 7}px`;
              marker.style.top = `${y - 7}px`;
              container.appendChild(marker);

              clickRecord = {
                participant_response_x: x / rect.width,
                participant_response_y: y / rect.height,
                floor_rt: (performance.now() - start) / 1000
              };

              map.removeEventListener("click", clickHandler);
              setTimeout(() => jsPsych.finishTrial(clickRecord), 120);
            }

            map.addEventListener("click", clickHandler);
          }
        },
        {
          type: jsPsychHtmlButtonResponse,
          stimulus: `
            <div class="conf-wrap">
              <h3>How confident are you in that location?</h3>
            </div>
          `,
          choices: ["Low", "Med", "High"],
          data: {
            task: "spatial",
            phase: "confidence",
            artwork_id: t.artwork_id,
            artwork_name: t.artwork_name,
            artwork_path: t.artwork_path,
            trial_index: idx + 1,
            participant_id,
            session_date,

          },
          on_finish: (data) => {
            data.participant_response_x = clickRecord?.participant_response_x ?? null;
            data.participant_response_y = clickRecord?.participant_response_y ?? null;
            data.floor_rt = clickRecord?.floor_rt ?? null;
            data.confidence_label = ["Low", "Med", "High"][data.response] ?? null;
          }
        }
      ]
    };
  }

  const timeline = [preload, intro];
  randomized.forEach((t, idx) => timeline.push(makeFloorTrial(t, idx)));

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<div style='padding:20px;'><h3>Spatial task complete.</h3></div>",
    choices: ["Finish"],
    data: { task: "spatial", phase: "complete", participant_id, session_date }
  });

  jsPsych.run(timeline);
})();