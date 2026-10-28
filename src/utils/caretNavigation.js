// Split by grapheme, not code unit, so emoji and accented letters keep their real width when measured
const graphemeSegmenter = new Intl.Segmenter();
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

// Where Option with left or right lands on arriving from the next or previous field: the start of the last word or
// the end of the first, skipping spaces and punctuation as the browser's own word jump does. With no words at all,
// the jump passes over the whole field
const wordCaretFromEdge = (field, fromEnd) => {
  const words = [...wordSegmenter.segment(field.value)].filter(s => s.isWordLike);
  if (!words.length) return fromEnd ? 0 : field.value.length;
  if (fromEnd) return words[words.length - 1].index;
  return words[0].index + words[0].segment.length;
};

// A textarea can't say which wrapped line its caret is on, so the text is laid out in a hidden copy that wraps the
// same way and each caret position is read from there. Keyed by UTF-16 index to match selectionStart.
const measureTaskCaretPositions = (textarea) => {
  const mirror = document.createElement('div');
  mirror.className = 'task-textarea-box task-highlight-mirror task-caret-mirror';
  const markers = [];
  for (const { segment, index } of graphemeSegmenter.segment(textarea.value)) {
    const span = document.createElement('span');
    span.textContent = segment;
    mirror.appendChild(span);
    markers.push([index, span]);
  }
  // Zero width, so marking the end of the text can't push the last line over and wrap it
  const end = document.createElement('span');
  end.textContent = '​';
  mirror.appendChild(end);
  markers.push([textarea.value.length, end]);

  textarea.parentElement.appendChild(mirror);
  const positions = new Map(markers.map(([index, span]) => [index, { top: span.offsetTop, left: span.offsetLeft }]));
  mirror.remove();
  return positions;
};

// A category title is one line that never wraps, so its caret positions come from the width of the text before them.
// Keyed the same way as measureTaskCaretPositions, with every position on one line
let measuringContext;
const measureTitleCaretPositions = (input) => {
  measuringContext ??= document.createElement('canvas').getContext('2d');
  const style = getComputedStyle(input);
  // Built from the longhands, as not every browser reports the font shorthand as a computed style
  measuringContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const start = parseFloat(style.paddingLeft) - input.scrollLeft;
  const positions = new Map([[0, { top: 0, left: start }]]);
  for (const { segment, index } of graphemeSegmenter.segment(input.value)) {
    const end = index + segment.length;
    positions.set(end, { top: 0, left: start + measuringContext.measureText(input.value.slice(0, end)).width });
  }
  return positions;
};

const measureCaretPositions = field =>
  field.tagName === 'TEXTAREA' ? measureTaskCaretPositions(field) : measureTitleCaretPositions(field);

// Every field the arrow keys move through, in reading order: each card's title, then its tasks. Ticked tasks have
// disabled textareas, which can't take focus, so they are left out
const FIELD_SELECTOR = 'input.edit-title-input, textarea.task-textarea-box:not(:disabled)';

const findAdjacentField = (field, up) => {
  const board = field.closest('.card-list-container');
  if (!board) return null;
  const fields = [...board.querySelectorAll(FIELD_SELECTOR)];
  return fields[fields.indexOf(field) + (up ? -1 : 1)] ?? null;
};

const focusAt = (field, caret) => {
  field.focus();
  field.setSelectionRange(caret, caret);
};

// The horizontal offset a run of up and down presses started from, as an editor's goal column, so passing through a
// short line doesn't pull the caret left for good. It holds only while the caret sits where the last press put it:
// typing, clicking or any other move ends the run
let goalColumn = null;

const goalLeft = field =>
  goalColumn?.field === field && goalColumn.caret === field.selectionStart && field.selectionEnd === field.selectionStart
    ? goalColumn.left
    : undefined;

