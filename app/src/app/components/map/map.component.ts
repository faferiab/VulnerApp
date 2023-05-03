import { AfterViewInit, Component, Input } from '@angular/core';
import {
  Layer,
  LayerGroup,
  Map,
  map,
  tileLayer
} from 'leaflet';
import { SwitchLayer } from './plugins/switch-layer';

export type ZonaMap = {
  name: string;
  layer: Layer;
  side: 'LEFT' | 'RIGHT' | 'NONE';
};
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  @Input() set zonas(zonas: ZonaMap[]) {
    let leftGroup = new LayerGroup();
    let rightGroup = new LayerGroup();
    this._zonas.forEach((zona) => {
      zona.layer.remove();
    });
    this._zonas = zonas;

    this._zonas.forEach((zona) => {
      let group = zona.side === 'LEFT' ? leftGroup : rightGroup;
      if (zona.side !== 'NONE') group.addLayer(zona.layer);
      if (zona.side === 'NONE') zona.layer.addTo(this.map);
    });
    if (zonas.length) this._control.setLayers(rightGroup, leftGroup);
  }

  private map: Map = {} as Map;
  private _zonas: ZonaMap[] = [];
  private _control = new SwitchLayer();

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = map('map', {
      center: [4.6450174, -74.1095866],
      zoom: 11,
    });
    const tile = this.tileGenerator();
    tile.addTo(this.map);

    this._control.addTo(this.map);
    this.map.createPane('LEFT');
    this.map.createPane('RIGHT');
    this.map.createPane('TOP');
  }

  private tileGenerator() {
    return tileLayer(
      'http://services.arcgisonline.com/arcgis/rest/services' +
        '/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://services.arcgisonline.com">ArcgisOnline</a>',
      }
    );
  }
}
