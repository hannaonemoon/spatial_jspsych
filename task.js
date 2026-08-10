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

  // Edit this list to match your files
  const trials = [
    {
      artwork_id: "ART001",
      artwork_name: "ExampleWork1",
      artwork_path: "stimuli/artworks/ART001.jpeg",
      floorplan_path: "stimuli/floorplan/floorplan.jpeg"
    },
    {
      artwork_id: "ART002",
      artwork_name: "ExampleWork2",
      artwork_path: "stimuli/artworks/ART002.jpeg",
      floorplan_path: "stimuli/floorplan/floorplan.jpeg"
    }
  ];

  const randomized = jsPsych.randomization.shuffle(trials);
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
                  <img class="art-img" src="${t.artwork_path}" alt="artwork"/>
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

              const m = document.createElement("div");
              m.className = "marker";
              m.style.left = `${x}px`;
              m.style.top = `${y}px`;
              container.appendChild(m);

              clickRecord = {
                participant_response_x: x / rect.width,
                participant_response_y: y / rect.height,
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
          stimulus: `<div class="conf-wrap"><h3>Rate Your Confidence</h3></div>`,
          choices: ["Low", "Med", "High"],
          on_finish: (data) => {
            jsPsych.data.write({
              participant_id,
              session,
              researcher,
              trial_number: idx + 1,
              artwork_id: t.artwork_id,
              artwork_name: t.artwork_name,
              participant_response_x: clickRecord?.participant_response_x ?? null,
              participant_response_y: clickRecord?.participant_response_y ?? null,
              floor_rt: clickRecord?.floor_rt ?? null,
              confidence: ["Low", "Med", "High"][data.response],
              confidence_rt: data.rt / 1000
            });
          }
        }
      ]
    };
  }

  const timeline = [preload, intro];
  randomized.forEach((t, i) => timeline.push(makeFloorTrial(t, i)));
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h2>You have completed the task.</h2><p>Thank you!</p>",
    choices: ["Finish"]
  });

  jsPsych.run(timeline);
})();
