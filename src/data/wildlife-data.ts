// Wildlife Safety Database
export interface Species {
  id: number;
  commonName: string;
  riskLevel: 'low' | 'medium' | 'high';
  keywords: string[];
  imageRef?: string;
  description: string;
}

export interface SafetyGuideline {
  id: number;
  speciesId: number;
  dos: string[];
  donts: string[];
  firstAid: string;
  authorityNotes?: string;
}

export interface RescueOrg {
  id: number;
  name: string;
  city: string;
  phone: string;
  whatsapp?: string;
  hours: string;
  speciesSupported: string[];
}

export interface Sighting {
  id: number;
  species: string;
  location: string;
  description: string;
  timestamp: Date;
  imageRef?: string;
}

// Seed Data
export const species: Species[] = [
  {
    id: 1,
    commonName: "Snake",
    riskLevel: "low",
    keywords: ["snake", "serpent", "slither", "coil", "hiss", "scales", "reptile"],
    description: "Most urban snakes are harmless rat snakes that help control rodent populations.",
    imageRef: "/assets/snake.jpg"
  },
  {
    id: 2,
    commonName: "Monkey",
    riskLevel: "medium",
    keywords: ["monkey", "primate", "macaque", "ape", "climbing", "troop", "aggressive"],
    description: "Urban monkeys can be territorial and may approach humans for food.",
    imageRef: "/assets/monkey.jpg"
  },
  {
    id: 3,
    commonName: "Stray Dog",
    riskLevel: "low",
    keywords: ["dog", "canine", "stray", "pack", "bark", "growl", "pet"],
    description: "Stray dogs are usually friendly but may be protective of their territory.",
    imageRef: "/assets/dog.jpg"
  }
];

export const safetyGuidelines: SafetyGuideline[] = [
  {
    id: 1,
    speciesId: 1,
    dos: [
      "Keep a safe distance of at least 6 feet",
      "Secure children and pets immediately",
      "Close doors and windows if indoors",
      "Call a professional snake rescuer",
      "Take a photo from distance for identification"
    ],
    donts: [
      "Do not try to catch or kill the snake",
      "Do not hit or poke with sticks",
      "Do not pour liquids on the snake",
      "Do not corner or trap the snake",
      "Do not panic or make sudden movements"
    ],
    firstAid: "If bitten: Keep the affected limb immobilized below heart level. Remove jewelry before swelling. Get to a hospital immediately. Do not use tourniquets, ice, or attempt to cut/suck the wound.",
    authorityNotes: "Most urban snakes are non-venomous. Professional identification is recommended."
  },
  {
    id: 2,
    speciesId: 2,
    dos: [
      "Avoid direct eye contact",
      "Secure all food items and bags",
      "Back away slowly without running",
      "Make yourself appear smaller",
      "Speak in calm, low tones"
    ],
    donts: [
      "Do not feed the monkey",
      "Do not tease or chase",
      "Do not make loud noises",
      "Do not show aggression",
      "Do not carry visible food"
    ],
    firstAid: "For monkey bites or scratches: Clean wound thoroughly with soap and water. Apply antiseptic. Seek medical attention for rabies evaluation and tetanus shot if needed.",
    authorityNotes: "Monkeys can carry diseases. Medical consultation is always recommended after contact."
  },
  {
    id: 3,
    speciesId: 3,
    dos: [
      "Stand still and avoid sudden movements",
      "Keep hands at your sides",
      "Speak calmly and slowly back away",
      "Avoid direct eye contact",
      "Let the dog sniff your scent from distance"
    ],
    donts: [
      "Do not run away",
      "Do not throw stones or objects",
      "Do not shout or make loud noises",
      "Do not corner the dog",
      "Do not reach out to pet unknown dogs"
    ],
    firstAid: "For dog bites: Control bleeding with clean cloth. Clean wound with soap and water. Apply antibiotic ointment. Seek medical attention for deep wounds or if dog's vaccination status is unknown.",
    authorityNotes: "Report aggressive stray dogs to local animal control. Many strays are friendly and may just need care."
  }
];

export const rescueOrgs: RescueOrg[] = [
  {
    id: 1,
    name: "Kerala State Wildlife Helpline",
    city: "Statewide",
    phone: "1800-425-4733",
    hours: "24x7",
    speciesSupported: ["snake", "monkey", "dog", "wildlife"]
  },
  {
    id: 2,
    name: "City Snake Rescue Team",
    city: "Kochi",
    phone: "9876543210",
    whatsapp: "9876543210",
    hours: "7am–10pm",
    speciesSupported: ["snake"]
  },
  {
    id: 3,
    name: "Urban Wildlife Aid",
    city: "Thiruvananthapuram",
    phone: "9990011223",
    hours: "24x7",
    speciesSupported: ["monkey", "dog"]
  },
  {
    id: 4,
    name: "Calicut Animal Rescue",
    city: "Kozhikode",
    phone: "9988776655",
    whatsapp: "9988776655",
    hours: "6am–11pm",
    speciesSupported: ["dog", "monkey"]
  },
  {
    id: 5,
    name: "Rapid Wildlife Response",
    city: "Thrissur",
    phone: "9445566778",
    hours: "24x7",
    speciesSupported: ["snake", "monkey", "dog"]
  }
];

// In-memory sightings store
export let sightings: Sighting[] = [];

export const addSighting = (sighting: Omit<Sighting, 'id' | 'timestamp'>) => {
  const newSighting: Sighting = {
    ...sighting,
    id: Date.now(),
    timestamp: new Date()
  };
  sightings.push(newSighting);
  return newSighting;
};