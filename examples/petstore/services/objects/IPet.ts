import { ICategory } from './ICategory';
import { ITag } from './ITag';
import { EStatus } from './EStatus';

export interface IPet {
    id: number;
    name: string;
    category?: ICategory;
    photoUrls: Array<string>;
    tags?: Array<ITag>;
    status?: EStatus;
}

export interface IPetFilters {
    id?: number;
    name?: string;
    category?: string | number;
    tags?: string | number;
    status?: EStatus;
}
