import assert from "assert";
import axios from 'axios';
import { Request, Response } from 'express';
import { FunctionType, graphQlOdResponse, graphQlUtamResponse } from "../types/applicatonContext";
import { HttClient } from "../types/httpClient";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const BASE_API_URL = process.env['BASE_API_URL'] || '';
const API_URL = BASE_API_URL + '/graphql';
const AUTH_URL = BASE_API_URL + '/auth/providers/api-key/login';
const API_KEY = process.env['API_KEY'] || ''

export const getUtamByFilter = async (req: Request, res: Response) => {
    try {
        const params = handleRequestGetUtam(req);
        const token = await getToken(axios)();
        const { data, errors } = await queryUtam(axios)(token, params);
        if (errors) throw new Error('Graphql error');
        const { utam_categories } = data as graphQlUtamResponse;
        const utam = handleReponseGetUtam(utam_categories);
        console.log(getUtamByFilter.name, 'response size: ', utam.length);
        res.json({ data: utam });
    } catch (error) {
        console.log(getUtamByFilter.name, error);
        res.json({ error: true });
    }
}

export const getOdByFilter = async (req: Request, res: Response) => {
    try {
        const params = handleRequestGetOD(req);
        const token = await getToken(axios)();
        const { data, errors } = await queryOD(axios)(token, params);
        if (errors) throw new Error('Graphql error');
        const { utam_ods } = data as graphQlOdResponse;
        let response = utam_ods
            .filter((item) => item.destino)
            .map((item) => ({
                utam: item.destino._id,
                value: item.value,
            }));

        console.log(getOdByFilter.name, 'response size: ', response.length);
        res.json({ data: response });

    } catch (error) {
        console.log(getOdByFilter.name, error);
        res.json({ error: true });
    }
}

const handleRequestGetUtam = (req: Request) => {
    const { es, ig, fn, sf, ic, ed, sd } = req.query;
    assert(typeof fn == 'string');
    assert(typeof sf == 'string');
    assert(typeof sd == 'string');
    const defaultEs = Array.from({ length: 6 }, (v, i) => String(i + 1));
    const defaultEd = ['edu_basica', 'edu_univ'];
    const estrato = (
        (Array.isArray(es || defaultEs) ? es || defaultEs : [es]) as string[]
    )
        .map((item) => parseInt(item, 10))
        .filter((item) => item >= 1 && item <= 6);
    const ingresos = (ig as string[])
        .map((item) => parseInt(item, 10))
        .filter((item) => item >= 1 && item <= 10);
    const indice = (ic as string[])
        .map((item) => parseFloat(item))
        .filter((item) => item >= 0 && item <= 1);
    const educacion = (
        Array.isArray(ed || defaultEd) ? ed || defaultEd : [ed]
    ) as string[];
    return {
        estrato,
        ingresos,
        category: sf,
        function: fn,
        indice,
        subsidio: sd,
        educacion,
    };
}

const getToken = (httpClient: HttClient) => async () => {
    let res = await httpClient.post(AUTH_URL, { key: API_KEY });
    return res.data.access_token;
}

const queryUtam = (httpClient: HttClient) => async (
    token: string,
    params: {
        estrato: number[];
        ingresos: number[];
        indice: number[];
        function: string;
        category: string;
        subsidio: string;
        educacion: string[];
    }
) => {
    const projection = '_id, edu_basica, edu_tec, edu_univ, ' + params.subsidio;
    const resp = await httpClient.post(API_URL,
        {
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
                category: functionTagToIndex(params.function as FunctionType) + params.category,
                index_lb: params.indice[0],
                index_ub: params.indice[1],
                educacion: params.educacion,
            },
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return resp.data;
}

const functionTagToIndex = (func: FunctionType) => {
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
}

const handleReponseGetUtam = (utam_categories: graphQlUtamResponse['utam_categories']) => {
    return utam_categories.map((val) => {
        return {
            utam: val.utam_id._id,
            value1: val.value,
            value2:
                val.utam_id.discapacidad ||
                val.utam_id.sisben ||
                val.utam_id.adulto_mayor,
            edu_basica: val.utam_id.edu_basica,
            edu_tec: val.utam_id.edu_tec,
            edu_univ: val.utam_id.edu_univ,
        };
    });
}

const handleRequestGetOD = (req: Request) => {
    const { utam, mv } = req.query;
    assert(typeof utam == 'string');
    assert(typeof mv == 'string');
    return {
        utam,
        motivoViaje: functionTagToIndex(mv as FunctionType),
    }
}

const queryOD = (httpClient: HttClient) => async (
    token: string,
    params: { utam: string; motivoViaje: string }
) => {
    const resp = await httpClient.post(API_URL,
        {
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
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return resp.data;
}