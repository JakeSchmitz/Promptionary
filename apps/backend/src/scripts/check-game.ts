import prisma from '../db';

async function checkGame(roomId: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!game) {
      console.log('Game not found');
      return;
    }

    console.log('Game Information:');
    console.log('----------------');
    console.log(`Room ID: ${game.roomId}`);
    console.log(`Game ID: ${game.id}`);
    console.log(`Phase: ${game.phase}`);
    console.log(`Created At: ${game.createdAt}`);
    console.log('\nPlayers:');
    console.log('--------');
    game.playerGames.forEach((playerGame: any, index: number) => {
      const player = playerGame.player;
      console.log(`\nPlayer ${index + 1}:`);
      console.log(`  ID: ${player.id}`);
      console.log(`  Name: ${player.name}`);
      console.log(`  Is Host: ${playerGame.isHost}`);
      console.log(`  Score: ${playerGame.score}`);
      console.log(`  Email: ${player.email || 'N/A'}`);
      console.log(`  Created At: ${player.createdAt}`);
    });
  } catch (error) {
    console.error('Error checking game:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get roomId from command line argument
const roomId = process.argv[2];
if (!roomId) {
  console.error('Please provide a roomId as a command line argument');
  process.exit(1);
}

checkGame(roomId); 