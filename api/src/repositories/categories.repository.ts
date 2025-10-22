import { CategoriesMongodbRepository } from "./categories-mongodb.repository";

export const CategoriesRepository = (context: { client: any }) => new CategoriesMongodbRepository(context.client);