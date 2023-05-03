export interface Item {
  name: string;
  code: string;
}

export type UtamList = {
  data?: UtamData[];
  error?: boolean;
};

export type UtamData = {
  utam: string;
  value: number;
  value1: number;
  value2: number;
  edu_basica?: number;
  edu_tec?: number;
  edu_univ?: number;
};

export type OdData = {
  utam: string;
  value: number;
};
