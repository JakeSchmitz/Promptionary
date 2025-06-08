export interface WordData {
  word: string
  excluded: string[]
}

export const gameWords: WordData[] = [
  {
    word: 'Elephant',
    excluded: ['Animal', 'Trunk', 'Big', 'Gray', 'Mammal', 'Africa']
  },
  {
    word: 'Pizza',
    excluded: ['Food', 'Cheese', 'Round', 'Italian', 'Dough', 'Toppings']
  },
  {
    word: 'Beach',
    excluded: ['Ocean', 'Sand', 'Sun', 'Water', 'Swimming', 'Vacation']
  },
  {
    word: 'Castle',
    excluded: ['Building', 'Stone', 'Medieval', 'King', 'Fortress', 'Tower']
  },
  {
    word: 'Dinosaur',
    excluded: ['Animal', 'Extinct', 'Reptile', 'Fossil', 'Prehistoric', 'Jurassic']
  },
  {
    word: 'Space',
    excluded: ['Stars', 'Planets', 'Galaxy', 'Universe', 'Astronaut', 'Rocket']
  },
  {
    word: 'Forest',
    excluded: ['Trees', 'Nature', 'Woods', 'Green', 'Plants', 'Wildlife']
  },
  {
    word: 'Robot',
    excluded: ['Machine', 'Metal', 'Technology', 'Automated', 'Mechanical', 'AI']
  },
  {
    word: 'Circus',
    excluded: ['Clown', 'Tent', 'Performance', 'Entertainment', 'Acrobat', 'Ring']
  },
  {
    word: 'Volcano',
    excluded: ['Mountain', 'Lava', 'Eruption', 'Magma', 'Fire', 'Smoke']
  }
] 