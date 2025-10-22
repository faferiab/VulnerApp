export type RepositoryFilters = {
    [key: string]: any;
};

export type PaginationOptions = {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export type RepositoryResult<T> = {
    data: T[];
    total: number;
    hasMore: boolean;
};

export type UtamInfoEntity = {
    _id: string;
    adulto_mayor: number;
    nivel_educativo: string;
    ingresos: number;
    dif_comunicacion: number;
    dif_movimiento: number;
    discapacidad: number;
    edu_basica: number;
    edu_tec: number;
    edu_univ: number;
    estrato: number;
    sisben: number;
    trabajo_index: number;
    estudio_index: number;
    salud_index: number;
    redcul_index: number;
};

export type UtamCategoryEntity = {
    id: string;
    utam_id: string;
    category: string;
    value: number;
};

export type OdEntity = {
    id: string;
    origen: string;
    destino: string;
    motivo_viaje: string;
    value: number;
};

export type UtamInfoEntityWithValue = UtamInfoEntity & { value: number | null };

export interface IBaseRepository<T> {
    findById(id: string): Promise<T | null>;
    count(filters?: RepositoryFilters): Promise<number>;
}

/**
 * Category Repository Interface
 */
export interface ICategoriesRepository extends IBaseRepository<UtamCategoryEntity> {
    findByCategory(category: string, pagination?: PaginationOptions): Promise<RepositoryResult<UtamCategoryEntity>>;
    findByFilters(level: number[], income: number[], category: string, cityFunction: string, 
        index: number[], educationLevel: string[], pagination?: PaginationOptions): Promise<RepositoryResult<UtamInfoEntityWithValue>>;
    findByOd(utamOrigen: string, motivoViaje: string): Promise<OdEntity[]>;
}