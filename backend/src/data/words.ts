export interface WordData {
  word: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const gameWords: WordData[] = [
  { word: 'cat', difficulty: 'easy' },
  { word: 'dog', difficulty: 'easy' },
  { word: 'house', difficulty: 'easy' },
  { word: 'tree', difficulty: 'easy' },
  { word: 'sun', difficulty: 'easy' },
  { word: 'moon', difficulty: 'easy' },
  { word: 'star', difficulty: 'easy' },
  { word: 'cloud', difficulty: 'easy' },
  { word: 'rain', difficulty: 'easy' },
  { word: 'snow', difficulty: 'easy' },
  { word: 'beach', difficulty: 'medium' },
  { word: 'mountain', difficulty: 'medium' },
  { word: 'forest', difficulty: 'medium' },
  { word: 'river', difficulty: 'medium' },
  { word: 'ocean', difficulty: 'medium' },
  { word: 'castle', difficulty: 'medium' },
  { word: 'bridge', difficulty: 'medium' },
  { word: 'tower', difficulty: 'medium' },
  { word: 'garden', difficulty: 'medium' },
  { word: 'fountain', difficulty: 'medium' },
  { word: 'dragon', difficulty: 'hard' },
  { word: 'unicorn', difficulty: 'hard' },
  { word: 'phoenix', difficulty: 'hard' },
  { word: 'mermaid', difficulty: 'hard' },
  { word: 'centaur', difficulty: 'hard' },
  { word: 'griffin', difficulty: 'hard' },
  { word: 'pegasus', difficulty: 'hard' },
  { word: 'kraken', difficulty: 'hard' },
  { word: 'sphinx', difficulty: 'hard' },
  { word: 'minotaur', difficulty: 'hard' },
] 