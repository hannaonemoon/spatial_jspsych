(() => {
  const jsPsych = initJsPsych({
    on_finish: () => {
      jsPsych.data.get().localSave("csv", `spatial_task_${Date.now()}.csv`);
      document.body.innerHTML =
        "<div style='padding:40px;color:white;font-family:Arial'>Done. CSV downloaded.</div>";
    }
  });

  const participant_id = (prompt("Participant ID:") || "").trim();
  if (!participant_id) {
    alert("Participant ID required.");
    return;
  }
  const session = (prompt("Session (default 1):", "1") || "1").trim();
  const researcher = (prompt("Researcher initials (optional):", "") || "").trim();

  const floorplanPath = "floorplan.png";

  const artworkFiles = [
    "Argote_2of6.png",
    "Argote_4of6.png",
    "Argote_6of6.png",
    "Caboco_2of2.png",
    "Chaile_1aof4.png",
    "Chaile_2of4.png",
    "Dominguez_10of12.png",
    "Dominguez_11of12.png",
    "Dominguez_1of12.png",
    "Dominguez_7of12.png",
    "Dominguez_9of12.png",
    "Dominiguez_6of12.png",
    "Esbell_1of3.png",
    "Esbell_3aof3.png",
    "Gutierrez_1of8.png",
    "Gutierrez_2of8.png",
    "Gutierrez_4of8.png",
    "Gutierrez_5of8.png",
    "Hakihiiwe_12of22.png",
    "Hakihiiwe_14of22.png",
    "Hakihiiwe_16of22.png",
    "Hakihiiwe_17of22.png",
    "Hakihiiwe_4of22.png",
    "Hakihiiwe_6of22.png",
    "Hakihiiwe_7of22.png",
    "Hakihiiwe_9of22.png",
    "Halfmoon_1of1.png",
    "Maravilla_1of5.png",
    "Maravilla_2of5.png",
    "Maravilla_3of5.png",
    "Maravilla_5of5.png",
    "Merida_1of1.png",
    "Simpson_11of14.png",
    "Simpson_13of14.png",
    "Simpson_1of14.png",
    "Simpson_3of14.png",
    "Simpson_4of14.png",
    "Simpson_7of14.png",
    "Sully_1of2.png",
    "Sully_2of2.png",
    "Tavares_2of7.png",
    "Tavares_3of7.png",
    "Tavares_4of7.png",
    "Tavares_6of7.png",
    "Toledo_1of1.png",
    "Yahuarcani_1of3.png",
    "Yahuarcani_3of3.png",
    "deBaca_1of1.png"
  ];

  const trials = artworkFiles.map((file, i) => ({
    artwork_id: `ART${String(i + 1).padStart(3, "0")}`,
    artwork_name: file.replace(".png", ""),
    artwork_path: `assets/Real/${file}`,
    floorplan_path: floorplanPath
  }));

  // Randomized presentation order
  const randomized = jsPsych.randomization.shuffle(trials);

  // Preload images
  const images = [];
  randomized.forEach(t => images.push(t.artwork_path, t.floorplan_path));

  const preload = { type: jsPsychPreload, images };

  const intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:800px;margin:0 auto;text-align:left;line-height:1.5">
        <h2>Memory for Artwork Locations</h2>
        <p>You will see one artwork at a time.</p>
        <p><b>Task:</b> On the museum floorplan, click where you think the artwork was located.</p>
        <p>After your click, rate your confidence: Low, Med, or High.</p>
        <p>Respond as accurately as possible. There is no time limit.</p>
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
                  <div id="map-container" class="map-container">
                    <img id="map-img" class="map-img" src="${t.floorplan_path}" alt="floorplan"/>
                  </div>
                  <div class="small">Click once on the floorplan.</div>
                </div>
              </div>
            </div>
          `,
          choices: "NO_KEYS",
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
              marker.style.left = `${x}px`;
              marker.style.top = `${y}px`;
              container.appendChild(marker);

              clickRecord = {
                participant_response_x: x / rect.width, // normalized [0,1]
                participant_response_y: y / rect.height, // normalized [0,1]
                floor_rt: (performance.now() - start) / 1000
              };

              map.removeEventListener("click", clickHandler);
              setTimeout(() => jsPsych.finishTrial(), 120);
            }

            map.addEventListener("click", clickHandler);
          }
        },
        {
          type: jsPsychHtmlButtonResponse,
          stimulus: `<div class="conf-wrap"><h`
