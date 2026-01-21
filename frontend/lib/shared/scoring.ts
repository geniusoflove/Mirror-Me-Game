import { AnswerGroup, Player, RoundResult } from './types';

// Common irregular plurals for normalization
const IRREGULAR_PLURALS: Record<string, string> = {
  'mice': 'mouse',
  'men': 'man',
  'women': 'woman',
  'children': 'child',
  'feet': 'foot',
  'teeth': 'tooth',
  'geese': 'goose',
  'people': 'person',
  'leaves': 'leaf',
  'lives': 'life',
  'wives': 'wife',
  'knives': 'knife',
  'wolves': 'wolf',
  'halves': 'half',
  'selves': 'self',
  'elves': 'elf',
  'loaves': 'loaf',
  'potatoes': 'potato',
  'tomatoes': 'tomato',
  'heroes': 'hero',
  'echoes': 'echo',
  'fish': 'fish',
  'sheep': 'sheep',
  'deer': 'deer',
  'series': 'series',
  'species': 'species',
  'cacti': 'cactus',
  'fungi': 'fungus',
  'octopi': 'octopus',
  'radii': 'radius',
  'appendices': 'appendix',
  'matrices': 'matrix',
  'vertices': 'vertex',
  'indices': 'index',
  'oxen': 'ox',
  'lice': 'louse',
  'alumni': 'alumnus',
  'criteria': 'criterion',
  'phenomena': 'phenomenon',
  'data': 'datum',
  'media': 'medium',
};

// Common misspellings and typos
const COMMON_MISSPELLINGS: Record<string, string> = {
  'wierd': 'weird',
  'recieve': 'receive',
  'beleive': 'believe',
  'freind': 'friend',
  'thier': 'their',
  'definately': 'definitely',
  'occured': 'occurred',
  'seperate': 'separate',
  'untill': 'until',
  'tommorow': 'tomorrow',
  'accomodate': 'accommodate',
  'occurence': 'occurrence',
  'neccessary': 'necessary',
  'goverment': 'government',
  'enviroment': 'environment',
  'resturant': 'restaurant',
  'restaraunt': 'restaurant',
  'calender': 'calendar',
  'comming': 'coming',
  'begining': 'beginning',
  'beatiful': 'beautiful',
  'buisness': 'business',
  'wierd': 'weird',
  'concious': 'conscious',
  'foriegn': 'foreign',
  'gaurd': 'guard',
  'happend': 'happened',
  'harrass': 'harass',
  'independant': 'independent',
  'knowlege': 'knowledge',
  'liason': 'liaison',
  'lightening': 'lightning',
  'maintainance': 'maintenance',
  'millenium': 'millennium',
  'minature': 'miniature',
  'mischievious': 'mischievous',
  'noticable': 'noticeable',
  'paralell': 'parallel',
  'persistant': 'persistent',
  'posession': 'possession',
  'privelege': 'privilege',
  'publically': 'publicly',
  'recomend': 'recommend',
  'refered': 'referred',
  'relevent': 'relevant',
  'religous': 'religious',
  'rythm': 'rhythm',
  'sieze': 'seize',
  'suprise': 'surprise',
  'truely': 'truly',
  'vaccuum': 'vacuum',
  'wether': 'weather',
  'writting': 'writing',
  // Common game-related typos
  'baloon': 'balloon',
  'choclate': 'chocolate',
  'sandwitch': 'sandwich',
  'hamburgur': 'hamburger',
  'spagetti': 'spaghetti',
  'brocolli': 'broccoli',
  'guiter': 'guitar',
  'mountian': 'mountain',
  'monky': 'monkey',
  'elphant': 'elephant',
  'giraff': 'giraffe',
  'dinasaur': 'dinosaur',
  'dinasour': 'dinosaur',
  'alein': 'alien',
  'pinapple': 'pineapple',
  'strawbery': 'strawberry',
  'cherrys': 'cherry',
  'banna': 'banana',
  'oarnge': 'orange',
  'purpel': 'purple',
};

// Number words to normalize
const NUMBER_WORDS: Record<string, string> = {
  'zero': '0',
  'one': '1',
  'two': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',
  'ten': '10',
  'first': '1st',
  'second': '2nd',
  'third': '3rd',
};

