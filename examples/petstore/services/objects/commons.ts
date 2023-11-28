import { EStatus } from './EStatus';
import { IPet } from './IPet';

const generateRandomStatus = (): EStatus => {
    const statuses = Object.values(EStatus);
    return statuses[Math.floor(Math.random() * statuses.length)];
};

export const generatePets = (count: number): IPet[] => {
    const objects: IPet[] = [];

    for (let i = 0; i < count; i++) {
        objects.push({
            id: i + 1,
            name: `Name${i + 1}`,
            category: {
                id: i + 1,
                name: `Category${i + 1}`
            },
            photoUrls: [`http://photoUrl${i + 1}.com`],
            tags: [
                {
                    id: i + 1,
                    name: `Tag${i + 1}`
                }
            ],
            status: generateRandomStatus()
        });
    }

    return objects;
};
