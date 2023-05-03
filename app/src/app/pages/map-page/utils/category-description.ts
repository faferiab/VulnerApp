import { Item } from '../interfaces/api-types';

export function getDescription(category: Item) {
  switch (category.code) {
    case '01':
      return 'El tiempo de viaje esta en minutos segun Utam de origen';
    case '02':
      return 'El tiempo de espera esta en minutos segun Utam de origen';
    case '03':
      return 'El tiempo de acceso (caminata) esta en minutos segun Utam de origen';
    case '04':
      return 'Numero de transferencias realizadas durante el viaje segun Utam de origen';
    case '05':
      return 'Probabilidad de pagar un sobrecosto adicional a la tarifa del vaje segun Utam de origen';
    case '06':
      return 'Nivel de experiencia negativa donde 1, la experiencia de viaje es mejor y 5, la experiencia de viaje es peor';
    case '07':
      return 'Sobrecosto adicional en pesos COP a la tarifa del modo principal de transporte';
    case '08':
      return 'Valor del indice de accesibilidad asociado a la funcion, donde 0 es menor vulnerabilidad y 1 mayor vulnerabiilidad ';
    default:
      return '';
  }
}
