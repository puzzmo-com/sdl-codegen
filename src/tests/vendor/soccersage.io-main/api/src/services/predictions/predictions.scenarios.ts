import type { Prisma } from '@prisma/client';

export const standard = defineScenario<Prisma.PredictionCreateArgs>({
    prediction: {
        one: {
            data: {
                user: {
                    create: {
                        username: 'test',
                        email: 'test1',
                        hashedPassword: 'test',
                        salt: 'test',
                        roles: 'test',
                    },
                },
                prediction: 'String',
                game: {
                    create: {
                        homeTeamScore: 5278373,
                        awayTeamScore: 9262607,
                        homeTeam: { create: { name: 'String3223999' } },
                        awayTeam: { create: { name: 'String5108965' } },
                        startDateTime: new Date('2022-10-27'),
                        season: {
                            create: {
                                name: 'String5108965',
                                startDate: new Date(),
                                endDate: new Date(),
                            },
                        },
                    },
                },
                season: {
                    create: {
                        name: 'Test season 1',
                        startDate: new Date('2022-05-01'),
                        endDate: new Date('2022-05-31'),
                    },
                },
            },
        },
        two: {
            data: {
                user: {
                    create: {
                        username: 'test2',
                        email: 'test2',
                        hashedPassword: 'test',
                        salt: 'test',
                        roles: 'test',
                    },
                },
                prediction: 'String',
                game: {
                    create: {
                        homeTeamScore: 2210328,
                        awayTeamScore: 4786303,
                        homeTeam: { create: { name: 'String2218724' } },
                        awayTeam: { create: { name: 'String3400904' } },
                        startDateTime: new Date('2022-06-01'),
                        season: {
                            create: {
                                name: 'String3400904',
                                startDate: new Date(),
                                endDate: new Date(),
                            },
                        },
                    },
                },
                season: {
                    create: {
                        name: 'Test season 2',
                        startDate: new Date('2022-06-01'),
                        endDate: new Date('2022-06-30'),
                    },
                },
            },
        },
    },
});

export type StandardScenario = typeof standard;
