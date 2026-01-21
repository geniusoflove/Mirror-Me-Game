// Blank Slate prompts - players complete the blank with one word
// Format: "___" represents where the player's answer goes

export const PROMPTS: string[] = [
  // Food & Drink
  "Birthday ___",
  "Chocolate ___",
  "Hot ___",
  "Cold ___",
  "Junk ___",
  "Fast ___",
  "Comfort ___",
  "___ sandwich",
  "___ pie",
  "___ soup",
  "___ salad",
  "___ sauce",
  "___ juice",
  "___ cake",
  "___ cream",

  // Animals
  "Wild ___",
  "Pet ___",
  "___ dog",
  "___ cat",
  "Sea ___",
  "___ bird",
  "Zoo ___",
  "Farm ___",
  "___ fish",
  "Baby ___",

  // Places
  "Dream ___",
  "Home ___",
  "___ vacation",
  "___ trip",
  "Beach ___",
  "Mountain ___",
  "___ city",
  "Theme ___",
  "___ store",
  "___ restaurant",

  // Actions/Activities
  "Running ___",
  "___ game",
  "___ sport",
  "Board ___",
  "Video ___",
  "Card ___",
  "___ hobby",
  "___ dance",
  "___ music",
  "Rock ___",

  // Time
  "Morning ___",
  "Night ___",
  "Summer ___",
  "Winter ___",
  "Weekend ___",
  "Holiday ___",
  "___ party",
  "___ celebration",

  // Descriptors
  "Big ___",
  "Little ___",
  "Old ___",
  "New ___",
  "Red ___",
  "Blue ___",
  "Green ___",
  "Black ___",
  "White ___",
  "Golden ___",

  // Body
  "___ hair",
  "___ eyes",
  "Broken ___",
  "Strong ___",

  // Relationships
  "Best ___",
  "Old ___",
  "___ friend",
  "Family ___",
  "___ love",
  "First ___",
  "Last ___",

  // Pop Culture
  "Super ___",
  "___ hero",
  "___ movie",
  "___ show",
  "___ star",
  "Famous ___",
  "___ song",
  "___ book",

  // Nature
  "___ tree",
  "___ flower",
  "Rain ___",
  "Sun ___",
  "Snow ___",
  "___ weather",
  "___ storm",

  // Objects
  "___ phone",
  "___ car",
  "___ house",
  "___ room",
  "___ bed",
  "___ chair",
  "___ table",
  "Magic ___",
  "Secret ___",

  // Feelings/States
  "Happy ___",
  "Sad ___",
  "Crazy ___",
  "Lazy ___",
  "Busy ___",
  "Scary ___",
  "Funny ___",
  "Silly ___",

  // Work/School
  "___ job",
  "___ class",
  "School ___",
  "Work ___",
  "___ test",
  "___ project",

  // Misc Common Phrases
  "Space ___",
  "Time ___",
  "Money ___",
  "Love ___",
  "Life ___",
  "Dream ___",
  "Power ___",
  "World ___",
  "High ___",
  "Low ___",
  "Top ___",
  "Bottom ___",
  "Front ___",
  "Back ___",
  "Side ___",
  "Middle ___",
  "Half ___",
  "Full ___",
  "Empty ___",
  "Double ___",
  "Triple ___",
  "Single ___",

  // More challenging/fun
  "Guilty ___",
  "Lucky ___",
  "Unlucky ___",
  "___ day",
  "___ night",
  "___ morning",
  "___ time",
  "Game ___",
  "Play ___",
  "Free ___",
  "Sweet ___",
  "Sour ___",
  "Bitter ___",
  "Spicy ___",
  "Smooth ___",
  "Rough ___",
  "Soft ___",
  "Hard ___",
  "Light ___",
  "Dark ___",
  "Bright ___",
  "Loud ___",
  "Quiet ___",
  "Quick ___",
  "Slow ___",
  "Sharp ___",
  "Dull ___",
  "Fresh ___",
  "Stale ___",
  "Clean ___",
  "Dirty ___",
  "Wet ___",
  "Dry ___",
  "Hot ___",
  "Cool ___",
  "Warm ___",
  "Frozen ___",

  // Compound word starters
  "Fire ___",
  "Water ___",
  "Air ___",
  "Earth ___",
  "Ice ___",
  "Thunder ___",
  "Lightning ___",

  // Common endings
  "___ ball",
  "___ man",
  "___ woman",
  "___ boy",
  "___ girl",
  "___ king",
  "___ queen",
  "___ land",
  "___ world",
];

// Fisher-Yates shuffle
export function shufflePrompts(prompts: string[]): string[] {
  const shuffled = [...prompts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get a set of unique prompts for a game
export function getGamePrompts(count: number): string[] {
  const shuffled = shufflePrompts(PROMPTS);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
