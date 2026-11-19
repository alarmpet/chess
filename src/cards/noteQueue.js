// The game notes one at a time (2026-11-06). One move can bring a mission, a bounty, a quest and a comeback goal at
// once; the notes used to replace each other and only the last stayed (qa 2026-11-06-quests, 2026-11-06-rally).
// Now they wait in line: a note with others behind it stays a shorter while, the same text is not queued twice,
// and at most `max` wait (the oldest waiting one gives way). Pure apart from the timer it is given.
export function noteQueue({ show, wait = (fn, ms) => setTimeout(fn, ms), max = 3, crowdedMs = 1800 }) {
  let current = null;
  const line = [];
  // A note's time runs in steps of `crowdedMs`: after each step it gives way if another is waiting, else it stays on
  // for the rest. Notes of one move arrive in the same moment, so the first of them learns of the others this way.
  const hold = (left) => {
    const step = Math.min(left, crowdedMs);
    wait(() => (left - step > 0 && !line.length ? hold(left - step) : next()), step);
  };
  const next = () => {
    current = line.shift() || null;
    show(current ? current.text : '');
    if (current) hold(current.ms);
  };
  return {
    say(text, ms = 2400) {
      if (current?.text === text || line.some((n) => n.text === text)) return;
      line.push({ text, ms });
      if (line.length > max) line.shift();
      if (!current) next();
    },
    waiting: () => line.length
  };
}
