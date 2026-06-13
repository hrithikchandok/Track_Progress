// Shown (one at random) every time a task is completed.
// Mixed across F1, football, cricket, Kobe, and Steph Curry.
export const QUOTES = [
  // ── F1 ──
  'If you no longer go for a gap that exists, you are no longer a racing driver. — Ayrton Senna',
  'I am not designed to come second or third. I am designed to win. — Ayrton Senna',
  'Still I rise. — Lewis Hamilton',
  'To achieve anything, you must be prepared to dabble on the boundary of disaster. — Stirling Moss',
  'Lights out and away you go. 🏁',

  // ── Football ──
  'Talent without working hard is nothing. — Cristiano Ronaldo',
  'Success is no accident. It is hard work and perseverance. — Pelé',
  'You have to fight to reach your dream. Sacrifice and work hard for it. — Lionel Messi',
  'I learned all about life with a ball at my feet. — Ronaldinho',

  // ── Cricket ──
  'People throw stones at you and you convert them into milestones. — Sachin Tendulkar',
  'You should never be too high or too low. Just stay calm. — MS Dhoni',
  'Self-belief and hard work will always earn you success. — Virat Kohli',
  'I want to be the change I want to see. — Virat Kohli',

  // ── Kobe Bryant ──
  'Everything negative — pressure, challenges — is a chance for me to rise. — Kobe Bryant',
  'Great things come from hard work and perseverance. No excuses. — Kobe Bryant',
  'If you are afraid to fail, then you are probably going to fail. — Kobe Bryant',
  'Mamba mentality is about being the best version of yourself. — Kobe Bryant',

  // ── Steph Curry ──
  'Success is not an accident. Success is a choice. — Steph Curry',
  'Be the best version of yourself in anything you do. — Steph Curry',
  'Every day is a new opportunity to build on yesterday. — Steph Curry',
];

export function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
