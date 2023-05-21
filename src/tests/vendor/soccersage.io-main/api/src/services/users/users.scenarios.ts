import type { Prisma } from '@prisma/client';

export const standard = defineScenario<Prisma.UserCreateArgs>({
    user: {
        one: {
            data: {
                username: 'test',
                email: 'String8843735',
                hashedPassword: 'String',
                salt: 'String',
                roles: 'String',
            },
        },
        two: {
            data: {
                username: 'test2',
                email: 'String9261536',
                hashedPassword: 'String',
                salt: 'String',
                roles: 'String',
            },
        },
    },
});

export type StandardScenario = typeof standard;
