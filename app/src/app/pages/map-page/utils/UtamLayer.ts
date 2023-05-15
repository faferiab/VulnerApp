import {
  Control,
  DomUtil,
  geoJson,
  Map as LMap
} from 'leaflet';
import { UtamData } from '../interfaces/api-types';
import { zonificacion } from '../services/zonificacion';

const MapReference = () => {
  let _map: LMap;
  return {
    get: () => _map,
    set: (map: LMap) => (_map = map),
  };
};
const mapRef = MapReference();

const legend = new Control({ position: 'topleft' });

export const UtamBuilder = (
  data: Map<string, UtamData>,
  pane: string,
  odFunction: Function
) => {
  document.getElementsByClassName('leaflet-marker-icon').item(0)?.remove();
  const [minValue, maxValue] = getMaxMinValue(data);
  const color = getColorRange(minValue, maxValue);
  const tempZonificacion = zonificacion
    .filter((zona) => data.has(zona.properties.utam))
    .map((zona) => {
      let newProps = {
        ...zona.properties,
        value: data.get(zona.properties.utam)?.value,
        edu_basica: data.get(zona.properties.utam)?.edu_basica,
        edu_tec: data.get(zona.properties.utam)?.edu_tec,
        edu_univ: data.get(zona.properties.utam)?.edu_univ,
      };
      zona.properties = newProps;
      return zona;
    }) as unknown;
  const layer = geoJson(tempZonificacion as undefined, {
    style: (feature: any) => style(feature, color),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(
        `<b>${feature.properties.utam}</b> - ${feature.properties.nombre
        } <br> Valor de ${pane == 'RIGHT' ? 'variable' : 'subsidio'}: ${Math.round(feature.properties.value * 100) / 100
        }
        ${feature.properties.edu_basica
          ? '<br> Basica:' +
          Math.round(feature.properties.edu_basica * 100) / 100
          : ''
        }
        ${feature.properties.edu_tec
          ? '<br> Tecnica:' +
          Math.round(feature.properties.edu_tec * 100) / 100
          : ''
        }
        ${feature.properties.edu_univ
          ? '<br> Univ:' + Math.round(feature.properties.edu_univ * 100) / 100
          : ''
        }
        `
      );
      layer.on('click', (evt) => {
        odFunction(mapRef.get(), evt.target.feature.properties.utam);
      });
    },
    pane: pane,
  }).on('add', (evt) => {
    let map: LMap = evt.sourceTarget._map;
    map.removeControl(legend);
    getLegend(minValue, maxValue);
    map.addControl(legend);
    mapRef.set(map);
  });
  return layer;
};

const getMaxMinValue = (data: Map<string, { value: number }>) => {
  return Array.from(data.entries()).reduce(
    (accumulator, currentValue) => [
      Math.min(accumulator[0], currentValue[1].value || Infinity),
      Math.max(accumulator[1], currentValue[1].value || -Infinity),
    ],
    [Infinity, -Infinity]
  );
};

const getColorRange = (min: number, max: number) => {
  return (value: number) => {
    let idx = (value - min) / (max - min);
    return value == null
      ? '#000000'
      : idx < 1 / 8
        ? '#40FF00'
        : idx < 2 / 8
          ? '#75FF02'
          : idx < 3 / 8
            ? '#C5FF05'
            : idx < 4 / 8
              ? '#FAFF07'
              : idx < 5 / 8
                ? '#FBBB0D'
                : idx < 6 / 8
                  ? '#FB7814'
                  : idx < 7 / 8
                    ? '#FC341A'
                    : '#FC121D';
  };
};

const style = (feature: any, color: Function) => {
  return {
    fillColor: color(feature.properties.value),
    weight: 2,
    opacity: 1,
    color: 'gray',
    dashArray: '3',
    fillOpacity: 0.6,
  };
};

const getLegend = (minValue: number, maxValue: number) => {
  legend.onAdd = (map) => {
    const colorGenerator = getColorRange(minValue, maxValue);
    const div = DomUtil.create('div', 'info legend');
    const labels = [];
    let [from, to] = [minValue, 0];
    const increment = (maxValue - minValue) / 8;
    const formatter = (num: number) => num.toFixed(maxValue <= 10 ? 2 : 0);
    for (let value = 0; value < 8; value++) {
      to = from + increment;
      labels.push(
        `<i style="background:${colorGenerator(from)}"></i> ${formatter(from)}${to ? `&ndash;${formatter(to)}` : '+'
        }`
      );
      from = to;
    }
    labels.push(`<i style="background:#000000"></i> No hay datos`);
    div.innerHTML = labels.join('<br>');
    return div;
  };
  return legend;
};
