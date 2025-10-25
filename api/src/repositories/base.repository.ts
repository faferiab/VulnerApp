export type RepositoryFilters = {
    [key: string]: any;
};

export type PaginationOptions = {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export type DstValPair = {
    destination: string;
    value: number;
}

export type UtamInformation = {
    id: string;
    edu_basica: number;
    edu_tec: number;
    edu_univ: number;
    discapacidad: number;
    sisben: number;
    adulto_mayor: number;
    value: number | null;
}

export type CategoryInformation = {
    utam_id: string;
    value: number;
}

export interface IBaseRepository {
    findByCategory(category: string, pagination?: PaginationOptions): Promise<CategoryInformation[]>;
    findByFilters(level: number[], income: number[], category: string, cityFunction: string, 
        index: number[], educationLevel: string[], pagination?: PaginationOptions): Promise<UtamInformation[]>;
    findByOd(utamOrigen: string, motivoViaje: string): Promise<DstValPair[]>;
}