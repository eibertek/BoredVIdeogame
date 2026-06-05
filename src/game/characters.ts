export interface CharConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  shirtColor: number;
  hairColor: number;
  skinColor: number;
  pantsColor: number;
  hasGlasses?: boolean;
  hasTie?: boolean;
  tieColor?: number;
  expression: 'happy' | 'neutral' | 'grumpy';
  startTile: { x: number; y: number };
  patrolPoints: { x: number; y: number }[];
  dialogues: string[];
  cardColor: string; // tailwind gradient
  /** Max random bonus applied per counter response (0 = no bonus). */
  counterBonus?: number;
  /** Max random curse applied per counter response (0 = no curse). Range = [-curse, +bonus]. */
  counterCurse?: number;
}

export const CHARACTERS: CharConfig[] = [
  {
    id: 'rowan',
    name: 'Rowan',
    role: 'Manager',
    description: '"I\'m the overlord Manager"',
    shirtColor: 0x111111,
    hairColor: 0x1f2937,
    skinColor: 0xfdddb4,
    pantsColor: 0x374151,
    hasGlasses: true,
    expression: 'grumpy',
    cardColor: 'from-purple-900 to-purple-700',
    counterBonus: 5, counterCurse: 10,
    startTile: { x: 6, y: 12 },
    patrolPoints: [{ x: 6, y: 12 }, { x: 11, y: 12 }, { x: 11, y: 10 }, { x: 6, y: 10 }],
    dialogues: [
      'Have you tried turning it off and on again?',
      "That's not my department.",
      'I have a system. You just don\'t understand it.',
      'Did you fill out a support ticket? No? Then I\'m busy.',
      'The server room is MY domain. Back off.',
    ],
  },
  {
    id: 'alan',
    name: 'Alan',
    role: 'Sales Rep',
    description: '"Can I help you find something?"',
    shirtColor: 0xef4444,
    hairColor: 0xd4a853,
    skinColor: 0xf5cba7,
    pantsColor: 0xc8a96e,
    expression: 'happy',
    cardColor: 'from-blue-900 to-blue-600',
    counterBonus: 1, counterCurse: 0,
    startTile: { x: 7, y: 12 },
    patrolPoints: [{ x: 7, y: 12 }, { x: 4, y: 12 }, { x: 10, y: 12 }, { x: 7, y: 11 }],
    dialogues: [
      'Can I help you find something?',
      "That's a great question! Let me get my manager.",
      'We have a fantastic deal on that right now!',
      'I am the BEST salesperson here. Ask anyone.',
      'Customer satisfaction is my number one priority!',
    ],
  },
  {
    id: 'adam',
    name: 'Adam',
    role: 'Sales Rep',
    description: '"I just work here, man."',
    shirtColor: 0xef4444,
    hairColor: 0x78350f,
    skinColor: 0xf0be8a,
    pantsColor: 0x374151,
    expression: 'neutral',
    cardColor: 'from-emerald-900 to-emerald-600',
    counterBonus: 3, counterCurse: 3,
    startTile: { x: 24, y: 9 },
    patrolPoints: [{ x: 24, y: 9 }, { x: 31, y: 9 }, { x: 31, y: 18 }, { x: 22, y: 18 }],
    dialogues: [
      'I just work here, man.',
      "Alan said what now? That's not even close to true.",
      'Do we have a coffee machine? I need coffee.',
      "I've been here six years and I still don't know what we sell.",
      'Has anyone seen my stapler?',
    ],
  },
  {
    id: 'ellie',
    name: 'Ellie',
    role: 'Store Manager',
    description: '"I\'m will took my day off."',
    shirtColor: 0xef4444,
    hairColor: 0x44403c,
    skinColor: 0xfdddb4,
    pantsColor: 0x1f2937,
    expression: 'neutral',
    cardColor: 'from-pink-900 to-pink-600',
    counterBonus: 2, counterCurse: 4,
    startTile: { x: 19, y: 25 },
    patrolPoints: [{ x: 19, y: 25 }, { x: 14, y: 15 }, { x: 19, y: 10 }, { x: 14, y: 25 }],
    dialogues: [
      "What can i do for you?",
      'Not going to work pal',
      "We have to ask rowan if he´s a robot",
    ],
  },
  {
    id: 'brit',
    name: 'Brit',
    role: 'Sales & Marketing',
    description: '"Okay, so here\'s what we do..."',
    shirtColor: 0xef4444,
    hairColor: 0xfcd34d,
    skinColor: 0xffe0b5,
    pantsColor: 0x1e3a5f,
    expression: 'happy',
    cardColor: 'from-amber-900 to-amber-600',
    counterBonus: 4, counterCurse: 10,
    startTile: { x: 22, y: 17 },
    patrolPoints: [{ x: 22, y: 17 }, { x: 28, y: 17 }, { x: 28, y: 22 }, { x: 18, y: 22 }],
    dialogues: [
      'Okay so here is what we do. Big brain time.',
      "I've got an idea that's going to change everything.",
      'Did you see my presentation? The one with the graphs?',
      "We need more synergy. I'm serious about the synergy.",
    ],
  },
  {
    id: 'amish',
    name: 'Amish',
    role: 'IT & Sales',
    description: '"I just want to buy a mouse, man"',
    shirtColor: 0xea580c,
    hairColor: 0x111827,
    skinColor: 0xc68642,
    pantsColor: 0x374151,
    expression: 'neutral',
    cardColor: 'from-orange-900 to-orange-600',
    startTile: { x: 24, y: 27 },
    patrolPoints: [
      { x: 24, y: 27 }, // door start (col 24, row 28 = DOOR — body safe)
      { x: 24, y: 26 }, // step up: body no longer overlaps row-28 WINDOW zone
      { x: 8,  y: 26 }, // move left in row 26 (row 27 below = BFLOOR, clear)
      { x: 8,  y: 15 }, // up col-8 corridor to counter area
      { x: 7,  y: 15 }, // at counter (long pause handled in code)
      { x: 8,  y: 15 }, // step back
      { x: 8,  y: 26 }, // return to lobby row 26
      { x: 24, y: 26 }, // move right in row 26
      { x: 24, y: 27 }, // step back to door
    ],
    dialogues: [
      'PLEASE DONT',
      "I want to buy a keyboard, 80% discount",
      'I learned this on YouTube. It should work.',
      "I´m kind a gamer, you know?",
    ],
  },
  {
    id: 'ben',
    name: 'Ben',
    role: 'VIP Customer',
    description: '"I need to speak to your manager."',
    shirtColor: 0x6b7280,
    hairColor: 0x292524,
    skinColor: 0xffd9b3,
    pantsColor: 0x374151,
    hasTie: true,
    tieColor: 0xef4444,
    expression: 'neutral',
    cardColor: 'from-gray-800 to-gray-600',
    startTile: { x: 16, y: 27 },
    patrolPoints: [
      { x: 16, y: 27 }, // door start (col 16, row 28 = DOOR — body safe)
      { x: 16, y: 26 }, // step up: body no longer overlaps row-28 WINDOW zone
      { x: 8,  y: 26 }, // move left in row 26 (row 27 below = BFLOOR, clear)
      { x: 8,  y: 15 }, // up col-8 corridor to counter area
      { x: 7,  y: 15 }, // at counter (long pause handled in code)
      { x: 8,  y: 15 }, // step back
      { x: 8,  y: 26 }, // return to lobby row 26
      { x: 16, y: 26 }, // move right in row 26
      { x: 16, y: 27 }, // step back to door
    ],
    dialogues: [
      'I need to speak to your manager. Immediately.',
      "I've been a customer here for FIFTEEN YEARS.",
      "This is FREE, right?",
      'OUTRAGEOUS',
      "I'll be leaving a review. You won't like the review.",
    ],
  },
  {
    id: 'mariano',
    name: 'Mariano',
    role: 'Customer',
    description: '"Just a fan"',
    shirtColor: 0x1e40af,
    hairColor: 0x2d1b00,
    skinColor: 0xc8956c,
    pantsColor: 0x374151,
    expression: 'neutral',
    cardColor: 'from-blue-900 to-blue-700',
    startTile: { x: 8, y: 26 },
    patrolPoints: [
      { x: 8,  y: 26 }, // col-8 in row 26 — avoids row-28 WINDOW at col 8
      { x: 8,  y: 15 }, // up col-8 corridor to counter area
      { x: 7,  y: 15 }, // at counter (long pause handled in code)
      { x: 8,  y: 15 }, // step back
      { x: 8,  y: 26 }, // return to lobby
    ],
    dialogues: [
      'Hi, I am looking for the keyboard section.',
      'Do you issue invoices? I need one for the company.',
      'Is this the gaming model they recommended online?',
      'I am on a budget, but I want good value for money.',
      'Hey, when is the Logitech G Pro back in stock?',
    ],
  },
];

export const getCharacter = (id: string): CharConfig =>
  CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
