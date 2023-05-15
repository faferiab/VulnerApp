import { Item } from './api-types';

const categorias = (): Item[] => {
  return [
    { name: 'CE823A34', code: '07' },
    { name: '731E5E0D', code: '04' },
    { name: '1DAFA28E', code: '06' },
    { name: '7374DAB8', code: '05' },
    { name: 'FD10F6B8', code: '03' },
    { name: '6A805C47', code: '02' },
    { name: 'CEF723E9', code: '01' },
    { name: '8FB1E772', code: '08' },
  ];
};

const motivoViaje = (): Item[] => {
  return [
    { name: '0D2C9374', code: 'estudio' },
    { name: '3EB8BD73', code: 'redcul' },
    { name: 'A3B8D87D', code: 'salud' },
    { name: 'E422CDAE', code: 'trabajo' },
  ];
};

const estratos = (): Item[] => {
  return [
    { name: '17F3AD07', code: '1' },
    { name: '93EE32F9', code: '2' },
    { name: '28FA1678', code: '3' },
    { name: '4EDD4737', code: '4' },
    { name: '648B152E', code: '5' },
    { name: 'A02CAC49', code: '6' },
  ];
};

const nivelesEducativos = (): Item[] => {
  return [
    { name: 'A5A4AD76', code: 'edu_basica' },
    { name: '100220F7', code: 'edu_univ' },
  ];
};

const subsidios = (): Item[] => {
  return [
    { name: 'E3F2B58C', code: 'discapacidad' },
    { name: 'A226502E', code: 'sisben' },
    { name: '2EE833E8', code: 'adulto_mayor' },
  ];
};

export const catalogo = {
  categorias,
  motivoViaje,
  estratos,
  nivelesEducativos,
  subsidios,
};
