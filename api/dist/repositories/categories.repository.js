"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesRepository = void 0;
const categories_mongodb_repository_1 = require("./categories-mongodb.repository");
const CategoriesRepository = (context) => new categories_mongodb_repository_1.CategoriesMongodbRepository(context.client);
exports.CategoriesRepository = CategoriesRepository;
//# sourceMappingURL=categories.repository.js.map