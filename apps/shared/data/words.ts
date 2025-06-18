export interface WordData {
  word: string
  difficulty: 'easy' | 'medium' | 'hard'
  exclusionWords: string[]
}

export const gameWords: WordData[] = [
  // Iconic Movie Characters
  { 
    word: 'Darth Vader', 
    difficulty: 'medium', 
    exclusionWords: ['star wars', 'vader', 'sith', 'dark side', 'force', 'lightsaber', 'helmet', 'breathing', 'anakin'] 
  },
  { 
    word: 'Iron Man', 
    difficulty: 'medium', 
    exclusionWords: ['tony stark', 'marvel', 'suit', 'armor', 'avengers', 'arc reactor', 'tech', 'flying', 'red'] 
  },
  { 
    word: 'Mickey Mouse', 
    difficulty: 'easy', 
    exclusionWords: ['disney', 'mouse', 'ears', 'cartoon', 'mickey', 'minnie', 'disneyland', 'walt', 'animation'] 
  },
  
  // Sports
  { 
    word: 'Basketball', 
    difficulty: 'easy', 
    exclusionWords: ['hoop', 'court', 'ball', 'nba', 'dribble', 'shoot', 'game', 'sport', 'player'] 
  },
  { 
    word: 'Formula One', 
    difficulty: 'medium', 
    exclusionWords: ['racing', 'car', 'driver', 'track', 'speed', 'race', 'f1', 'grand prix', 'podium'] 
  },
  { 
    word: 'Surfing', 
    difficulty: 'medium', 
    exclusionWords: ['wave', 'ocean', 'board', 'beach', 'water', 'surf', 'ride', 'sea', 'shore'] 
  },
  
  // Fantasy & Mythology
  { 
    word: 'Dragon', 
    difficulty: 'medium', 
    exclusionWords: ['fire', 'wing', 'scale', 'mythical', 'beast', 'fly', 'breath', 'creature', 'monster'] 
  },
  { 
    word: 'Phoenix', 
    difficulty: 'hard', 
    exclusionWords: ['fire', 'bird', 'rebirth', 'mythical', 'rise', 'flame', 'immortal', 'ashes', 'legend'] 
  },
  
  // Landmarks & Architecture
  { 
    word: 'Eiffel Tower', 
    difficulty: 'medium', 
    exclusionWords: ['paris', 'france', 'tower', 'landmark', 'iron', 'structure', 'tourist', 'city', 'monument'] 
  },
  { 
    word: 'Taj Mahal', 
    difficulty: 'medium', 
    exclusionWords: ['india', 'marble', 'palace', 'tomb', 'architecture', 'white', 'dome', 'monument', 'agra'] 
  },
  
  // Nature & Environment
  { 
    word: 'Aurora Borealis', 
    difficulty: 'hard', 
    exclusionWords: ['northern lights', 'sky', 'color', 'aurora', 'night', 'light', 'polar', 'dance', 'green'] 
  },
  { 
    word: 'Volcano', 
    difficulty: 'medium', 
    exclusionWords: ['mountain', 'lava', 'eruption', 'magma', 'fire', 'smoke', 'crater', 'ash', 'geyser'] 
  },
  
  // Technology & Innovation
  { 
    word: 'Robot', 
    difficulty: 'medium', 
    exclusionWords: ['machine', 'metal', 'technology', 'automated', 'mechanical', 'ai', 'circuit', 'battery', 'sensor'] 
  },
  { 
    word: 'Space Station', 
    difficulty: 'hard', 
    exclusionWords: ['space', 'orbit', 'astronaut', 'satellite', 'nasa', 'iss', 'station', 'gravity', 'module'] 
  },
  
  // Entertainment & Culture
  { 
    word: 'Circus', 
    difficulty: 'medium', 
    exclusionWords: ['clown', 'tent', 'performance', 'entertainment', 'acrobat', 'ring', 'elephant', 'trapeze', 'juggler'] 
  },
  { 
    word: 'Jazz Band', 
    difficulty: 'hard', 
    exclusionWords: ['music', 'jazz', 'band', 'instrument', 'saxophone', 'trumpet', 'piano', 'drum', 'performance'] 
  }
] 