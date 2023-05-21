import type { Prisma } from '@prisma/client';

export const standard = defineScenario<Prisma.GameCreateArgs>({
    game: {
        one: {
            data: {
                homeTeam: { create: { name: 'String8184842' } },
                awayTeam: { create: { name: 'String342092' } },
                startDateTime: new Date(),
                season: {
                    create: {
                        name: 'String8184842',
                        startDate: new Date(),
                        endDate: new Date(),
                    },
                },
            },
        },
        two: {
            data: {
                homeTeam: { create: { name: 'String2664163' } },
                awayTeam: { create: { name: 'String9522390' } },
                startDateTime: new Date(),
                season: {
                    create: {
                        name: 'String9522390',
                        startDate: new Date(),
                        endDate: new Date(),
                    },
                },
            },
        },
    },
});

export type StandardScenario = typeof standard;
