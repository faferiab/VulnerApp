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
exports.AppService = void 0;
const app_errors_1 = require("../errors/app-errors");
class ServiceErrorValidator {
    static validateParams(conditional, message) {
        if (!conditional) {
            throw new app_errors_1.ValidationError(message);
        }
    }
}
class VulnerAppService {
    constructor(repository) {
        this.repository = repository;
    }
    getUtamByFilter(level, income, category, cityFunction, index, educationLevel, subsidize, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            let pLevel = Array.from({ length: 6 }, (_, i) => i + 1);
            if (!!level) {
                ServiceErrorValidator.validateParams(Array.isArray(level), "Level must be an array");
                pLevel = level.map((item) => parseInt(item, 10)).filter((item) => item >= 1 && item <= 6);
            }
            let pIncome = [1, 10];
            if (!!income) {
                ServiceErrorValidator.validateParams(Array.isArray(income) && income.length === 2, "Income must be an array of two numbers");
                pIncome = income.map((item) => parseInt(item, 10)).filter((item) => item >= 1 && item <= 10);
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
                pIndex = index.map((item) => parseFloat(item)).filter((item) => item >= 0 && item <= 1);
            }
            let pEducationLevel = ['edu_basica', 'edu_univ'];
            if (!!educationLevel) {
                ServiceErrorValidator.validateParams(Array.isArray(educationLevel), "Education Level must be an array");
                pEducationLevel = educationLevel.filter((item) => ['edu_basica', 'edu_univ'].includes(item));
            }
            let pSubsidize = 'sisben';
            if (!!subsidize) {
                ServiceErrorValidator.validateParams(typeof subsidize === "string", "Subsidize must be a string");
                pSubsidize = subsidize;
            }
            const response = (yield this.repository
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
        });
    }
    getOdByFilter(utam, category) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const response = (yield this.repository.findByOd(pUtam, pCategory)).map(item => ({
                utam: item.destination,
                value: item.value,
            }));
            return { data: response };
        });
    }
}
const AppService = (context) => new VulnerAppService(context.repository);
exports.AppService = AppService;
//# sourceMappingURL=simple.service.js.map