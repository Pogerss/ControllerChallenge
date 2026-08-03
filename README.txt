Roller Challenge v12.0 - Authored Combat Flow Scenarios

Combat Flow Drill:
- Replaces arbitrary movement-pattern and mechanic pairing with ten authored,
    repeatable FPS situations selected directly from the Drill queue.
- Each situation moves continuously through establish, pressure, and recovery
    phases using smooth keyframe interpolation with seamless cycle boundaries.
- Shared Combat difficulty scales phase timing, movement speed, path range,
    edge usage, correction speed, tracking tolerance, and thumb independence.
- Reuses the existing Combat motion updater, scoring, HUD, arrows, Drill
    lifecycle, transitions, and results without contact-to-complete behavior.
- Avoids immediate scenario repeats and consecutive scenario families.

Roller Challenge v11.9 - Combat Flow Drill

Combat Flow Drill:
- Combines one shared Strafe Pattern with one existing Combat mechanic.
- Keeps left-stick movement, timing, and rhythm separate from right-stick aim,
    thumb relationship, pressure lesson, and coaching cue.
- Avoids immediate pattern, mechanic, and exact-combination repeats.
- Difficulty scales pattern and mechanic speed, pressure range, path size, edge
    usage, thumb independence, and tolerance without adding randomness.
- Reuses the Combat updater, scoring, HUD, Drill transitions, and results.

Roller Challenge v11.8 - Strafe Challenge

Combat Drill:
- Combines one left-stick movement pattern with one existing Combat mechanic.
- Adds Wide Strafe, Tight Strafe, Long Hold, Delayed Switch, Burst Strafe,
    Rhythm Break, Strafe Recovery, Pressure Carry, and Reverse Pressure patterns.
- Keeps movement timing and pressure independent from the mechanic's right-stick
    behavior, thumb relationship, aim lesson, and coaching cue.
- Avoids immediate movement-pattern, mechanic, and exact-combination repeats.
- Reuses the Combat updater, continuous scoring, HUD, transitions, and results.

Strafe Challenge:
- Adds Wide Strafe, Tight Strafe, Long Hold, Delayed Switch, Strafe Recovery,
  Pressure Carry, Reverse Pressure, Burst Strafe, Counter Pressure, and
  Movement Priority.
- Selects only continuous Combat mechanics tagged with the Strafe family.
- Reuses Combat movement, time-based scoring, transitions, HUD, coaching cues,
  results, and snapping without changing existing Challenge or Practice pools.
- Prevents immediate mechanic repeats, including across shuffled queue boundaries.

Roller Challenge v11.6 - Results Repair and Shared Combat Difficulty

Results repair:
- Restores a four-slot supporting grid: Accuracy, Session Pace, Longest Combo,
    and On-Target Time beneath the prominent Score result.
- Keeps Avg Transition hidden, restores the START/B controller hint, clears
    completed mechanic text, and allows the card to scroll on short viewports.
- Results finalize once, freeze score updates, restart the completed activity
    with START, and close with B / Circle.

Shared Combat difficulty profile:
- Difficulty 1: motion .52, path .72, outer pressure .08, direction rate .68,
    tolerance 1.35, independence .50.
- Difficulty 2: motion .65, path .84, outer pressure .20, direction rate .80,
    tolerance 1.20, independence .68.
- Difficulty 3: motion .76, path .94, outer pressure .35, direction rate .90,
    tolerance 1.05, independence .82.
- Difficulty 4: motion 1.00, path 1.18, outer pressure .70, direction rate 1.14,
    tolerance .86, independence 1.25.
- Difficulty 5: motion 1.18, path 1.32, outer pressure .90, direction rate 1.32,
    tolerance .72, independence 1.50.

The existing Combat mechanics remain the source of truth. Difficulty scales
only the execution fields appropriate to each mechanic family.

Roller Challenge v11.5.1 - Combat Difficulty 4/5 Rebalance

Combat Difficulty 4:
- Uses the v11.5 mechanic bands, cycles, responses, and tolerance unchanged.
- Uses the former Difficulty 5 Combat tracking speed of 1.45.

Combat Difficulty 5:
- Combat tracking speed 1.78; path cycles 0.90x; direction-change windows 0.88x.
- Smooth response 1.05x; path entry time 0.90x; tracking tolerance 0.86x.
- Outer bands extend by 0.04 and pressure-path ranges extend by 0.05 per end.
- Selected stability and separation mechanics further distinguish stable and active stick jobs.

Difficulties 1-3 retain their existing Combat behavior.

Roller Challenge v11.5 - Execution-Focused Combat Tuning

Combat execution tuning:
- Uses more of the available stick radius and increases deliberate edge pressure.
- Tightens Combat tracking tolerance while preserving the existing scoring model.
- Increases readable path speed, pressure separation, and sustained hold demands.
- Keeps every existing mechanic, lesson, smooth transition, and Challenge flow intact.

Roller Challenge v11.4 - High-Transfer Combat Mechanics

Combat mechanic library:
- Adds Recover, Commit, Pressure Change, Pressure Release, Pressure Ladder,
  Arc Tracking, Angle Hold, Movement Priority, Aim Priority, and Independent Timing.
- Every mechanic remains continuous tracking through the shared Combat updater.
- Motion is parameterized by pressure pattern, path shape, thumb priority, and timing offset.
- Each mechanic teaches one transferable thumb skill and has a distinct motion signature.

Roller Challenge v8.2 - Tracking, Audio & UI Visibility

Strafe + Aim:
- Remains a continuous tracking scenario for the full session.
- Scores time on target instead of completing when both targets are briefly acquired.
- Left stick trains strafe matching.
- Right stick trains continuous aim tracking.

Combat Movement:
- Renamed from Game Scenarios to make its purpose clearer.
- Trains smaller movement rhythms with more active right-stick aim.
- Moving-mode description explains the selected drill.

Audio:
- Audio feedback is enabled by default for new users.
- Sequence completion plays a clear completion tone.
- Static target completion plays a completion tone.
- Continuous tracking plays a subtle tone only when entering both target zones.
- Tracking audio is edge-triggered so it does not beep constantly.

UI:
- Moving Target Settings is emphasized and open by default.
- Each moving mode has a visible description.
- Existing contextual settings and saved settings remain.
