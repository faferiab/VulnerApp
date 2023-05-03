export type FunctionType = 'estudio' | 'redcul' | 'salud' | 'trabajo'

export type graphQlUtamResponse = {
    utam_categories: {
        utam_id: {
            _id: string;
            discapacidad?: number;
            sisben?: number;
            adulto_mayor?: number;
            edu_basica?: number;
            edu_tec?: number;
            edu_univ?: number;
        };
        value: number;
    }[];
}

export type graphQlOdResponse = {
    utam_ods: {
        destino: {
            _id: string;
        };
        value: number;
    }[];
}