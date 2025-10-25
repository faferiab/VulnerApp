import { assert } from "console";
import { IBaseRepository } from "../repositories/base.repository";
import { ValidationError } from "../errors/app-errors";

export interface IService {
    getUtamByFilter(level: any, income: any, category: any, cityFunction: any,
        index: any, educationLevel: any, subsidize: any, pagination?: any): Promise<{data: any}>;
    getOdByFilter(utam: any, category: any): Promise<{data: any}>;
}

class ServiceErrorValidator {
    static validateParams(conditional: boolean, message: string) {
        if (!conditional) {
            throw new ValidationError(message);
        }
    }
}

class VulnerAppService implements IService {
    constructor(private readonly repository: IBaseRepository) { }

    async getUtamByFilter(level: any, income: any, category: any, cityFunction: any,
        index: any, educationLevel: any, subsidize: any, pagination?: any): Promise<any> {
        let pLevel = Array.from({ length: 6 }, (_, i) => i + 1);
        if (!!level) {
            ServiceErrorValidator.validateParams(Array.isArray(level), "Level must be an array");
            pLevel = level.map((item: string) => parseInt(item, 10)).filter((item: number) => item >= 1 && item <= 6);
        }
        let pIncome = [1, 10];
        if (!!income) {
            ServiceErrorValidator.validateParams(Array.isArray(income) && income.length === 2, "Income must be an array of two numbers");
            pIncome = income.map((item: string) => parseInt(item, 10)).filter((item: number) => item >= 1 && item <= 10);
        }
        let pCityFunction = 'estudio';
        if (!!category) {
            ServiceErrorValidator.validateParams(typeof category === "string", "Category must be a string");
            pCityFunction = category;
        }
        let pCategory = 'AA01';
        if (!!cityFunction) {
            ServiceErrorValidator.validateParams(typeof cityFunction === "string", "City Function must be a string");
            switch (category) {
                case 'estudio':
                    pCategory = 'AB';
                    break;
                case 'redcul':
                    pCategory = 'AC';
                    break;
                case 'salud':
                    pCategory = 'AD';
                    break;
                case 'trabajo':
                    pCategory = 'AA';
                    break;
            }
            pCategory = pCategory + cityFunction;
        }
        let pIndex = [0.0, 1.0];
        if (!!index) {
            ServiceErrorValidator.validateParams(Array.isArray(index) && index.length === 2, "Index must be an array of two numbers");
            pIndex = index.map((item: string) => parseFloat(item)).filter((item: number) => item >= 0 && item <= 1);
        }
        let pEducationLevel = ['edu_basica', 'edu_univ'];
        if (!!educationLevel) {
            ServiceErrorValidator.validateParams(Array.isArray(educationLevel), "Education Level must be an array");
            pEducationLevel = educationLevel.filter((item: string) => ['edu_basica', 'edu_univ'].includes(item));
        }
        let pSubsidize = 'sisben';
        if (!!subsidize) {
            ServiceErrorValidator.validateParams(typeof subsidize === "string", "Subsidize must be a string");
            pSubsidize = subsidize;
        }
        const response = (await this.repository
            .findByFilters(pLevel, pIncome, pCategory, pCityFunction, pIndex, pEducationLevel))
            .map(item => ({
                utam: item.id,
                value1: item.value,
                value2: item[pSubsidize],
                edu_basica: item.edu_basica,
                edu_tec: item.edu_tec,
                edu_univ: item.edu_univ,
            }));
        return { data: response };
    }

    async getOdByFilter(utam: any, category: any): Promise<any> {
        let pUtam = 'UTAM';
        if (!!utam) {
            ServiceErrorValidator.validateParams(typeof utam === "string", "Utam must be a string");
            pUtam = utam;
        }
        let pCategory = 'AA';
        if (!!category) {
            ServiceErrorValidator.validateParams(typeof category === "string", "City Function must be a string");
            switch (category) {
                case 'estudio':
                    pCategory = 'AB';
                    break;
                case 'redcul':
                    pCategory = 'AC';
                    break;
                case 'salud':
                    pCategory = 'AD';
                    break;
                case 'trabajo':
                    pCategory = 'AA';
                    break;
            }
        }
        const response = (await this.repository.findByOd(pUtam, pCategory)).map(item => ({
            utam: item.destination,
            value: item.value,
        }));
        return { data: response };
    }
}

export const AppService = (context: { repository: any }): IService => new VulnerAppService(context.repository);
