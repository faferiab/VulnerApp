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
exports.AppRepository = void 0;
class MongodbRepository {
    constructor(client) {
        this.client = client;
        this.logger = console;
        this.categoryCollection = this.getCollection(this.client, 'utam_categories');
        this.utamInfoCollection = this.getCollection(this.client, 'utam_info');
        this.odCollection = this.getCollection(this.client, 'utam_od');
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
            this.logger.log(`Finding by category: ${category}`);
            const result = yield this.categoryCollection.find({ category: { $eq: category } }, { limit: pagination === null || pagination === void 0 ? void 0 : pagination.limit, skip: pagination === null || pagination === void 0 ? void 0 : pagination.offset }).toArray();
            return result;
        });
    }
    findByFilters(level, income, category, cityFunction, index, educationLevel, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            const categoryData = yield this.findByCategory(category);
            const filters = {
                estrato: { $in: level },
                ingresos: { $gte: income[0], $lte: income[1] },
                [cityFunction + '_index']: { $gte: index[0], $lte: index[1] },
                nivel_educativo: { $in: educationLevel },
                _id: { $in: categoryData.map(cat => cat.utam_id) }
            };
            const cursor = yield this.utamInfoCollection.find(filters).toArray();
            return cursor.map(item => {
                var _a;
                return (Object.assign(Object.assign({}, item), { id: item._id, value: ((_a = categoryData.find(cat => cat.utam_id === item._id)) === null || _a === void 0 ? void 0 : _a.value) || null }));
            });
        });
    }
    findByOd(utamOrigen, motivoViaje) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Finding OD by origen: ${utamOrigen} and motivoViaje: ${motivoViaje}`);
            const cursor = yield this.odCollection.find({ origen: utamOrigen, motivo_viaje: motivoViaje, destino: { $ne: utamOrigen } }, {
                limit: 10,
                sort: { value: -1 },
                projection: { destino: 1, value: 1 }
            }).toArray();
            return cursor.map(item => ({
                destination: item.destino,
                value: item.value
            }));
        });
    }
}
const AppRepository = (context) => new MongodbRepository(context.client);
exports.AppRepository = AppRepository;
//# sourceMappingURL=mongodb.repository.js.map