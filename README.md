# Promptionary

A multiplayer party game that combines elements of Taboo and Pictionary using AI-generated images. Players take turns creating prompts for DALL·E to generate images based on target words, while avoiding excluded words.

## Features

- Multiplayer support for 3-8 players
- Real-time game flow with timers
- AI-generated images using DALL·E
- Word validation to prevent use of excluded words
- Score tracking and game history
- Responsive design using Chakra UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for DALL·E integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/promptionary.git
cd promptionary
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
VITE_OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

## Game Rules

1. Players join a game room using a room code
2. Each round, players are given a target word and a list of excluded words
3. Players have 30 seconds to write a prompt that describes the target word without using any excluded words
4. DALL·E generates images based on the prompts
5. Players vote on the best image (cannot vote for their own)
6. The player whose image gets the most votes wins the round
7. The game continues for a predetermined number of rounds
8. The player with the most points at the end wins

## Development

### Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── context/       # React context providers
  ├── utils/         # Utility functions
  ├── data/          # Game data and constants
  └── assets/        # Static assets
```

### Technologies Used

- React
- TypeScript
- Chakra UI
- React Router
- OpenAI API (DALL·E)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 