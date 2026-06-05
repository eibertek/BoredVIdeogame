import type { CustomerDef } from '../types/customer';

// ──────────────────────────────────────────────────────────────────────────────
//  Customer definitions + dialogue trees
//  Score system: start 10-90, need 120 to sell, 0 = customer walks out.
// ──────────────────────────────────────────────────────────────────────────────

export const CUSTOMERS: CustomerDef[] = [
  // ── AMISH (Easy) ────────────────────────────────────────────────────────────
  {
    id: 'amish',
    name: 'Amish',
    difficulty: 'easy',
    sprite: 'amish',
    scoreRange: [50, 80],
    successThreshold: 120,
    closingThreshold: 80,
    exchanges: [
      {
        customerText: 'Hi, I need an optical mouse. How much are they?',
        responses: [
          {
            text: 'We have options from $15 to $80 depending on the features.',
            delta: 20,
            flavourText: 'Amish nods with interest.',
          },
          {
            text: "What do you need it for? That way I can recommend the best one.",
            delta: 30,
            globalBonus: 5,
            flavourText: 'Great question for a salesperson!',
          },
          {
            text: "They're all the same, just pick whichever.",
            delta: -15,
            flavourText: 'Amish frowns.',
          },
        ],
      },
      {
        customerText: 'Do you have any wireless ones?',
        responses: [
          {
            text: 'Of course! The Logitech wireless is $35 and comes with 18 months warranty.',
            delta: 25,
            flavourText: 'Amish smiles hearing "warranty".',
          },
          {
            text: 'Yes, but they cost twice as much as the wired ones.',
            delta: 8,
            flavourText: "Hmm, not the best sales pitch.",
          },
          {
            text: 'Wireless has more latency, you are better off with a wired one.',
            delta: -20,
            flavourText: 'Amish starts glancing at the door.',
          },
        ],
      },
      {
        customerText: 'Can you do a deal on mouse + keyboard together?',
        isClosing: true,
        responses: [
          {
            text: 'For the combo I will do 10% off — let me set it up right now!',
            delta: 35,
            globalBonus: 10,
            effect: 'discount',
            effectValue: 10,
            flavourText: 'Combo sold!',
          },
          {
            text: 'No discount, but I will throw in the mousepad for free.',
            delta: 20,
            globalBonus: 5,
            flavourText: 'Amish accepts the deal.',
          },
          {
            text: 'No discounts or promos. List price only.',
            delta: -10,
            flavourText: 'Amish sighs.',
          },
        ],
      },
    ],

    // ── Rowan playing vs Amish: scam mode, harder to score ──────────────────
    playerVariants: {
      rowan: [
        {
          customerText: 'Hi, I need an optical mouse. How much are they?',
          responses: [
            {
              text: 'This premium model is normally $200, but TODAY only it is $80. Incredible discount.',
              delta: 15,
              flavourText: 'Amish seems convinced... for now.',
            },
            {
              text: 'Let me just check Reddit for the current market price. One second.',
              delta: -5,
              flavourText: 'Amish looks confused.',
            },
            {
              text: "Between you and me, this one kind of... fell off the back of a truck.",
              delta: -25,
              flavourText: 'Amish backs away slowly.',
            },
          ],
        },
        {
          customerText: 'Do you have any wireless ones?',
          responses: [
            {
              text: "I've got ONE left in the back. Special reserve. $120, but for you — $95. Don't tell the manager.",
              delta: 10,
              flavourText: "Amish is intrigued by the 'secret deal'.",
            },
            {
              text: "The wireless ones are... somewhere. I am more of a server guy, honestly.",
              delta: -10,
              flavourText: 'Amish frowns.',
            },
            {
              text: "Sir, I need you to promise not to look up that price online.",
              delta: -30,
              flavourText: '"Excuse me?" Amish takes out his phone.',
            },
          ],
        },
        {
          customerText: 'Can you do a deal on mouse + keyboard together?',
          isClosing: true,
          responses: [
            {
              text: "I will throw in an 'extended warranty' for just $30 extra. Total protection. Trust me.",
              delta: 20,
              globalBonus: 5,
              effect: 'surcharge',
              effectValue: 30,
              flavourText: 'Amish signs without reading the fine print.',
            },
            {
              text: "I can include a mousepad. It may have been used. Once.",
              delta: 5,
              flavourText: 'Amish accepts, nervously.',
            },
            {
              text: "Sure, combo deal — it is double the price but I call it a 'bundle premium'.",
              delta: -20,
              flavourText: '"I am reporting this." Amish leaves a 1-star review.',
            },
          ],
        },
      ],
    },
  },

  // ── BEN (Absurd) ─────────────────────────────────────────────────────────────
  {
    id: 'ben',
    name: 'Ben',
    difficulty: 'absurd',
    sprite: 'ben',
    scoreRange: [20, 60],
    successThreshold: 120,
    closingThreshold: 70,
    exchanges: [
      {
        customerText: 'Good morning. I would like to purchase this keyboard for a grand total of... ZERO dollars.',
        responses: [
          {
            text: 'Ha! Outrageous! But seriously, we have excellent options from $15 to $80.',
            delta: 25,
            flavourText: 'Ben laughs. That is a good sign.',
          },
          {
            text: 'We can look into a special order... for about $500 extra.',
            delta: -5,
            flavourText: 'Ben narrows his eyes.',
          },
          {
            text: 'Sir, that is simply not how a store works.',
            delta: -30,
            flavourText: 'Ben is offended. "I have RIGHTS as a customer!"',
          },
        ],
      },
      {
        customerText: 'Does this mechanical keyboard come with a GUARANTEE that it makes a lot of noise?',
        responses: [
          {
            text: 'Absolutely! The Blue switch is the loudest on the market. Your coworkers will hate you.',
            delta: 30,
            globalBonus: 5,
            flavourText: 'Ben claps. He loves it.',
          },
          {
            text: 'The noise level depends on how hard you type.',
            delta: 10,
            flavourText: 'Ben nods, somewhat convinced.',
          },
          {
            text: 'Sir, keyboards are not sold by noise level.',
            delta: -20,
            flavourText: '"At APPLE they explained things BETTER!"',
          },
        ],
      },
      {
        customerText: 'If I buy today, do I get the store WiFi free forever?',
        isClosing: true,
        responses: [
          {
            text: 'Not the WiFi — but I will throw in an ethernet cable and 3 months of antivirus!',
            delta: 30,
            globalBonus: 15,
            flavourText: 'Ben accepts the deal. Incredible.',
          },
          {
            text: 'We will give you a USB-C cable and a store sticker.',
            delta: 15,
            globalBonus: 5,
            flavourText: 'Ben takes the sticker very seriously.',
          },
          {
            text: 'Sir, the store WiFi is not for sale or gift.',
            delta: -25,
            flavourText: '"I am leaving a ONE STAR review!"',
          },
        ],
      },
    ],

    // ── Alan playing vs Ben: extra "shut up" option in exchanges 1 and 2 ─────
    playerVariants: {
      alan: [
        {
          customerText: 'Good morning. I would like to purchase this keyboard for a grand total of... ZERO dollars.',
          responses: [
            {
              text: 'Ha! Outrageous! But seriously, we have excellent options from $15 to $80.',
              delta: 25,
              flavourText: 'Ben laughs. That is a good sign.',
            },
            {
              text: 'We can look into a special order... for about $500 extra.',
              delta: -5,
              flavourText: 'Ben narrows his eyes.',
            },
            {
              text: 'Sir, that is simply not how a store works.',
              delta: -30,
              flavourText: 'Ben is offended. "I have RIGHTS as a customer!"',
            },
            {
              text: 'Shut up. Please. Just... shut up.',
              delta: -40,
              flavourText: 'Ben: "I am calling your manager. And your manager\'s manager."',
            },
          ],
        },
        {
          customerText: 'Does this mechanical keyboard come with a GUARANTEE that it makes a lot of noise?',
          responses: [
            {
              text: 'Absolutely! The Blue switch is the loudest on the market. Your coworkers will hate you.',
              delta: 30,
              globalBonus: 5,
              flavourText: 'Ben claps. He loves it.',
            },
            {
              text: 'The noise level depends on how hard you type.',
              delta: 10,
              flavourText: 'Ben nods, somewhat convinced.',
            },
            {
              text: 'Sir, keyboards are not sold by noise level.',
              delta: -20,
              flavourText: '"At APPLE they explained things BETTER!"',
            },
            {
              text: 'Shut up. Please. I am begging you. Shut. Up.',
              delta: -35,
              flavourText: 'A silence falls over the store. Ben looks genuinely hurt.',
            },
          ],
        },
        {
          customerText: 'If I buy today, do I get the store WiFi free forever?',
          isClosing: true,
          responses: [
            {
              text: 'Not the WiFi — but I will throw in an ethernet cable and 3 months of antivirus!',
              delta: 30,
              globalBonus: 15,
              flavourText: 'Ben accepts the deal. Incredible.',
            },
            {
              text: 'We will give you a USB-C cable and a store sticker.',
              delta: 15,
              globalBonus: 5,
              flavourText: 'Ben takes the sticker very seriously.',
            },
            {
              text: 'Sir, the store WiFi is not for sale or gift.',
              delta: -25,
              flavourText: '"I am leaving a ONE STAR review!"',
            },
          ],
        },
      ],
    },
  },

  // ── MARIANO (Easy) ───────────────────────────────────────────────────────────
  {
    id: 'mariano',
    name: 'Mariano',
    difficulty: 'easy',
    sprite: 'mariano',
    scoreRange: [45, 75],
    successThreshold: 120,
    closingThreshold: 75,
    exchanges: [
      {
        customerText: 'Hi, I am looking for a gaming keyboard. What do you have?',
        responses: [
          {
            text: 'We have the Logitech G series and the Redragon K552 — excellent value for money.',
            delta: 25,
            flavourText: 'Mariano leans forward with interest.',
          },
          {
            text: 'What games do you play? That helps us pick the right switch for you.',
            delta: 35,
            globalBonus: 5,
            flavourText: 'That is level 10 customer service!',
          },
          {
            text: 'Gaming keyboards are basically all the same.',
            delta: -10,
            flavourText: 'Mariano looks disappointed.',
          },
        ],
      },
      {
        customerText: 'Is it compatible with Mac? I have a MacBook.',
        responses: [
          {
            text: 'Yes! Plug and play. We can even remap Command and Alt for you.',
            delta: 20,
            globalBonus: 5,
            flavourText: 'Mariano pulls out his phone to check reviews.',
          },
          {
            text: 'It works, but some special keys do not respond on Mac.',
            delta: 5,
            flavourText: 'Mariano notes it on his phone.',
          },
          {
            text: 'Mac is complicated — you are better off with one designed for Windows.',
            delta: -20,
            flavourText: '"Hey, I know what I want..."',
          },
        ],
      },
      {
        customerText: 'Can I get an invoice? I need it for work.',
        isClosing: true,
        responses: [
          {
            text: 'Of course! Type A or B, whatever you need. We will email it right away.',
            delta: 30,
            globalBonus: 10,
            flavourText: 'Sold! Mariano reaches for his card.',
          },
          {
            text: 'Yes, it is generated within 24 business hours.',
            delta: 15,
            globalBonus: 5,
            flavourText: 'Mariano accepts.',
          },
          {
            text: 'We only have a cash receipt — will that work?',
            delta: -15,
            flavourText: '"Hmm, not sure if that works for the company..."',
          },
        ],
      },
    ],
  },
];

// ── Rowan interruption lines ──────────────────────────────────────────────────

export interface RowanLine {
  text: string;
  penalty: number;
}

export const ROWAN_LINES: RowanLine[] = [
  {
    text: 'Does this model have tech support? Because I AM tech support and I do not come in on weekends.',
    penalty: 20,
  },
  {
    text: 'Sorry to interrupt... has anyone seen support ticket number 4,847?',
    penalty: 15,
  },
  {
    text: 'That model has a known bug. Did I mention it has a bug? It has a bug.',
    penalty: 25,
  },
  {
    text: 'WiFi just went down. That is me, I am rebooting the router. Five minutes.',
    penalty: 20,
  },
  {
    text: "Warranty? Ahhhh, that is... complicated. I'll explain later.",
    penalty: 15,
  },
  {
    text: 'Do not touch the server. I am telling you for no particular reason. Just do not.',
    penalty: 18,
  },
  {
    text: 'Sure I can sell you that — I just need to check Reddit for the current market price. One second.',
    penalty: 22,
  },
  {
    text: 'Actually, do not buy that model. I saw on a forum that it causes fires. Probably.',
    penalty: 20,
  },
];
