import { lazy, Suspense } from 'react';

// The picker and its data are most of the bundle and only needed once someone opens a picker
const loadPicker = () => Promise.all([import('@emoji-mart/react'), import('@emoji-mart/data')]);

const Picker = lazy(() => loadPicker().then(([{ default: EmojiMartPicker }, { default: data }]) => ({
  default: (props) => <EmojiMartPicker data={data} {...props} />
})));

export const preloadEmojiPicker = () => { loadPicker(); };

const EmojiPicker = ({ onEmojiSelect }) => (
  <Suspense fallback={null}>
    <Picker onEmojiSelect={onEmojiSelect} theme="light" autoFocus navPosition="none" previewPosition="none" perLine={8} />
  </Suspense>
);

export default EmojiPicker;
