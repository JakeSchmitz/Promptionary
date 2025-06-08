export interface WordData {
  word: string
  excluded: string[]
}

export const gameWords: WordData[] = [
  {
    word: 'Elephant',
    excluded: ['Animal', 'Trunk', 'Big', 'Gray', 'Mammal', 'Africa', 'Tusk', 'Ear', 'Tail']
  },
  {
    word: 'Pizza',
    excluded: ['Food', 'Cheese', 'Round', 'Italian', 'Dough', 'Toppings', 'Slice', 'Oven', 'Delivery']
  },
  {
    word: 'Beach',
    excluded: ['Ocean', 'Sand', 'Sun', 'Water', 'Swimming', 'Vacation', 'Wave', 'Shell', 'Umbrella']
  },
  {
    word: 'Castle',
    excluded: ['Building', 'Stone', 'Medieval', 'King', 'Fortress', 'Tower', 'Moat', 'Knight', 'Dungeon']
  },
  {
    word: 'Dinosaur',
    excluded: ['Animal', 'Extinct', 'Reptile', 'Fossil', 'Prehistoric', 'Jurassic', 'Bone', 'Scale', 'Tail']
  },
  {
    word: 'Space',
    excluded: ['Stars', 'Planets', 'Galaxy', 'Universe', 'Astronaut', 'Rocket', 'Moon', 'Sun', 'Comet']
  },
  {
    word: 'Forest',
    excluded: ['Trees', 'Nature', 'Woods', 'Green', 'Plants', 'Wildlife', 'Leaf', 'Branch', 'Bark']
  },
  {
    word: 'Robot',
    excluded: ['Machine', 'Metal', 'Technology', 'Automated', 'Mechanical', 'AI', 'Circuit', 'Battery', 'Sensor']
  },
  {
    word: 'Circus',
    excluded: ['Clown', 'Tent', 'Performance', 'Entertainment', 'Acrobat', 'Ring', 'Elephant', 'Trapeze', 'Juggler']
  },
  {
    word: 'Volcano',
    excluded: ['Mountain', 'Lava', 'Eruption', 'Magma', 'Fire', 'Smoke', 'Crater', 'Ash', 'Geyser']
  }
] 