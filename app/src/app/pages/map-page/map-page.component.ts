import { Component, OnInit } from '@angular/core';
import { Control } from 'leaflet';
import { BehaviorSubject, finalize } from 'rxjs';
import { ZonaMap } from '../../components';
import { Item, UtamData } from './interfaces/api-types';
import { catalogo } from './interfaces/catalogs';
import { QueryMapService } from './services/query-map.service';
import { ODBuilder } from './utils/OdLayer';
import { UtamBuilder } from './utils/UtamLayer';
import { getDescription } from './utils/category-description';

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.css'],
})
export class MapPageComponent implements OnInit {
  public functions: Item[];
  public selectedFunction: Item = {} as Item;
  public categories: Item[];
  public selectedCategory: Item = {} as Item;
  public subsidies: Item[];
  public selectedSubsidies: Item = {} as Item;
  public estratos: Item[];
  public selectedEstratos: string[] = [];
  public educativos: Item[];
  public selectedEducativo: string[] = [];
  public zonasList: ZonaMap[] = [];
  public info: Control = {} as Control;
  public ingresos: number[] = [1, 10];
  public indice: number[] = [0, 100];
  public loading = false;
  public description = new BehaviorSubject('');
  private svgDom = {} as SVGSVGElement;

  constructor(private mapService: QueryMapService) {
    this.functions = catalogo.motivoViaje();
    this.categories = catalogo.categorias();
    this.estratos = catalogo.estratos();
    this.educativos = catalogo.nivelesEducativos();
    this.subsidies = catalogo.subsidios();
  }

  ngOnInit() {
    this.svgDom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgDom.setAttributeNS(null, 'id', 'd3-svg');
  }

  generate() {
    const estrato = this.selectedEstratos.map((val) => parseInt(val, 10));
    const indice = this.indice.map((val) => val / 100);
    const func = this.selectedFunction.code;
    const categ = this.selectedCategory.code;
    const subsidie = this.selectedSubsidies.code;
    const filters = {
      estrato,
      ingresos: this.ingresos,
      indice,
      educacion: this.selectedEducativo,
    };
    this.loading = true;
    this.mapService
      .queryUtamData(filters, func, categ, subsidie)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((utamData) => {
        this.description.next(getDescription(this.selectedCategory));
        this.zonasList = [
          {
            name: 'Subsidios',
            layer: this.processGisData(
              this.setFieldValue(utamData, 'value2'),
              'LEFT'
            ),
            side: 'LEFT',
          },
          {
            name: 'Socioeconomicas',
            layer: this.processGisData(
              this.setFieldValue(utamData, 'value1'),
              'RIGHT'
            ),
            side: 'RIGHT',
          },
        ];
      });
  }

  clear() {
    this.selectedEstratos = [];
    this.selectedEducativo = [];
    this.ingresos = [1, 10];
    this.indice = [0, 100];
  }

  private processGisData(data: Map<string, UtamData>, pane: string) {
    let odFunction = ODBuilder(this.mapService, this.selectedFunction.code)
    return UtamBuilder(data, pane, odFunction);
  }
  
  private setFieldValue(
    data: Map<string, UtamData>,
    field: 'value1' | 'value2'
  ) {
    data.forEach((entry) => {
      entry.value = entry[field];
    });
    return data;
  }
}
