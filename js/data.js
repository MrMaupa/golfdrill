// js/data.js
// Pure data only: fixed vocabularies + SEED content.
//
// SEED_DRILLS / SEED_PLANS are written to Firestore ONCE by the seed routine,
// and only when the `drills` / `readyPlans` collections are empty. After that,
// the app reads from Firestore, not from here. See CLAUDE.md > DATA RULES.
//
// The drills below are the real library (21 drills). The 7 ready plans are
// composed from those drills. Edit here only for re-seeding; once Firestore
// is populated the app reads from Firestore, not this file.

// ---- Fixed vocabularies ---------------------------------------------------
// These are the canonical tag values. Drills/plans must only use values from
// these lists. The first six MISS_OPTIONS intentionally match FIXES exactly,
// so a future "you keep logging Slice" feature is a query, not a new model.

// Full bag, ordered longest -> shortest. "All clubs" (below) is the wildcard
// a drill uses when any club works.
export const CLUBS = [
  'Driver',
  '5 Wood',
  '5 Hybrid',
  '5i',
  '6i',
  '7i',
  '8i',
  '9i',
  'PW',
  'AW',
  '56°',
];

export const SKILL_AREAS = [
  'Contact',
  'Direction (Path & Face)',
  'Tempo & Balance',
  'Course Transfer / Routine',
  'Short Game',
  'Pre-Round Warm-up',
];

export const FIXES = [
  'Right / slice',
  'Left / pull',
  'Fat / ground first',
  'Thin / topped',
  'Too high',
  'Too low',
  'Balance & tempo',
  'Alignment & setup',
];

export const EQUIPMENT = [
  'None',
  'Alignment sticks ×1',
  'Alignment sticks ×2',
  'Towel',
  'Impact bag',
  'Tee gate',
  'Coin/marker',
];

// Session-log "main miss" options. First six match FIXES; last is the "no miss".
export const MISS_OPTIONS = [
  'Right / slice',
  'Left / pull',
  'Fat / ground first',
  'Thin / topped',
  'Too high',
  'Too low',
  'Good / playable',
];

// Session practice types (header field on a logged session).
export const PRACTICE_TYPES = [
  'Range session',
  'Short game',
  'Putting',
  'Pre-round warm-up',
  'On-course',
];

// The special club value that matches ANY club filter.
export const ALL_CLUBS = 'All clubs';

// Bump this when SEED_DRILLS / SEED_PLANS change so the app re-seeds Firestore
// on next sign-in (see ensureSeeded in firestore-service.js).
export const SEED_VERSION = 2;

// ---- SEED content --------------------------------------------------------

