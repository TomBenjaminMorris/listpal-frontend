// Shown for a category whose name suggests nothing, and wherever a card has no emoji of its own
export const DEFAULT_CATEGORY_EMOJI = '✅';

const STRONG = 'strong';
const WEAK = 'weak';

// A weak word only says roughly where a task lives ("Work admin"), so any strong word in the name wins over it.
// Every emoji is the exact native string from @emoji-mart/data, VS16 included, and no newer than Emoji 12, as it
// syncs to every device the user has and an older one draws a newer emoji as two glyphs. The tests hold it to that.
// Keys are already normalised. A plural or -ing form that is the usual name for a category is listed as it is, as
// a singular is only a guess tried afterwards. Home, Work, Health and Getting started match the Welcome board in the
// backend
export const CURATED_EMOJI = [
  // Health and body
  { emoji: '🦷', tier: STRONG, words: ['dentist', 'dental', 'teeth'] },
  { emoji: '🩺', tier: STRONG, words: ['doctor', 'gp', 'medical', 'clinic', 'nhs', 'checkup'] },
  { emoji: '🏥', tier: STRONG, words: ['hospital'] },
  { emoji: '💊', tier: STRONG, words: ['medication', 'medicine', 'meds', 'pharmacy', 'prescription', 'chemist'] },
  { emoji: '👓', tier: STRONG, words: ['optician', 'glasses', 'eye test'] },
  { emoji: '🏃', tier: STRONG, words: ['exercise', 'running', 'run', 'jogging', 'marathon'] },
  { emoji: '🏃', tier: WEAK, words: ['health', 'healthy'] },
  { emoji: '💪', tier: STRONG, words: ['fitness', 'gym', 'workout', 'training'] },
  { emoji: '🧘', tier: STRONG, words: ['yoga', 'pilates', 'meditation', 'mindfulness', 'wellbeing', 'wellness', 'self care', 'mental health', 'me time'] },
  { emoji: '🥗', tier: STRONG, words: ['diet', 'nutrition', 'healthy eating', 'salad'] },
  { emoji: '😴', tier: STRONG, words: ['sleep', 'sleeping', 'bedtime'] },
  { emoji: '✂️', tier: STRONG, words: ['haircut', 'hairdresser', 'barber', 'hair'] },
  { emoji: '💄', tier: STRONG, words: ['makeup', 'beauty'] },

  // Sport and hobbies
  { emoji: '🚲', tier: STRONG, words: ['cycling', 'bike', 'bicycle'] },
  { emoji: '🏊', tier: STRONG, words: ['swimming', 'swim'] },
  { emoji: '⚽', tier: STRONG, words: ['football', 'sport', 'sports'] },
  { emoji: '🎾', tier: STRONG, words: ['tennis'] },
  { emoji: '⛳', tier: STRONG, words: ['golf'] },
  { emoji: '🎿', tier: STRONG, words: ['skiing'] },
  { emoji: '🥾', tier: STRONG, words: ['hiking', 'hikes', 'walks', 'walking'] },
  { emoji: '🏕️', tier: STRONG, words: ['camping'] },
  { emoji: '🎵', tier: STRONG, words: ['music', 'songs'] },
  { emoji: '🎸', tier: STRONG, words: ['guitar', 'band', 'gig'] },
  { emoji: '🎬', tier: STRONG, words: ['films', 'film', 'movies', 'movie', 'cinema', 'watchlist', 'watch list', 'to watch'] },
  { emoji: '📺', tier: STRONG, words: ['tv', 'telly', 'tv shows', 'box sets'] },
  { emoji: '🎮', tier: STRONG, words: ['games', 'gaming', 'video games'] },
  { emoji: '🎨', tier: STRONG, words: ['art', 'craft', 'drawing', 'painting'] },
  { emoji: '🧩', tier: STRONG, words: ['hobbies', 'hobby', 'puzzles'] },
  { emoji: '📷', tier: STRONG, words: ['photos', 'photography'] },
  { emoji: '📚', tier: STRONG, words: ['books', 'reading', 'library', 'to read'] },
  { emoji: '✍️', tier: STRONG, words: ['writing', 'blog', 'blogging', 'journal', 'journalling'] },
  { emoji: '🌍', tier: STRONG, words: ['language', 'spanish', 'french', 'german'] },
  { emoji: '🎭', tier: STRONG, words: ['theatre'] },
  { emoji: '🎟️', tier: STRONG, words: ['tickets', 'concert', 'festival'] },

  // Home and household
  { emoji: '🏠', tier: WEAK, words: ['home', 'house', 'flat', 'household', 'apartment'] },
  { emoji: '🧹', tier: STRONG, words: ['cleaning', 'chores', 'housework', 'tidying', 'declutter', 'decluttering'] },
  { emoji: '🧺', tier: STRONG, words: ['laundry', 'washing', 'ironing'] },
  { emoji: '🗑️', tier: STRONG, words: ['bins', 'bin', 'recycling', 'rubbish'] },
  { emoji: '🛠️', tier: STRONG, words: ['diy', 'repair', 'maintenance', 'odd jobs', 'renovation', 'reno', 'home improvements'] },
  { emoji: '🖌️', tier: STRONG, words: ['decorating'] },
  { emoji: '🔥', tier: STRONG, words: ['boiler', 'heating'] },
  { emoji: '⚡', tier: STRONG, words: ['energy', 'electricity'] },
  { emoji: '🌻', tier: STRONG, words: ['garden', 'gardening'] },
  { emoji: '🌿', tier: STRONG, words: ['plants', 'houseplants'] },
  { emoji: '🥕', tier: STRONG, words: ['allotment', 'vegetables'] },
  { emoji: '🛋️', tier: STRONG, words: ['furniture'] },
  // A room says where the work is, so "Kitchen reno" goes by the work
  { emoji: '🛋️', tier: WEAK, words: ['living room'] },
  { emoji: '🛏️', tier: WEAK, words: ['bedroom'] },
  { emoji: '🛁', tier: WEAK, words: ['bathroom'] },
  { emoji: '🍳', tier: WEAK, words: ['kitchen'] },
  { emoji: '🍳', tier: STRONG, words: ['cooking', 'cook', 'recipe'] },
  { emoji: '🧁', tier: STRONG, words: ['baking'] },
  { emoji: '🍽️', tier: STRONG, words: ['meals', 'meal plan', 'meal planning', 'meal prep', 'breakfast', 'lunch', 'dinner', 'restaurants', 'eating out'] },
  { emoji: '🍽️', tier: WEAK, words: ['food'] },
  { emoji: '📦', tier: STRONG, words: ['moving', 'moving house', 'removals', 'packages', 'parcels', 'deliveries', 'returns'] },
  { emoji: '🧳', tier: STRONG, words: ['packing', 'luggage', 'suitcase'] },

  // Shopping
  { emoji: '🛒', tier: STRONG, words: ['groceries', 'grocery', 'shopping', 'shop', 'supermarket', 'food shop', 'to buy', 'buy'] },
  { emoji: '👕', tier: STRONG, words: ['clothes', 'clothing', 'wardrobe', 'outfits', 'fashion'] },
  { emoji: '👟', tier: STRONG, words: ['shoes', 'trainers'] },
  { emoji: '🏷️', tier: STRONG, words: ['selling', 'to sell', 'sell'] },
  { emoji: '🛍️', tier: STRONG, words: ['errands'] },

  // Pets
  { emoji: '🐾', tier: STRONG, words: ['pets', 'pet', 'vet'] },
  { emoji: '🐕', tier: STRONG, words: ['dog', 'dogs', 'puppy'] },
  { emoji: '🐈', tier: STRONG, words: ['cat', 'cats', 'kitten'] },
  { emoji: '🐇', tier: STRONG, words: ['rabbit'] },
  { emoji: '🐠', tier: STRONG, words: ['fish'] },

  // Money and paperwork
  { emoji: '💰', tier: STRONG, words: ['money', 'savings', 'saving', 'budget', 'budgeting', 'finance', 'finances', 'financial'] },
  { emoji: '💷', tier: STRONG, words: ['bills', 'bill', 'tax', 'council tax', 'rent', 'payments', 'utilities', 'tax return'] },
  { emoji: '🏦', tier: STRONG, words: ['bank', 'banking', 'mortgage', 'pension'] },
  { emoji: '📈', tier: STRONG, words: ['investing', 'investments', 'stocks', 'shares'] },
  { emoji: '💳', tier: STRONG, words: ['subscriptions', 'credit card', 'credit cards', 'debt', 'loan'] },
  { emoji: '🧾', tier: STRONG, words: ['receipts', 'expenses', 'invoices'] },
  { emoji: '🛡️', tier: STRONG, words: ['insurance', 'car insurance', 'home insurance', 'house insurance', 'travel insurance', 'pet insurance', 'life insurance'] },
  { emoji: '🗂️', tier: STRONG, words: ['paperwork', 'documents', 'forms'] },
  { emoji: '🗂️', tier: WEAK, words: ['admin', 'life admin'] },
  { emoji: '⚖️', tier: STRONG, words: ['legal', 'solicitor'] },
  { emoji: '🏛️', tier: STRONG, words: ['council', 'government'] },
  { emoji: '🛂', tier: STRONG, words: ['passport', 'visa'] },
  { emoji: '✉️', tier: STRONG, words: ['post', 'letters', 'mail', 'cards'] },
  { emoji: '📧', tier: STRONG, words: ['email', 'emails', 'inbox'] },
  { emoji: '📞', tier: STRONG, words: ['calls', 'phone calls', 'to call'] },

  // Transport and travel
  { emoji: '🚗', tier: STRONG, words: ['car', 'cars', 'mot', 'driving'] },
  { emoji: '⛽', tier: STRONG, words: ['petrol', 'fuel'] },
  { emoji: '🚆', tier: STRONG, words: ['train', 'commute', 'commuting'] },
  { emoji: '✈️', tier: STRONG, words: ['holiday', 'holidays', 'travel', 'travelling', 'trip', 'trips', 'flight', 'vacation'] },
  { emoji: '🏨', tier: STRONG, words: ['hotel', 'accommodation'] },
  { emoji: '🗺️', tier: STRONG, words: ['adventure', 'places'] },
  { emoji: '🎡', tier: STRONG, words: ['days out', 'day out'] },

  // Events and occasions
  { emoji: '🎁', tier: STRONG, words: ['gifts', 'gift', 'presents', 'birthday gifts', 'birthday presents', 'christmas gifts', 'christmas presents', 'present ideas', 'wish list', 'wishlist'] },
  { emoji: '🎂', tier: STRONG, words: ['birthday'] },
  { emoji: '🎄', tier: STRONG, words: ['christmas', 'xmas'] },
  { emoji: '🎃', tier: STRONG, words: ['halloween'] },
  { emoji: '🐣', tier: STRONG, words: ['easter'] },
  { emoji: '🎆', tier: STRONG, words: ['new year', 'new years'] },
  { emoji: '💍', tier: STRONG, words: ['wedding', 'engagement'] },
  { emoji: '🎉', tier: STRONG, words: ['party', 'parties', 'celebration', 'hen do', 'stag do'] },
  { emoji: '🎉', tier: WEAK, words: ['fun'] },
  { emoji: '🥂', tier: STRONG, words: ['social', 'nights out', 'night out', 'drinks'] },
  { emoji: '🍺', tier: STRONG, words: ['pub', 'beer'] },
  { emoji: '🍷', tier: STRONG, words: ['wine', 'date night', 'date nights'] },
  { emoji: '☕', tier: STRONG, words: ['coffee'] },
  { emoji: '💝', tier: STRONG, words: ['charity', 'volunteering'] },

  // Family and people. Weak, so "Mum's birthday" or "Kids' clothes" goes by what the tasks are about
  { emoji: '🏡', tier: WEAK, words: ['family'] },
  { emoji: '❤️', tier: WEAK, words: ['mum', 'dad', 'parents', 'grandparents', 'grandma', 'grandad', 'partner', 'wife', 'husband'] },
  { emoji: '🤗', tier: WEAK, words: ['friends', 'friend'] },
  { emoji: '🧸', tier: WEAK, words: ['kids', 'children', 'nursery'] },
  { emoji: '🍼', tier: STRONG, words: ['baby'] },

  // Study
  { emoji: '🎓', tier: STRONG, words: ['uni', 'university', 'college', 'degree', 'graduation', 'dissertation', 'thesis'] },
  { emoji: '🏫', tier: STRONG, words: ['school'] },
  { emoji: '✏️', tier: STRONG, words: ['homework', 'coursework', 'assignments', 'essays'] },
  { emoji: '📖', tier: STRONG, words: ['study', 'studying', 'revision', 'lessons', 'course'] },
  { emoji: '📝', tier: STRONG, words: ['exam'] },
  { emoji: '🧠', tier: WEAK, words: ['learning', 'learn', 'skills'] },

  // Work
  { emoji: '💼', tier: WEAK, words: ['work', 'job', 'career', 'business', 'office'] },
  { emoji: '🔍', tier: STRONG, words: ['job hunt', 'job hunting', 'job search', 'job applications', 'applications', 'interviews'] },
  { emoji: '👥', tier: STRONG, words: ['meetings', 'meeting', 'team', 'one to ones'] },
  { emoji: '🤝', tier: STRONG, words: ['clients', 'networking'] },
  { emoji: '📋', tier: STRONG, words: ['projects', 'project', 'checklist'] },
  { emoji: '🚀', tier: STRONG, words: ['side project', 'side projects', 'side hustle', 'startup'] },
  { emoji: '📊', tier: STRONG, words: ['report', 'presentations'] },
  { emoji: '💻', tier: STRONG, words: ['computer', 'laptop', 'tech', 'coding', 'code', 'programming', 'website'] },
  { emoji: '💻', tier: WEAK, words: ['online'] },
  { emoji: '🐛', tier: STRONG, words: ['bug'] },
  { emoji: '📱', tier: STRONG, words: ['phone', 'mobile', 'apps', 'social media'] },
  { emoji: '🔒', tier: STRONG, words: ['passwords', 'security'] },

  // Time and planning
  { emoji: '📅', tier: WEAK, words: ['this week', 'next week', 'this month', 'next month', 'weekly', 'monthly', 'plans', 'planning', 'appointments', 'appointment', 'events', 'calendar'] },
  { emoji: '📅', tier: WEAK, words: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
  { emoji: '📌', tier: WEAK, words: ['today', 'tomorrow', 'general', 'other'] },
  { emoji: '☀️', tier: WEAK, words: ['daily', 'morning', 'summer'] },
  { emoji: '🌙', tier: WEAK, words: ['evening'] },
  { emoji: '🎈', tier: WEAK, words: ['weekend', 'this weekend'] },
  { emoji: '🚨', tier: STRONG, words: ['urgent', 'asap'] },
  { emoji: '⭐', tier: WEAK, words: ['important', 'priority'] },
  { emoji: '⏰', tier: STRONG, words: ['reminder', 'deadlines'] },
  { emoji: '🎯', tier: STRONG, words: ['goals', 'goal', 'targets', 'resolutions'] },
  { emoji: '🌟', tier: STRONG, words: ['bucket list'] },
  { emoji: '🔁', tier: STRONG, words: ['habits', 'routine'] },
  { emoji: '🌱', tier: WEAK, words: ['someday', 'one day', 'maybe', 'later'] },
  { emoji: '💡', tier: WEAK, words: ['ideas', 'idea', 'getting started', 'inspiration', 'tips'] },
  { emoji: '🗃️', tier: WEAK, words: ['misc', 'backlog'] },
  { emoji: '🎲', tier: WEAK, words: ['random'] },
  { emoji: '👤', tier: WEAK, words: ['personal', 'me'] },
  { emoji: '🌈', tier: WEAK, words: ['life'] },
  { emoji: '📝', tier: WEAK, words: ['to do', 'todo', 'todos', 'tasks', 'task', 'list', 'lists', 'notes', 'things'] },
  { emoji: '📦', tier: WEAK, words: ['stuff'] }
];

// Words that describe a list rather than its subject, so "Shopping list" or "Dentist appointments" goes by the
// other word. On their own, or beside words that match nothing, they still give their emoji
export const CATEGORY_STOPWORDS = new Set(['to do', 'todo', 'todos', 'tasks', 'task', 'list', 'lists', 'things', 'stuff', 'appointments', 'appointment']);

const curated = new Map(CURATED_EMOJI.flatMap(({ emoji, tier, words }) => words.map(word => [word, { word, emoji, tier }])));

// Unicode-aware, so "Einkäufe" or "買い物" keep their letters. Apostrophes go without a gap ("Kids'" is "kids"),
// and anything else between letters, such as / & - +, separates words
export const normaliseCategoryName = name => name
  .normalize('NFKC')
  .toLowerCase()
  .replace(/['’ʼ`]/g, '')
  .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
  .trim();

// Browsers without Intl.Segmenter fall back to code points, which loses a ZWJ sequence's later parts and VS16
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null;
const graphemes = text => segmenter ? Array.from(segmenter.segment(text), s => s.segment) : [...text];

// Extended_Pictographic rather than Emoji, which also matches digits, # and *. A pictograph with neither emoji
// presentation nor VS16 shows as a text symbol (©, ™, ↔), so it doesn't count. Flags and keycaps aren't
// pictographs at all, so they are checked by their own parts
const isEmoji = grapheme => /\p{Regional_Indicator}{2}|\u20E3/u.test(grapheme) ||
  (/\p{Extended_Pictographic}/u.test(grapheme) && /\p{Emoji_Presentation}|\uFE0F/u.test(grapheme));

// Only tried after the word as typed, and only leaving three letters or more, so "bus" or "gas" stay whole
const singulars = word => {
  const candidates = [];
  if (word.endsWith('ies')) candidates.push(`${word.slice(0, -3)}y`);
  if (/(s|x|z|ch|sh)es$/.test(word)) candidates.push(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss')) candidates.push(word.slice(0, -1));
  return candidates.filter(candidate => [...candidate].length >= 3);
};

const lookUpWord = word => curated.get(word) ?? singulars(word).map(candidate => curated.get(candidate)).find(Boolean);

// A two-word entry such as "car insurance" is taken before its words, so it can outrank a strong word inside it
const matchesIn = words => {
  const matches = [];
  for (let i = 0; i < words.length; i++) {
    const pair = i + 1 < words.length && curated.get(`${words[i]} ${words[i + 1]}`);
    if (pair) {
      matches.push(pair);
      i++;
      continue;
    }
    const match = lookUpWord(words[i]);
    if (match) matches.push(match);
  }
  return matches;
};

// Synchronous and offline, as the prompt that names a category closes as soon as its callback returns
export const suggestEmoji = name => {
  const typed = graphemes(name).find(isEmoji);
  if (typed) return typed;

  const phrase = normaliseCategoryName(name);
  const whole = curated.get(phrase);
  if (whole) return whole.emoji;

  const matches = matchesIn(phrase.split(' '));
  const subjects = matches.filter(match => !CATEGORY_STOPWORDS.has(match.word));
  const pool = subjects.length ? subjects : matches;
  return (pool.find(match => match.tier === STRONG) ?? pool[0])?.emoji ?? DEFAULT_CATEGORY_EMOJI;
};
