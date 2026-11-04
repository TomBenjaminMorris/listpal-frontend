import { beforeAll, describe, expect, it } from 'vitest';
import {
  CATEGORY_STOPWORDS,
  CURATED_EMOJI,
  DEFAULT_CATEGORY_EMOJI,
  normaliseCategoryName,
  suggestEmoji
} from './categoryEmoji';

// The emoji that every device the user has can draw, so a suggestion never shows as two glyphs
const EMOJI_VERSION_CAP = 12;

describe('suggestEmoji', () => {
  it.each([
    // The Welcome board's categories
    ['Getting started', '💡'],
    ['Home', '🏠'],
    ['Work', '💼'],
    ['Health', '🏃'],
    ['Someday', '🌱'],

    ['Dentist', '🦷'],
    ['Groceries', '🛒'],
    ['Holidays', '✈️'],
    ['Chores', '🧹'],
    ['Pets', '🐾'],
    ['Gifts', '🎁'],
    ['Admin', '🗂️'],
    ['Fitness', '💪'],
    ['Appointments', '📅'],
    ['This week', '📅'],
    ['Car insurance', '🛡️'],
    ['Birthday gifts', '🎁'],
    ['Dog food', '🐕'],
    ['Dog walking', '🐕'],
    ['Work admin', '💼'],
    ['House/Flat', '🏠'],
    ['Council tax', '💷'],
    ['MOT', '🚗'],
    ['Bins', '🗑️'],
    ['Uni', '🎓'],
    ['GP', '🩺'],
    ['Shopping list', '🛒'],
    ['Dentist appointments', '🦷'],
    ['To-do list', '📝'],
    ["Mum's birthday", '🎂'],
    ["Kids' clothes", '👕'],
    ['Work stuff', '💼']
  ])('suggests an emoji for %s', (name, emoji) => {
    expect(suggestEmoji(name)).toBe(emoji);
  });

  it('tries plurals and -ing forms as typed, then a singular', () => {
    expect(suggestEmoji('Reading')).toBe('📚');
    expect(suggestEmoji('Cleaning')).toBe('🧹');
    expect(suggestEmoji('Parcels')).toBe('📦');
    expect(suggestEmoji('Reminders')).toBe('⏰');
    expect(suggestEmoji('Priorities')).toBe('⭐');
    expect(suggestEmoji('Taxes')).toBe('💷');
    expect(suggestEmoji('Lunches')).toBe('🍽️');
    expect(suggestEmoji('Courses')).toBe('📖');
  });

  it('keeps short words and words ending in s whole', () => {
    expect(suggestEmoji('Christmas')).toBe('🎄');
    expect(suggestEmoji('Bus')).toBe(DEFAULT_CATEGORY_EMOJI);
    expect(suggestEmoji('News')).toBe(DEFAULT_CATEGORY_EMOJI);
    expect(suggestEmoji('This')).toBe(DEFAULT_CATEGORY_EMOJI);
  });

  it('takes an emoji typed in the name, whole', () => {
    expect(suggestEmoji('Finance 💰')).toBe('💰');
    expect(suggestEmoji('Coding 👩‍💻')).toBe('👩‍💻');
    expect(suggestEmoji('Trips ✈️')).toBe('✈️');
    expect(suggestEmoji('France 🇫🇷')).toBe('🇫🇷');
    expect(suggestEmoji('Top 3️⃣')).toBe('3️⃣');
    expect(suggestEmoji('❤️‍🔥 Hobbies')).toBe('❤️‍🔥');
  });

  it('does not take a digit or a text symbol for an emoji', () => {
    expect(suggestEmoji('Order 1')).toBe(DEFAULT_CATEGORY_EMOJI);
    expect(suggestEmoji('Q&A #2')).toBe(DEFAULT_CATEGORY_EMOJI);
    expect(suggestEmoji('Brand™')).toBe(DEFAULT_CATEGORY_EMOJI);
    expect(suggestEmoji('Work ™')).toBe('💼');
  });

  it.each(['sdf', 'tmp', 'test2', 'cat1', 'Order 1', 'BP-1536', 'Something', '', 'Einkäufe', '買い物', 'Покупки'])(
    'falls back to the default for %j',
    name => {
      expect(suggestEmoji(name)).toBe(DEFAULT_CATEGORY_EMOJI);
    }
  );
});

describe('normaliseCategoryName', () => {
  it('keeps letters from any script', () => {
    expect(normaliseCategoryName('Einkäufe')).toBe('einkäufe');
    expect(normaliseCategoryName('買い物')).toBe('買い物');
    expect(normaliseCategoryName('Покупки')).toBe('покупки');
  });

  it('splits on separators and drops apostrophes', () => {
    expect(normaliseCategoryName('House/Flat')).toBe('house flat');
    expect(normaliseCategoryName('Bills & Money')).toBe('bills money');
    expect(normaliseCategoryName('To-do')).toBe('to do');
    expect(normaliseCategoryName("Kids' stuff")).toBe('kids stuff');
    expect(normaliseCategoryName('Mum’s  birthday!')).toBe('mums birthday');
  });

  it('folds compatibility forms', () => {
    expect(normaliseCategoryName('ＧＰ')).toBe('gp');
  });
});

describe('CURATED_EMOJI', () => {
  let nativeVersions;

  beforeAll(async () => {
    const { default: data } = await import('@emoji-mart/data');
    nativeVersions = new Map(
      Object.values(data.emojis).flatMap(emoji => emoji.skins.map(skin => [skin.native, emoji.version]))
    );
  });

  const entries = CURATED_EMOJI.flatMap(({ emoji, tier, words }) => words.map(word => ({ word, emoji, tier })));

  it('uses only emoji from the picker data, VS16 included, no newer than the cap', () => {
    const emojis = [...new Set(entries.map(entry => entry.emoji))];
    const unknown = emojis.filter(emoji => !nativeVersions.has(emoji));
    const tooNew = emojis.filter(emoji => nativeVersions.get(emoji) > EMOJI_VERSION_CAP);
    expect(unknown).toEqual([]);
    expect(tooNew).toEqual([]);
  });

  it('has normalised, unique keys and a known tier for each', () => {
    const words = entries.map(entry => entry.word);
    expect(words.filter(word => normaliseCategoryName(word) !== word)).toEqual([]);
    expect(words.filter((word, i) => words.indexOf(word) !== i)).toEqual([]);
    expect(entries.filter(entry => !['strong', 'weak'].includes(entry.tier))).toEqual([]);
  });

  it('lists every stopword, so one used alone still has an emoji', () => {
    const words = new Set(entries.map(entry => entry.word));
    expect([...CATEGORY_STOPWORDS].filter(word => !words.has(word))).toEqual([]);
  });
});
