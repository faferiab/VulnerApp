import { extent } from 'd3-array';
import { forceLink, forceManyBody, forceSimulation } from 'd3-force';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { Selection, select } from 'd3-selection';
import { curveBundle, line } from 'd3-shape';
import {
  Map as LMap,
  LatLng,
  Point,
  divIcon,
  marker
} from 'leaflet';
import { OdData } from '../interfaces/api-types';
import { QueryMapService } from '../services/query-map.service';
import { zonificacion } from '../services/zonificacion';

export const ODBuilder = (mapService: QueryMapService, tripReason: string) => {
  return (map: LMap, utam: string) => {
    mapService.queryOD(utam, tripReason).subscribe((data) => {
      /**
       * Construir svg
       * Agregar svg como marker al mapa
       */
      mapRef.set(map);
      generateMarker();
      const { centroidsPlane, pathsPlane, travelsPlane } = generateSvgGroups();
      let orgNode = data.reduce(
        (acc, curr) => {
          acc.value = Math.min(curr.value, acc.value);
          return acc;
        },
        { utam, value: 0 }
      );
      data.push(orgNode);
      let { nodesList, linksList } = filterNodesLinks(
        generateNodes(data),
        generateLinks(data, utam)
      );
      const bundle = generateSegments(nodesList, linksList);
      drawCentroids(nodesList, centroidsPlane);
      drawOriginDestinations(bundle, pathsPlane, travelsPlane);
      const zoomLevel = mapRef.get().getZoom();
      mapRef.get().on('zoom', () => update(zoomLevel));
    });
  };
};

type NodeData = {
  utam: string;
  centroide: Point;
  incoming: number;
  outgoing: number;
};

type LinkData = { utamOrg: string; utamDst: string; quantity: number };

const MapReference = () => {
  let _map: LMap;
  return {
    get: () => _map,
    set: (map: LMap) => (_map = map),
  };
};
const mapRef = MapReference();

const generateMarker = () => {
  document.getElementsByClassName('leaflet-marker-icon').item(0)?.remove();
  marker(mapRef.get().getBounds().getNorthWest(), {
    icon: divIcon({
      html: `<div id="icon-marker"></div>`,
      className: 'icon'
    }),
  }).addTo(mapRef.get());
};

const generateSvgGroups = () => {
  const pane = select('#icon-marker');
  if (document.getElementById('d3-svg') !== null) {
    pane.select('#d3-svg').remove();
  }
  const svg = pane.append('svg').attr('id', 'd3-svg');
  const group_svg = svg.append('g').attr('id', 'd3-layer');
  const pathsPlane = group_svg.append('g').attr('id', 'paths');
  const travelsPlane = group_svg.append('g').attr('id', 'travels');
  const centroidsPlane = group_svg.append('g').attr('id', 'centroids');
  return { pathsPlane, centroidsPlane, travelsPlane };
};

const generateNodes = (data: OdData[]) => {
  let response: NodeData[] = [];
  data.forEach((value) => {
    const [incoming, outgoing] = [0, 0];
    const centroide =
      zonificacion.find((zona) => zona.properties.utam === value.utam)
        ?.properties.centroide || [];

    response.push({
      utam: value.utam,
      centroide: convertToPoint(centroide),
      incoming,
      outgoing,
    });
  });
  return response;
};

const generateLinks = (data: OdData[], utamOrigen: string) => {
  let response: LinkData[] = data.map((item) => ({
    quantity: item.value,
    utamOrg: utamOrigen,
    utamDst: item.utam,
  }));
  return response;
};

const filterNodesLinks = (nodesList: NodeData[], linksList: LinkData[]) => {
  updateNodeSize(nodesList, linksList);
  const topIncoming = nodesList
    .sort((a, b) => b.incoming - a.incoming)
    .slice(0, 10);
  const topOutgoing = nodesList
    .sort((a, b) => b.outgoing - a.outgoing)
    .slice(0, 10);
  nodesList = [...topIncoming, ...topOutgoing];
  const filterNodes = nodesList.map((node) => node.utam);
  linksList = linksList.filter(
    (link) =>
      filterNodes.includes(link.utamOrg) && filterNodes.includes(link.utamDst)
  );
  updateNodeSize(nodesList, linksList);
  return { nodesList, linksList };
};

const updateNodeSize = (nodesList: NodeData[], linksList: LinkData[]) => {
  const nodeSize: NodeData[] = getNodesSize(
    nodesList.map((node) => node.utam),
    linksList
  );
  nodesList.forEach((node) => {
    const size =
      nodeSize.find((val) => val.utam === node.utam) ||
      ({ incoming: 0, outgoing: 0 } as NodeData);
    node.incoming = size.incoming;
    node.outgoing = size.outgoing;
  });
};

const getNodesSize = (filterNodes: string[], linkList: LinkData[]) => {
  const nodeSize = linkList.reduce((acc, act) => {
    /*if (
      !(filterNodes.includes(act.utamOrg) && filterNodes.includes(act.utamDst))
    )
      return;*/
    acc[act.utamOrg] = acc[act.utamOrg] || { outgoing: 0, incoming: 0 };
    acc[act.utamOrg].incoming += act.quantity;
    acc[act.utamDst] = acc[act.utamDst] || { outgoing: 0, incoming: 0 };
    acc[act.utamDst].outgoing += act.quantity;
    return acc;
  }, {} as any);
  return Object.keys(nodeSize).map((key) => ({ ...nodeSize[key], utam: key }));
};

