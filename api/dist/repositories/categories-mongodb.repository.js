"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesMongodbRepository = void 0;
class CategoriesMongodbRepository {
    constructor(client) {
        this.client = client;
        this.categoryCollection = this.getCollection(client, 'utam_categories');
        this.utamInfoCollection = this.getCollection(client, 'utam_info');
        this.odCollection = this.getCollection(client, 'utam_od');
    }
    getCollection(client, collection) {
        switch (collection) {
            case 'utam_categories':
                return client.db("equidad").collection("utam_categories");
            case 'utam_info':
                return client.db("equidad").collection("utam_info");
            case 'utam_od':
                return client.db("equidad").collection("utam_od");
        }
    }
    findByCategory(category, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            const cursor = yield this.categoryCollection.find({ category: { $eq: category } }, { limit: pagination === null || pagination === void 0 ? void 0 : pagination.limit, skip: pagination === null || pagination === void 0 ? void 0 : pagination.offset }).toArray();
            const total = yield this.categoryCollection.countDocuments({ category: { $eq: category } });
            const hasMore = pagination ? (pagination.offset + cursor.length) < total : false;
            return {
                data: cursor,
                hasMore,
                total
            };
        });
    }
    findByFilters(level, income, category, cityFunction, index, educationLevel, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: categoryData } = yield this.findByCategory(category);
            const filters = {
                estrato: { $in: level },
                ingresos: { $gte: income[0], $lte: income[1] },
                [cityFunction + '_index']: { $gte: index[0], $lte: index[1] },
                nivel_educativo: { $in: educationLevel },
                _id: { $in: categoryData.map(cat => cat.utam_id) }
            };
            const cursor = yield this.utamInfoCollection.find(filters).toArray();
            const response = cursor.map(item => {
                var _a;
                return (Object.assign(Object.assign({}, item), { value: ((_a = categoryData.find(cat => cat.utam_id === item._id)) === null || _a === void 0 ? void 0 : _a.value) || null }));
            });
            const total = yield this.utamInfoCollection.countDocuments(filters);
            const hasMore = pagination ? (pagination.offset + cursor.length) < total : false;
            return {
                data: response,
                hasMore,
                total
            };
        });
    }
    findByOd(utamOrigen, motivoViaje) {
        return __awaiter(this, void 0, void 0, function* () {
            const cursor = yield this.odCollection.find({ origen: utamOrigen, motivo_viaje: motivoViaje }, { limit: 10, sort: { value: -1 } }).toArray();
            return cursor;
        });
    }
    findById(id) {
        throw new Error("Method not implemented.");
    }
    count(filters) {
        throw new Error("Method not implemented.");
    }
}
exports.CategoriesMongodbRepository = CategoriesMongodbRepository;
//# sourceMappingURL=categories-mongodb.repository.js.map