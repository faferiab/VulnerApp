import { Collection, Filter, MongoClient } from "mongodb";
import { DstValPair, IBaseRepository, PaginationOptions, UtamInformation } from "./base.repository";

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

type CollectionType = 'utam_categories' | 'utam_info' | 'utam_od';

class MongodbRepository implements IBaseRepository {
    private readonly logger = console;
    readonly categoryCollection: Collection<UtamCategoryEntity>
    readonly utamInfoCollection: Collection<UtamInfoEntity>
    readonly odCollection: Collection<OdEntity>;

    constructor(private readonly client: MongoClient) {
        this.categoryCollection = this.getCollection(this.client, 'utam_categories') as Collection<UtamCategoryEntity>;
        this.utamInfoCollection = this.getCollection(this.client, 'utam_info') as Collection<UtamInfoEntity>;
        this.odCollection = this.getCollection(this.client, 'utam_od') as Collection<OdEntity>;
    }

    private getCollection(client: MongoClient, collection: CollectionType) {
        switch (collection) {
            case 'utam_categories':
                return client.db("equidad").collection<UtamCategoryEntity>("utam_categories");
            case 'utam_info':
                return client.db("equidad").collection<UtamInfoEntity>("utam_info");
            case 'utam_od':
                return client.db("equidad").collection<OdEntity>("utam_od");
        }
    }

    async findByCategory(category: string, pagination?: PaginationOptions) {
        this.logger.log(`Finding by category: ${category}`);
        const result = await this.categoryCollection.find(
            { category: { $eq: category } },
            { limit: pagination?.limit, skip: pagination?.offset }
        ).toArray();
        return result;
    }

    async findByFilters(level: number[], income: number[], category: string, cityFunction: string,
        index: number[], educationLevel: string[], pagination?: PaginationOptions): Promise<UtamInformation[]> {
        const categoryData = await this.findByCategory(category);
        const filters: Filter<UtamInfoEntity> = {
            estrato: { $in: level },
            ingresos: { $gte: income[0], $lte: income[1] },
            [cityFunction + '_index']: { $gte: index[0], $lte: index[1] },
            nivel_educativo: { $in: educationLevel },
            _id: { $in: categoryData.map(cat => cat.utam_id) }
        };
        const cursor = await this.utamInfoCollection.find(filters).toArray();
        return cursor.map(item => ({
            ...item,
            id: item._id,
            value: categoryData.find(cat => cat.utam_id === item._id)?.value || null
        }));
    }

    async findByOd(utamOrigen: string, motivoViaje: string): Promise<DstValPair[]> {
        this.logger.log(`Finding OD by origen: ${utamOrigen} and motivoViaje: ${motivoViaje}`);
        const cursor = await this.odCollection.find(
            { origen: utamOrigen, motivo_viaje: motivoViaje, destino: { $ne: utamOrigen } },
            {
                limit: 10,
                sort: { value: -1 },
                projection: { destino: 1, value: 1 }
            }
        ).toArray();
        return cursor.map(item => ({
            destination: item.destino,
            value: item.value
        }));
    }
}

export const AppRepository = (context: { client: any }): IBaseRepository => new MongodbRepository(context.client);