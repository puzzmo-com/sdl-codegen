import type { Prisma } from '@prisma/client';

export const standard = defineScenario<Prisma.SeasonCreateArgs>({
    season: {
        one: {
            data: {
                name: 'String2358270',
                startDate: '2022-06-29T23:14:20Z',
                endDate: '2022-06-29T23:14:20Z',
            },
        },
        two: {
            data: {
                name: 'String9676386',
                startDate: '2022-06-29T23:14:20Z',
                endDate: '2022-06-29T23:14:20Z',
            },
        },
    },
});

export type StandardScenario = typeof standard;