export const SEED_DRILLS = [
  {
    "id": "body_warmup",
    "name": "Body warm-up without ball",
    "clubs": [
      "All clubs"
    ],
    "skillAreas": [
      "Pre-Round Warm-up"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "2–3 min",
    "short": "Loosen body before hitting.",
    "why": "You should not hit the first balls stiff. This makes the first shots easier and safer.",
    "how": "Make slow shoulder turns, hip turns, arm swings, and 5–6 easy practice swings. Finish balanced every time.",
    "focus": "Loose body, easy rhythm."
  },
  {
    "id": "wedge_half",
    "name": "Wedge half swings",
    "clubs": [
      "PW",
      "9i",
      "AW",
      "56°"
    ],
    "skillAreas": [
      "Contact"
    ],
    "fixes": [
      "Fat / ground first",
      "Thin / topped"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Small swing, clean strike.",
    "why": "This is the easiest way to find contact before using 7i or longer clubs.",
    "how": "Use PW, AW, or 56°. Swing halfway back and halfway through. Keep weight slightly forward. Feel ball first, then light ground brush.",
    "focus": "Clean contact, no power."
  },
  {
    "id": "feet_together",
    "name": "Feet-together drill",
    "clubs": [
      "PW",
      "9i",
      "7i"
    ],
    "skillAreas": [
      "Tempo & Balance",
      "Contact"
    ],
    "fixes": [
      "Balance & tempo",
      "Fat / ground first"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Balance and centered contact.",
    "why": "If you swing too hard or lose posture, this drill exposes it immediately.",
    "how": "Put your feet close together. Use PW/9i first, then 7i. Make 60–70% swings. Hold your finish for two seconds.",
    "focus": "Stay balanced. Do not chase distance."
  },
  {
    "id": "towel_under_arms",
    "name": "Towel under arms",
    "clubs": [
      "PW",
      "9i",
      "7i"
    ],
    "skillAreas": [
      "Contact"
    ],
    "fixes": [
      "Thin / topped",
      "Fat / ground first"
    ],
    "equipment": [
      "Towel"
    ],
    "balls": "6–8 balls",
    "short": "Arms and body connected.",
    "why": "Good for the issue where arm rotation and finish can break down.",
    "how": "Place a small towel under both armpits. Hit half to three-quarter shots. The towel should not fall immediately in the backswing or before impact.",
    "focus": "Chest and arms move together."
  },
  {
    "id": "trail_foot_back",
    "name": "Trail-foot-back drill",
    "clubs": [
      "7i"
    ],
    "skillAreas": [
      "Contact"
    ],
    "fixes": [
      "Fat / ground first",
      "Thin / topped"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Rotate and cover the ball.",
    "why": "Helps stop hanging back and improves body rotation through impact.",
    "how": "Set up with 7i. Move your trail foot slightly back. Hit controlled shots and feel your chest stay over the ball through impact.",
    "focus": "Chest covers the ball. Finish balanced."
  },
  {
    "id": "normal_7i_transfer",
    "name": "Normal 7i transfer shots",
    "clubs": [
      "7i"
    ],
    "skillAreas": [
      "Course Transfer / Routine"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "8–10 balls",
    "short": "Take the drill feeling into a normal shot.",
    "why": "A drill only matters if you can bring the feeling back into your real swing.",
    "how": "Use your normal 7i setup. Pick one target. Keep only one thought from the drill before. Do not add new thoughts.",
    "focus": "One thought only."
  },
  {
    "id": "closed_stance",
    "name": "Closed-stance swings",
    "clubs": [
      "7i",
      "Driver"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Feel more in-to-out path.",
    "why": "Useful when shots go right or feel over-the-top.",
    "how": "Aim your feet slightly right of target while the clubface is closer to the target. Start with 7i. Make smooth swings and feel the club travel more from the inside.",
    "focus": "Path more from inside."
  },
  {
    "id": "pump_drill",
    "name": "Pump drill",
    "clubs": [
      "7i",
      "Driver"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–7 balls",
    "short": "Shallow the club before impact.",
    "why": "Helps reduce over-the-top movement.",
    "how": "Go to the top. Start down slowly to halfway down, pause, then go back up and swing through. Feel the club approach from behind you, not outside.",
    "focus": "Slow transition, shallow feel."
  },
  {
    "id": "split_hand_grip",
    "name": "Split-hand grip drill",
    "clubs": [
      "7i",
      "Driver"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–7 balls",
    "short": "Stop throwing the club outside.",
    "why": "Helps you feel the clubhead release without forcing the hands.",
    "how": "Separate your hands slightly on the grip. Make slow swings first, then small shots. Do not hit full power.",
    "focus": "Club releases naturally."
  },
  {
    "id": "step_into_swing",
    "name": "Step-into-swing drill",
    "clubs": [
      "7i",
      "5 Wood",
      "5 Hybrid",
      "Driver"
    ],
    "skillAreas": [
      "Tempo & Balance",
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice",
      "Balance & tempo"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Weight moves forward.",
    "why": "Useful if you hang back, slice, or do not finish fully.",
    "how": "Start with feet closer together. Begin the backswing, then step toward the target with your lead foot and swing through.",
    "focus": "Move to lead side. Full finish."
  },
  {
    "id": "brush_ground_5w",
    "name": "5W/5H brush-the-ground swings",
    "clubs": [
      "5 Wood",
      "5 Hybrid"
    ],
    "skillAreas": [
      "Contact"
    ],
    "fixes": [
      "Fat / ground first",
      "Thin / topped"
    ],
    "equipment": [
      "None"
    ],
    "balls": "8–10 balls",
    "short": "Sweep the ball, do not lift it.",
    "why": "Long clubs need smooth rhythm. Trying to help the ball up usually creates poor contact.",
    "how": "Use 5W or 5H. Feel the club brush the ground/mat after the ball. Keep the swing smooth and balanced.",
    "focus": "Brush, sweep, finish."
  },
  {
    "id": "pause_at_top",
    "name": "Pause-at-top drill",
    "clubs": [
      "7i",
      "5 Wood",
      "5 Hybrid"
    ],
    "skillAreas": [
      "Tempo & Balance"
    ],
    "fixes": [
      "Balance & tempo"
    ],
    "equipment": [
      "None"
    ],
    "balls": "6–8 balls",
    "short": "Stop rushing from the top.",
    "why": "Good when the swing gets fast, forced, or inconsistent.",
    "how": "Make a normal backswing. Pause briefly at the top. Then swing through smoothly. Use 7i first, then 5W/5H.",
    "focus": "Smooth transition."
  },
  {
    "id": "one_ball_one_target",
    "name": "One ball, one target routine",
    "clubs": [
      "PW",
      "9i",
      "7i",
      "5 Wood",
      "5 Hybrid",
      "Driver"
    ],
    "skillAreas": [
      "Course Transfer / Routine"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "8–10 balls",
    "short": "Practice like the course.",
    "why": "This stops random range hitting and helps transfer practice to the course.",
    "how": "For every ball, step back, choose a target, step in, swing, accept result. Change target or club after each ball.",
    "focus": "Routine and target."
  },
  {
    "id": "driver_limit_test",
    "name": "Driver limit test",
    "clubs": [
      "Driver"
    ],
    "skillAreas": [
      "Course Transfer / Routine"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "5–8 balls",
    "short": "Small driver test, not a driver marathon.",
    "why": "Driver is important, but too many driver balls can destroy the session if the pattern gets worse.",
    "how": "Hit only 5–8 drivers. Use smooth tempo. If the ball starts slicing badly, stop immediately and go back to 7i or 5W.",
    "focus": "Smooth, controlled, stop early."
  },
  {
    "id": "last_ball_first_tee",
    "name": "Last ball = first tee shot",
    "clubs": [
      "5 Wood",
      "5 Hybrid",
      "Driver"
    ],
    "skillAreas": [
      "Pre-Round Warm-up"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "1 ball",
    "short": "Simulate the first tee.",
    "why": "Helps you leave the range with a committed swing.",
    "how": "Pick your first-tee club. Choose target. Full routine. One ball only. Accept the result and go play.",
    "focus": "Commitment."
  },
  {
    "id": "landing_spot_wedge",
    "name": "Landing-spot wedge practice",
    "clubs": [
      "PW",
      "9i",
      "AW",
      "56°"
    ],
    "skillAreas": [
      "Short Game"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "8–10 balls",
    "short": "Pick where the ball lands.",
    "why": "Short game improves faster when you control landing spot, not only the final result.",
    "how": "Choose a landing area. Hit PW/AW/56° and try to land the ball there. Change target after a few balls.",
    "focus": "Landing spot first."
  },
  {
    "id": "pw_aw_3to9",
    "name": "PW/AW 3-to-9 swing",
    "clubs": [
      "PW",
      "9i",
      "AW"
    ],
    "skillAreas": [
      "Short Game"
    ],
    "fixes": [],
    "equipment": [
      "None"
    ],
    "balls": "8 balls",
    "short": "Controlled wedge distance.",
    "why": "Gives you a repeatable swing length for approach shots.",
    "how": "Imagine the club goes from 3 o'clock to 9 o'clock. Same tempo every time. Compare distances with PW and AW.",
    "focus": "Same swing length, same tempo."
  },
  {
    "id": "railroad_tracks",
    "name": "Railroad tracks (aim check)",
    "clubs": [
      "PW",
      "9i",
      "7i"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice",
      "Alignment & setup"
    ],
    "equipment": [
      "Alignment sticks ×2"
    ],
    "balls": "6–8 balls",
    "short": "Check your aim before you swing.",
    "why": "Most alignment problems are invisible without a visual reference. This shows immediately if your body or clubface is aiming where you think it is.",
    "how": "Lay one stick on the ground pointing at your target, just outside the ball. Lay a second stick parallel to it along your toe line. Set up so your feet, hips, and shoulders match the toe-line stick, then hit normal shots.",
    "focus": "Feet and target line parallel. Trust the picture, not the feeling."
  },
  {
    "id": "two_stick_path_gate",
    "name": "Two-stick path gate",
    "clubs": [
      "7i",
      "Driver"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice"
    ],
    "equipment": [
      "Alignment sticks ×2"
    ],
    "balls": "6–8 balls",
    "short": "A gate that punishes an outside-in path.",
    "why": "If you swing over the top, the club clips a stick before it can reach the ball — instant feedback without anyone watching your swing.",
    "how": "Push two sticks into the ground just outside the ball, a few inches apart, angled slightly from inside the target line to outside it. Make slow swings first, then real shots, without clipping either stick.",
    "focus": "Approach the ball from inside the gate, not across it."
  },
  {
    "id": "stick_in_bucket",
    "name": "Stick in the bucket (over-the-top guard)",
    "clubs": [
      "7i",
      "Driver"
    ],
    "skillAreas": [
      "Direction (Path & Face)"
    ],
    "fixes": [
      "Right / slice"
    ],
    "equipment": [
      "Alignment sticks ×1"
    ],
    "balls": "6–8 balls",
    "short": "A simple reminder to stop coming over the top.",
    "why": "Useful at the range when you don't want to set up a full gate. The stick gives a physical boundary your downswing shouldn't cross.",
    "how": "Stand a stick upright in your ball bucket or bag, just behind and outside the ball. Swing normally — if you come over the top, you'll clip the stick before impact.",
    "focus": "Swing away from the stick, not toward it."
  },
  {
    "id": "shaft_plane_stick",
    "name": "Shaft-plane stick",
    "clubs": [
      "7i",
      "5 Wood",
      "5 Hybrid"
    ],
    "skillAreas": [
      "Direction (Path & Face)",
      "Contact"
    ],
    "fixes": [
      "Fat / ground first",
      "Right / slice"
    ],
    "equipment": [
      "Alignment sticks ×1"
    ],
    "balls": "6–8 balls",
    "short": "Check your downswing matches your setup angle.",
    "why": "A steep, out-of-plane downswing is a common cause of fat and thin contact. This gives you a visual line to match.",
    "how": "Push a stick into the ground at address, angled along the same line as your shaft. Make a few practice swings checking that your downswing roughly retraces that angle, then hit shots.",
    "focus": "Match the angle down, not just at address."
  }
];

export const SEED_PLANS = [
  {
    "id": "plan_prep",
    "name": "Pre-round warm-up",
    "estimate": "~15 balls + warm-up",
    "purpose": "Get loose, find contact, and leave the range with one committed swing.",
    "drills": [
      "body_warmup",
      "wedge_half",
      "feet_together",
      "last_ball_first_tee"
    ]
  },
  {
    "id": "plan_contact_reset",
    "name": "Contact reset",
    "estimate": "32–42 balls",
    "purpose": "Rebuild a clean, centered strike and steady low point.",
    "drills": [
      "wedge_half",
      "feet_together",
      "towel_under_arms",
      "trail_foot_back",
      "normal_7i_transfer"
    ]
  },
  {
    "id": "plan_alignment_slice",
    "name": "Alignment & slice check",
    "estimate": "26–34 balls",
    "purpose": "Reset aim and start taming a ball that leaks right.",
    "drills": [
      "railroad_tracks",
      "closed_stance",
      "two_stick_path_gate",
      "normal_7i_transfer"
    ]
  },
  {
    "id": "plan_anti_slice",
    "name": "Anti-slice deep work",
    "estimate": "32–40 balls",
    "purpose": "Shallow the downswing and swing more from the inside.",
    "drills": [
      "railroad_tracks",
      "pump_drill",
      "split_hand_grip",
      "stick_in_bucket",
      "normal_7i_transfer"
    ]
  },
  {
    "id": "plan_tempo_balance",
    "name": "Tempo & balance",
    "estimate": "26–34 balls",
    "purpose": "Slow the transition and finish balanced every time.",
    "drills": [
      "feet_together",
      "pause_at_top",
      "step_into_swing",
      "brush_ground_5w"
    ]
  },
  {
    "id": "plan_long_clubs",
    "name": "Long clubs & driver",
    "estimate": "20–27 balls",
    "purpose": "Smooth rhythm with the longest clubs, without a driver marathon.",
    "drills": [
      "brush_ground_5w",
      "step_into_swing",
      "driver_limit_test",
      "last_ball_first_tee"
    ]
  },
  {
    "id": "plan_short_game",
    "name": "Short game touch",
    "estimate": "24–28 balls",
    "purpose": "Control landing spot and dial in wedge distances.",
    "drills": [
      "landing_spot_wedge",
      "pw_aw_3to9",
      "one_ball_one_target"
    ]
  }
];