// Puts the caret on the line at lineTop, at the position closest to the horizontal offset it came from
const placeCaret = (field, positions, lineTop, left) => {
  let best = 0;
  let bestDistance = Infinity;
  positions.forEach((position, index) => {
    const distance = Math.abs(position.left - left);
    if (position.top === lineTop && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  focusAt(field, best);
  goalColumn = { field, caret: best, left };
};

const focusNearest = (field, left, firstLine) => {
  const positions = measureCaretPositions(field);
  placeCaret(field, positions, positions.get(firstLine ? 0 : field.value.length).top, left);
};

// Within one card only, so a task that can't be deleted (the card's last unticked one) never sends focus elsewhere
export const findAdjacentTaskTextarea = (textarea, up) => {
  const step = el => up ? el.previousElementSibling : el.nextElementSibling;
  for (let container = step(textarea.closest('.task-container')); container?.classList.contains('task-container'); container = step(container)) {
    const candidate = container.querySelector('textarea.task-textarea-box');
    if (candidate && !candidate.disabled) return candidate;
  }
  return null;
};

// The arrow keys move between titles and tasks as in a text editor. Up on a field's first line or down on its last
// moves into the neighbouring field, keeping the caret's horizontal position (the goal column, over a run of
// presses); a title has one line, so it always moves. Left at the very start goes to the end of the field before, and right at the very end to the start of the
// field after; with Option held they land a word in, so word jumps carry on across fields. In a task, Cmd with up
// or down goes to the first line of the card's first task or the last line of its last, as Cmd with up or down goes
// to the top or bottom of a document, but keeps the caret's horizontal position; titles are left out. Returns false
// to leave the key to the browser.
export const moveCaretBetweenFields = (e) => {
  const { target: field, key } = e;
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return false;
  if (e.shiftKey || e.ctrlKey || e.nativeEvent.isComposing) return false;
  if (e.altKey && (e.metaKey || key === "ArrowUp" || key === "ArrowDown")) return false;

  if (e.metaKey) {
    if ((key !== "ArrowUp" && key !== "ArrowDown") || field.tagName !== 'TEXTAREA') return false;
    const tasks = field.closest('.card-container')?.querySelectorAll('textarea.task-textarea-box:not(:disabled)');
    if (!tasks?.length) return false;
    e.preventDefault();
    const up = key === "ArrowUp";
    // From the selection's end nearest the direction of travel, as a selection collapses that way
    const caret = measureCaretPositions(field).get(up ? field.selectionStart : field.selectionEnd);
    focusNearest(up ? tasks[0] : tasks[tasks.length - 1], goalLeft(field) ?? caret?.left ?? 0, up);
    return true;
  }
  // With a selection, the browser collapses it first, as an editor would
  if (field.selectionStart !== field.selectionEnd) return false;

  if (key === "ArrowLeft" || key === "ArrowRight") {
    const back = key === "ArrowLeft";
    if (field.selectionStart !== (back ? 0 : field.value.length)) return false;
    const next = findAdjacentField(field, back);
    if (!next) return false;
    e.preventDefault();
    if (e.altKey) focusAt(next, wordCaretFromEdge(next, back));
    else focusAt(next, back ? next.value.length : 0);
    return true;
  }

  const up = key === "ArrowUp";
  const positions = measureCaretPositions(field);
  const caret = positions.get(field.selectionStart);
  if (!caret) return false;
  const left = goalLeft(field) ?? caret.left;

  // Moves between a task's wrapped lines are made here too, not left to the browser, so they keep the goal column
  const lineTops = [...new Set([...positions.values()].map(position => position.top))].sort((a, b) => a - b);
  const lineTop = lineTops[lineTops.indexOf(caret.top) + (up ? -1 : 1)];
  if (lineTop !== undefined) {
    e.preventDefault();
    placeCaret(field, positions, lineTop, left);
    return true;
  }

  const next = findAdjacentField(field, up);
  if (!next) return false;
  e.preventDefault();
  focusNearest(next, left, !up);
  return true;
};