// British vs American spelling equivalents
const SPELLING_VARIANTS: Record<string, string> = {
  'colour': 'color',
  'favourite': 'favorite',
  'honour': 'honor',
  'neighbour': 'neighbor',
  'theatre': 'theater',
  'centre': 'center',
  'metre': 'meter',
  'litre': 'liter',
  'defence': 'defense',
  'offence': 'offense',
  'licence': 'license',
  'practise': 'practice',
  'analyse': 'analyze',
  'organise': 'organize',
  'realise': 'realize',
  'recognise': 'recognize',
  'apologise': 'apologize',
  'travelling': 'traveling',
  'cancelled': 'canceled',
  'jewellery': 'jewelry',
  'grey': 'gray',
  'cheque': 'check',
  'catalogue': 'catalog',
  'dialogue': 'dialog',
  'programme': 'program',
  'aeroplane': 'airplane',
  'aluminium': 'aluminum',
  'moustache': 'mustache',
  'pyjamas': 'pajamas',
  'doughnut': 'donut',
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Get maximum allowed edit distance based on word length
 */
function getMaxEditDistance(wordLength: number): number {
  if (wordLength <= 3) return 0;  // Short words must match exactly
  if (wordLength <= 5) return 1;  // Medium words allow 1 typo
  return 2;                        // Long words allow 2 typos
}

/**
 * Check if two answers are similar enough to be considered a match
 */
function areSimilarAnswers(a: string, b: string): boolean {
  if (a === b) return true;

  const maxDist = Math.min(getMaxEditDistance(a.length), getMaxEditDistance(b.length));
  if (maxDist === 0) return false;

  const distance = levenshteinDistance(a, b);
  return distance <= maxDist;
}

/**
 * Normalize an answer for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Remove articles (a, an, the)
 * - Handle hyphens and compound words
 * - Fix common misspellings
 * - Handle British/American spelling
 * - Handle common plurals (convert to singular)
 */
export function normalizeAnswer(answer: string): string {
  let normalized = answer
    .toLowerCase()
    .trim()
    // Remove all punctuation except hyphens initially
    .replace(/[^\w\s-]/g, '')
    // Replace hyphens with spaces (ice-cream -> ice cream)
    .replace(/-/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading articles (a, an, the)
  normalized = normalized.replace(/^(a|an|the)\s+/i, '');

  // Remove spaces for compound word matching (ice cream -> icecream)
  // We'll keep both versions and use the no-space version for matching
  const noSpaces = normalized.replace(/\s/g, '');

  // Use no-spaces version if it's a compound word (2 short words)
  const words = normalized.split(' ');
  if (words.length === 2 && words.every(w => w.length <= 6)) {
    normalized = noSpaces;
  }

  // Fix common misspellings
  if (COMMON_MISSPELLINGS[normalized]) {
    normalized = COMMON_MISSPELLINGS[normalized];
  }

  // Normalize British to American spelling
  if (SPELLING_VARIANTS[normalized]) {
    normalized = SPELLING_VARIANTS[normalized];
  }

  // Convert number words to digits for consistency
  if (NUMBER_WORDS[normalized]) {
    normalized = NUMBER_WORDS[normalized];
  }

  // Check irregular plurals
  if (IRREGULAR_PLURALS[normalized]) {
    return IRREGULAR_PLURALS[normalized];
  }

  // Handle regular plurals (simple rules)
  // Words ending in 'ies' -> 'y' (e.g., 'puppies' -> 'puppy')
  if (normalized.endsWith('ies') && normalized.length > 3) {
    return normalized.slice(0, -3) + 'y';
  }

  // Words ending in 'es' after s, x, z, ch, sh -> remove 'es'
  if (normalized.endsWith('es') && normalized.length > 2) {
    const stem = normalized.slice(0, -2);
    if (stem.endsWith('s') || stem.endsWith('x') || stem.endsWith('z') ||
        stem.endsWith('ch') || stem.endsWith('sh')) {
      return stem;
    }
  }

  // Words ending in 's' -> remove 's' (most common case)
  if (normalized.endsWith('s') && normalized.length > 1 && !normalized.endsWith('ss')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Group answers by their normalized form, with fuzzy matching for typos
 */
export function groupAnswers(players: Player[]): AnswerGroup[] {
  const answerMap = new Map<string, AnswerGroup>();
  const normalizedKeys: string[] = []; // Track all normalized answers for fuzzy matching

  for (const player of players) {
    if (player.isSpectator || !player.currentAnswer) continue;

    const normalized = normalizeAnswer(player.currentAnswer);

    // First check for exact match
    if (answerMap.has(normalized)) {
      const group = answerMap.get(normalized)!;
      group.playerIds.push(player.id);
      group.playerNames.push(player.name);
      continue;
    }

    // Check for fuzzy match with existing answers
    let matchedKey: string | null = null;
    for (const existingKey of normalizedKeys) {
      if (areSimilarAnswers(normalized, existingKey)) {
        matchedKey = existingKey;
        break;
      }
    }

    if (matchedKey) {
      const group = answerMap.get(matchedKey)!;
      group.playerIds.push(player.id);
      group.playerNames.push(player.name);
    } else {
      // New unique answer
      normalizedKeys.push(normalized);
      answerMap.set(normalized, {
        answer: player.currentAnswer, // Keep original for display
        normalizedAnswer: normalized,
        playerIds: [player.id],
        playerNames: [player.name],
        points: 0, // Will be calculated
      });
    }
  }

  return Array.from(answerMap.values());
}

/**
 * Calculate points for each answer group:
 * - 3 pts: Perfect match (exactly 2 players)
 * - 1 pt: More than 2 players match (3+ total)
 * - 0 pts: No match (unique answer)
 */
export function calculatePoints(answerGroups: AnswerGroup[]): AnswerGroup[] {
  return answerGroups.map(group => {
    const count = group.playerIds.length;
    let points: number;

    if (count === 1) {
      // No match - unique answer
      points = 0;
    } else if (count === 2) {
      // Perfect match (exactly 2 players)
      points = 3;
    } else {
      // More than 2 matched (3+ players)
      points = 1;
    }

    return { ...group, points };
  });
}

/**
 * Calculate the full round result
 */
export function calculateRoundResult(
  round: number,
  prompt: string,
  players: Player[]
): RoundResult {
  const answerGroups = groupAnswers(players);
  const scoredGroups = calculatePoints(answerGroups);

  // Calculate individual player scores for this round
  const playerScores: { playerId: string; points: number }[] = [];

  for (const group of scoredGroups) {
    for (const playerId of group.playerIds) {
      playerScores.push({ playerId, points: group.points });
    }
  }

  // Players who didn't answer get 0 points
  for (const player of players) {
    if (!player.isSpectator && !player.currentAnswer) {
      playerScores.push({ playerId: player.id, points: 0 });
    }
  }

  return {
    round,
    prompt,
    answerGroups: scoredGroups,
    playerScores,
  };
}
