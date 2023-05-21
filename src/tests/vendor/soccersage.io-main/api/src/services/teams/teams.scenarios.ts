import type { Prisma } from '@prisma/client';

export const standard = defineScenario<Prisma.TeamCreateArgs>({
    team: {
        one: { data: { name: 'String7701370' } },
        two: { data: { name: 'String3485322' } },
    },
});

export type StandardScenario = typeof standard;
