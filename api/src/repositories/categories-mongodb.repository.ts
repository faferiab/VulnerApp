import { response } from "express";
import { ICategoriesRepository, OdEntity, PaginationOptions, RepositoryFilters, RepositoryResult, UtamCategoryEntity, UtamInfoEntity, UtamInfoEntityWithValue } from "./base-repository.interface";
import { Collection, Filter, MongoClient } from "mongodb";

type CollectionType = 'utam_categories' | 'utam_info' | 'utam_od';
export class CategoriesMongodbRepository implements ICategoriesRepository {
    readonly categoryCollection: Collection<UtamCategoryEntity>
    readonly utamInfoCollection: Collection<UtamInfoEntity>
    readonly odCollection: Collection<OdEntity>;
    constructor(private readonly client: MongoClient) {
        this.categoryCollection = this.getCollection(client, 'utam_categories') as Collection<UtamCategoryEntity>;
        this.utamInfoCollection = this.getCollection(client, 'utam_info') as Collection<UtamInfoEntity>;
        this.odCollection = this.getCollection(client, 'utam_od') as Collection<OdEntity>;
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
        const cursor = await this.categoryCollection.find({ category: { $eq: category } }, { limit: pagination?.limit, skip: pagination?.offset }).toArray();
        const total = await this.categoryCollection.countDocuments({ category: { $eq: category } })
        const hasMore = pagination ? (pagination.offset + cursor.length) < total : false;
        return {
            data: cursor,
            hasMore,
            total
        }
    }

    async findByFilters(level: number[], income: number[], category: string, cityFunction: string,
        index: number[], educationLevel: string[], pagination?: PaginationOptions): Promise<RepositoryResult<UtamInfoEntityWithValue>> {
        const { data: categoryData } = await this.findByCategory(category);
        const filters: Filter<UtamInfoEntity> = {
            estrato: { $in: level },
            ingresos: { $gte: income[0], $lte: income[1] },
            [cityFunction + '_index']: { $gte: index[0], $lte: index[1] },
            nivel_educativo: { $in: educationLevel },
            _id: { $in: categoryData.map(cat => cat.utam_id) }
        };
        const cursor = await this.utamInfoCollection.find(filters).toArray();
        const response = cursor.map(item => ({
            ...item,
            value: categoryData.find(cat => cat.utam_id === item._id)?.value || null
        }));
        const total = await this.utamInfoCollection.countDocuments(filters);
        const hasMore = pagination ? (pagination.offset + cursor.length) < total : false;
        return {
            data: response,
            hasMore,
            total
        }
    }

    async findByOd(utamOrigen: string, motivoViaje: string): Promise<OdEntity[]> {
        const cursor = await this.odCollection.find({ origen: utamOrigen, motivo_viaje: motivoViaje }, {limit: 10, sort: { value: -1 }}).toArray();
        return cursor;
    }

    findById(id: string): Promise<UtamCategoryEntity> {
        throw new Error("Method not implemented.");
    }
    count(filters?: RepositoryFilters): Promise<number> {
        throw new Error("Method not implemented.");
    }
}