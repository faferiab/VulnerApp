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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOdByFilter = exports.getUtamByFilter = void 0;
const assert_1 = __importDefault(require("assert"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env" });
const BASE_API_URL = process.env['BASE_API_URL'] || '';
const API_URL = BASE_API_URL + '/graphql';
const AUTH_URL = BASE_API_URL + '/auth/providers/api-key/login';
const API_KEY = process.env['API_KEY'] || '';
const getUtamByFilter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = handleRequestGetUtam(req);
        const token = yield getToken(axios_1.default)();
        const { data, errors } = yield queryUtam(axios_1.default)(token, params);
        if (errors)
            throw new Error('Graphql error');
        const { utam_categories } = data;
        const utam = handleReponseGetUtam(utam_categories);
        console.log(exports.getUtamByFilter.name, 'response size: ', utam.length);
        res.json({ data: utam });
    }
    catch (error) {
        console.log(exports.getUtamByFilter.name, error);
        res.json({ error: true });
    }
});
exports.getUtamByFilter = getUtamByFilter;
const getOdByFilter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = handleRequestGetOD(req);
        const token = yield getToken(axios_1.default)();
        const { data, errors } = yield queryOD(axios_1.default)(token, params);
        if (errors)
            throw new Error('Graphql error');
        const { utam_ods } = data;
        let response = utam_ods
            .filter((item) => item.destino)
            .map((item) => ({
            utam: item.destino._id,
            value: item.value,
        }));
        console.log(exports.getOdByFilter.name, 'response size: ', response.length);
        res.json({ data: response });
    }
    catch (error) {
        console.log(exports.getOdByFilter.name, error);
        res.json({ error: true });
    }
});
exports.getOdByFilter = getOdByFilter;
const handleRequestGetUtam = (req) => {
    const { es, ig, fn, sf, ic, ed, sd } = req.query;
    (0, assert_1.default)(typeof fn == 'string');
    (0, assert_1.default)(typeof sf == 'string');
    (0, assert_1.default)(typeof sd == 'string');
    const defaultEs = Array.from({ length: 6 }, (v, i) => String(i + 1));
    const defaultEd = ['edu_basica', 'edu_univ'];
    const estrato = (Array.isArray(es || defaultEs) ? es || defaultEs : [es])
        .map((item) => parseInt(item, 10))
        .filter((item) => item >= 1 && item <= 6);
    const ingresos = ig
        .map((item) => parseInt(item, 10))
        .filter((item) => item >= 1 && item <= 10);
    const indice = ic
        .map((item) => parseFloat(item))
        .filter((item) => item >= 0 && item <= 1);
    const educacion = (Array.isArray(ed || defaultEd) ? ed || defaultEd : [ed]);
    return {
        estrato,
        ingresos,
        category: sf,
        function: fn,
        indice,
        subsidio: sd,
        educacion,
    };
};
const getToken = (httpClient) => () => __awaiter(void 0, void 0, void 0, function* () {
    let res = yield httpClient.post(AUTH_URL, { key: API_KEY });
    return res.data.access_token;
});
const queryUtam = (httpClient) => (token, params) => __awaiter(void 0, void 0, void 0, function* () {
    const projection = '_id, edu_basica, edu_tec, edu_univ, ' + params.subsidio;
    const resp = yield httpClient.post(API_URL, {
        query: `query ($estrato: [Int]!, $ingreso_lb: Int!, $ingreso_ub: Int!, $category: String!, 
            $index_lb: Float!, $index_ub: Float!, $educacion: [String]!) {
          utam_categories(
            query: {
              category: $category, 
              utam_id: {
                estrato_in: $estrato, 
                ingresos_gte: $ingreso_lb, 
                ingresos_lte: $ingreso_ub,
                ${params.function}_index_lte: $index_ub, 
                ${params.function}_index_gte: $index_lb,
                nivel_educativo_in: $educacion,
              },
            }, limit: 120) {
              utam_id {
                ${projection}
              }
              value
            }
          }`,
        variables: {
            estrato: params.estrato,
            ingreso_lb: params.ingresos[0],
            ingreso_ub: params.ingresos[1],
            category: functionTagToIndex(params.function) + params.category,
            index_lb: params.indice[0],
            index_ub: params.indice[1],
            educacion: params.educacion,
        },
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return resp.data;
});
const functionTagToIndex = (func) => {
    switch (func) {
        case 'estudio':
            return 'AB';
        case 'redcul':
            return 'AC';
        case 'salud':
            return 'AD';
        case 'trabajo':
            return 'AA';
    }
};
const handleReponseGetUtam = (utam_categories) => {
    return utam_categories.map((val) => {
        return {
            utam: val.utam_id._id,
            value1: val.value,
            value2: val.utam_id.discapacidad ||
                val.utam_id.sisben ||
                val.utam_id.adulto_mayor,
            edu_basica: val.utam_id.edu_basica,
            edu_tec: val.utam_id.edu_tec,
            edu_univ: val.utam_id.edu_univ,
        };
    });
};
const handleRequestGetOD = (req) => {
    const { utam, mv } = req.query;
    (0, assert_1.default)(typeof utam == 'string');
    (0, assert_1.default)(typeof mv == 'string');
    return {
        utam,
        motivoViaje: functionTagToIndex(mv),
    };
};
const queryOD = (httpClient) => (token, params) => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield httpClient.post(API_URL, {
        query: `query ($motivo_viaje: String!, $utam: String!) {
                utam_ods(
                  query: {
                    motivo_viaje: $motivo_viaje,
                    origen: {
                      _id: $utam
                    },
                  }, sortBy: VALUE_DESC, limit:10) {
                    destino {
                      _id
                    }
                    value
                  }
                }`,
        variables: {
            motivo_viaje: params.motivoViaje,
            utam: params.utam,
        },
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return resp.data;
});
//# sourceMappingURL=queryGraphql.js.map