const getCentroidScale = () => scaleSqrt().range([3, 10]);
const getEdgesScale = () => scaleLinear().domain([0, 322]).range([1, 10]);
const convertToPoint = (coord: number[]) => {
  const offset = mapRef
    .get()
    .getPixelBounds()
    .min?.subtract(mapRef.get().getPixelOrigin());
  return mapRef
    .get()
    .latLngToLayerPoint(new LatLng(coord[1], coord[0]))
    .subtract(offset as Point);
};

const drawCentroids = (
  data: NodeData[],
  layer: Selection<SVGGElement, unknown, HTMLElement, any>
) => {
  const minMax = extent(
    data.map((val) => Math.max(val.incoming, val.outgoing))
  ) as [number, number];
  const scaler = getCentroidScale().domain(minMax);

  layer
    .selectAll('circle')
    .data(data, (d) => (d as NodeData).utam)
    .enter()
    .append('circle')
    .style('stroke', (d) => (d.incoming >= d.outgoing ? 'black' : 'white'))
    .style('stroke-width', () => zoomLevelAdjust(11))
    .style('fill', (d) => (d.incoming >= d.outgoing ? 'white' : 'blue'))
    .attr('cx', (d) => d.centroide.x)
    .attr('cy', (d) => d.centroide.y)
    .attr(
      'r',
      (d) => scaler(Math.max(d.incoming, d.outgoing)) * zoomLevelAdjust(11)
    );
};

const zoomLevelAdjust = (zoomLevel: number) =>
  Math.pow(2, mapRef.get().getZoom() - zoomLevel);

const update = (zoomLevel: number) => {
  const group_svg = select('#d3-layer');
  group_svg.attr('transform', (p) => {
    return `scale(${zoomLevelAdjust(zoomLevel)})`;
  });
};

const drawOriginDestinations = (
  bundle: { nodes: []; paths: [] },
  layer: Selection<SVGGElement, unknown, HTMLElement, any>,
  travelsPlane: Selection<SVGGElement, unknown, HTMLElement, any>
) => {
  const link = line()
    .curve(curveBundle)
    .x((node) => (node as any).x)
    .y((node) => (node as any).y);

  const linkList = layer
    .selectAll('path')
    .data(bundle.paths)
    .enter()
    .append('path')
    .attr('d', link)
    .style('fill', 'none')
    .style('stroke', 'black')
    .style('stroke-width', 2 * zoomLevelAdjust(11));

  const layout = forceSimulation()
    .alphaDecay(0.4)
    .force(
      'charge',
      forceManyBody()
        .strength(20)
        .distanceMax(getEdgesScale().range()[1] * 5)
    )
    .force('link', forceLink().strength(0.7).distance(0))
    .on('tick', () => {
      linkList.attr('d', link);
    })
    .on('end', () => {
      drawTravels(travelsPlane);
    });

  layout.nodes(bundle.nodes).force('link');
};

const generateSegments = (nodeList: NodeData[], linkList: LinkData[]) => {
  const nodes: { fx?: number; fy?: number; x?: number; y?: number }[] =
    nodeList.map((d) => ({
      fx: d.centroide.x,
      fy: d.centroide.y,
    }));
  const paths: { x: number; y: number; utam?: string }[][] = [];
  const defaultValue = { centroide: new Point(0, 0), utam: '' };
  linkList
    .map((link) => ({
      source:
        nodeList.find((node) => node.utam === link.utamOrg) || defaultValue,
      target:
        nodeList.find((node) => node.utam === link.utamDst) || defaultValue,
    }))
    .forEach((d) => {
      const length = distance(d.source.centroide, d.target.centroide);
      const total = Math.round(getEdgesScale()(length));
      const xscale = scaleLinear()
        .domain([0, total + 1])
        .range([d.source.centroide.x, d.target.centroide.x]);

      const yscale = scaleLinear()
        .domain([0, total + 1])
        .range([d.source.centroide.y, d.target.centroide.y]);

      // initialize source node
      let source: { x: number; y: number; utam?: string } = {
        x: d.source.centroide.x,
        y: d.source.centroide.y,
        utam: d.source.utam,
      };
      let target = { x: 0, y: 0 };
      let local = [source];

      for (let j = 1; j <= total; j++) {
        target = {
          x: xscale(j),
          y: yscale(j),
        };
        local.push(target);
        nodes.push(target);
        source = target;
      }

      local.push({ ...d.target.centroide, utam: d.target.utam });
      paths.push(local);
    });
  return { nodes: nodes as [], paths: paths as [] };
};
// calculates the distance between two nodes
const distance = (source: Point, target: Point) => {
  const dx2 = Math.pow(target.x - source.x, 2);
  const dy2 = Math.pow(target.y - source.y, 2);
  return Math.sqrt(dx2 + dy2);
};

const drawTravels = (
  layer: Selection<SVGGElement, unknown, HTMLElement, any>
) => {
  const paths: string[] = [];
  document.querySelector('#d3-svg #paths')?.childNodes.forEach((path) => {
    paths.push((path as SVGPathElement).getAttribute('d') as string);
  });

  layer
    .selectAll('circle')
    .data(paths)
    .enter()
    .append('circle')
    .attr('class', 'travel-point')
    .attr('r', 5)
    .attr('fill', 'red')
    .style('offset-path', (d) => `path('${d}')`);
};
