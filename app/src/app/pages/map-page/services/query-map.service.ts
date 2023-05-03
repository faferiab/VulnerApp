import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { OdData, UtamData, UtamList } from '../interfaces/api-types';

type MapFilters = {
  estrato: number[];
  ingresos: number[];
  indice: number[];
  educacion: string[];
};

@Injectable()
export class QueryMapService {
  readonly url = '/api';
  readonly mockUrl1 = '/assets/mock-ai.json';
  readonly mockUrl2 = '/assets/mock-sub.json';
  constructor(private client: HttpClient) {}

  public queryUtamData(
    filter: MapFilters,
    func: string,
    subFunc: string,
    subsidie: string
  ): Observable<Map<string, UtamData>> {
    return this.client
      .get<UtamList>(this.url + '/info', {
        params: {
          ig: filter.ingresos,
          es: filter.estrato,
          fn: func,
          sf: subFunc,
          ic: filter.indice,
          sd: subsidie,
          ed: filter.educacion,
        },
      })
      .pipe(
        map((res) => {
          return new Map(
            res.data?.map((item) => {
              return [item.utam, item];
            })
          );
        })
      );
  }

  public queryOD(utam: string, motivoViaje: string): Observable<OdData[]> {
    return this.client
      .get<{ data: OdData[] }>(this.url + '/od', {
        params: { utam, mv: motivoViaje },
      })
      .pipe(map((res) => res.data));
  }
}
