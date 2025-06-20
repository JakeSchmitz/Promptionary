import prisma from '../db';

async function backfillPlayerGames() {
  const games = await prisma.game.findMany({});

  let created = 0;
  for (const game of games) {
    // Collect unique player IDs from images, votes, and prompt chains
    const imagePlayers = await prisma.image.findMany({
      where: { gameId: game.id },
      select: { playerId: true },
    });
    const votePlayers = await prisma.vote.findMany({
      where: { gameId: game.id },
      select: { voterId: true },
    });
    const promptChainPlayers = await prisma.promptChain.findMany({
      where: { gameId: game.id },
      select: { playerId: true },
    });

    const playerIds = new Set<string>();
    imagePlayers.forEach((p: { playerId: string }) => playerIds.add(p.playerId));
    votePlayers.forEach((p: { voterId: string }) => playerIds.add(p.voterId));
    promptChainPlayers.forEach((p: { playerId: string }) => playerIds.add(p.playerId));

    for (const playerId of playerIds) {
      // Check if PlayerGame already exists
      const existing = await prisma.playerGame.findUnique({
        where: { playerId_gameId: { playerId, gameId: game.id } },
      });
      if (!existing) {
        await prisma.playerGame.create({
          data: {
            playerId,
            gameId: game.id,
            isHost: playerId === game.hostId,
            // score field omitted, will default to 0
          },
        });
        created++;
        console.log(`Created PlayerGame for player ${playerId} in game ${game.id}`);
      }
    }
  }
  console.log(`Backfill complete. Created ${created} PlayerGame records.`);
  await prisma.$disconnect();
}

backfillPlayerGames().catch(e => {
  console.error(e);
  process.exit(1);
}); 