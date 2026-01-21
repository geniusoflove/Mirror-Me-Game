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
};

/**
 * Normalize an answer for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Handle common plurals (convert to singular)
 */
export function normalizeAnswer(answer: string): string {
  let normalized = answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces

  // Check irregular plurals first
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
 * Group answers by their normalized form
 */
export function groupAnswers(players: Player[]): AnswerGroup[] {
  const answerMap = new Map<string, AnswerGroup>();

  for (const player of players) {
    if (player.isSpectator || !player.currentAnswer) continue;

    const normalized = normalizeAnswer(player.currentAnswer);

    if (answerMap.has(normalized)) {
      const group = answerMap.get(normalized)!;
      group.playerIds.push(player.id);
      group.playerNames.push(player.name);
    } else {
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
 * - 3 pts: Match with 1-2 other players (2-3 total)
 * - 1 pt: Unique answer (1 total)
 * - 0 pts: Match with 3+ others (4+ total) - too common
 */
export function calculatePoints(answerGroups: AnswerGroup[]): AnswerGroup[] {
  return answerGroups.map(group => {
    const count = group.playerIds.length;
    let points: number;

    if (count === 1) {
      // Unique answer
      points = 1;
    } else if (count >= 2 && count <= 3) {
      // Good match (2-3 players)
      points = 3;
    } else {
      // Too common (4+ players)
      points = 0;
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
