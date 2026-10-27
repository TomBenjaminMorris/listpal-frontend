import { lazy, Suspense } from 'react';
import { useOnClickOutside } from 'usehooks-ts';

// The picker and its data are most of the bundle and only needed once someone opens a picker
const loadPicker = () => Promise.all([import('@emoji-mart/react'), import('@emoji-mart/data')]);

const Picker = lazy(() => loadPicker().then(([{ default: EmojiMartPicker }, { default: data }]) => ({
  default: (props) => <EmojiMartPicker data={data} {...props} />
})));

export const preloadEmojiPicker = () => { loadPicker(); };

// Mounted only while open, so the outside-click listener exists only then. containerRef wraps the
// picker and its toggle, so the toggle's own click still closes it
const EmojiPicker = ({ onEmojiSelect, containerRef, onClose }) => {
  useOnClickOutside(containerRef, onClose);
  return (
    <Suspense fallback={null}>
      <Picker onEmojiSelect={onEmojiSelect} theme="light" autoFocus navPosition="none" previewPosition="none" perLine={8} />
    </Suspense>
  );
};

export default EmojiPicker;
