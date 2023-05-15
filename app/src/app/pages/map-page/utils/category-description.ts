import { Item } from '../interfaces/api-types';

export function getDescription(category: Item) {
  switch (category.code) {
    case '01':
      return '9A71505D';
    case '02':
      return '0DA5930F';
    case '03':
      return '78CE29CD';
    case '04':
      return 'D566158F';
    case '05':
      return '27AEBE7D';
    case '06':
      return 'A1FB7A18';
    case '07':
      return '627E9ED8';
    case '08':
      return '3749E125';
    default:
      return '';
  }
}