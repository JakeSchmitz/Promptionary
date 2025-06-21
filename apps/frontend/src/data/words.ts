export interface WordData {
  word: string
  difficulty: 'easy' | 'medium' | 'hard'
  exclusionWords: string[]
}

export const gameWords: WordData[] = [
  {
    word: 'Elephant',
    difficulty: 'easy',
    exclusionWords: ['Animal', 'Trunk', 'Big', 'Gray', 'Mammal', 'Africa', 'Tusk', 'Ear', 'Tail']
  },
  {
    word: 'Pizza',
    difficulty: 'easy',
    exclusionWords: ['Food', 'Cheese', 'Round', 'Italian', 'Dough', 'Toppings', 'Slice', 'Oven', 'Delivery']
  },
  {
    word: 'Beach',
    difficulty: 'easy',
    exclusionWords: ['Ocean', 'Sand', 'Sun', 'Water', 'Swimming', 'Vacation', 'Wave', 'Shell', 'Umbrella']
  },
  {
    word: 'Castle',
    difficulty: 'easy',
    exclusionWords: ['Building', 'Stone', 'Medieval', 'King', 'Fortress', 'Tower', 'Moat', 'Knight', 'Dungeon']
  },
  {
    word: 'Dinosaur',
    difficulty: 'easy',
    exclusionWords: ['Animal', 'Extinct', 'Reptile', 'Fossil', 'Prehistoric', 'Jurassic', 'Bone', 'Scale', 'Tail']
  },
  {
    word: 'Space',
    difficulty: 'easy',
    exclusionWords: ['Stars', 'Planets', 'Galaxy', 'Universe', 'Astronaut', 'Rocket', 'Moon', 'Sun', 'Comet']
  },
  {
    word: 'Forest',
    difficulty: 'easy',
    exclusionWords: ['Trees', 'Nature', 'Woods', 'Green', 'Plants', 'Wildlife', 'Leaf', 'Branch', 'Bark']
  },
  {
    word: 'Robot',
    difficulty: 'easy',
    exclusionWords: ['Machine', 'Metal', 'Technology', 'Automated', 'Mechanical', 'AI', 'Circuit', 'Battery', 'Sensor']
  },
  {
    word: 'Circus',
    difficulty: 'easy',
    exclusionWords: ['Clown', 'Tent', 'Performance', 'Entertainment', 'Acrobat', 'Ring', 'Elephant', 'Trapeze', 'Juggler']
  },
  {
    word: 'Volcano',
    difficulty: 'easy',
    exclusionWords: ['Mountain', 'Lava', 'Eruption', 'Magma', 'Fire', 'Smoke', 'Crater', 'Ash', 'Geyser']
  }
] 