import { ICategory } from './ICategory';
import { ITag } from './ITag';
import { EStatus } from './EStatus';

export interface IPet {
    id?: number;
    name: string;
    category?: ICategory;
    photoUrls: string[];
    tags?: ITag[];
    status?: EStatus;
}
