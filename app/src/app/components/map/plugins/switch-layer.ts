import {
  Control,
  ControlOptions,
  DomEvent,
  DomUtil,
  Layer,
  LayerGroup,
  Map,
} from 'leaflet';
import { BehaviorSubject } from 'rxjs';

export class SwitchLayer extends Control {
  private hiddenState = new BehaviorSubject(true);
  private leftLayer = new LayerGroup();
  private rightLayer = new LayerGroup();
  private map = {} as Map;
  private input = {} as HTMLInputElement;

  override onAdd(map: Map) {
    this.map = map;
    const container = DomUtil.create(
      'div',
      'leaflet-control'
    ) as HTMLDivElement;
    const control = DomUtil.create(
      'label',
      'switch',
      container
    ) as HTMLLabelElement;
    control.style.setProperty('--width', '140px');
    const input = DomUtil.create('input', 'checkbox', control);
    this.input = input;
    input.type = 'checkbox';
    DomUtil.create('span', 'slider', control);
    const labels = DomUtil.create('span', 'labels', control);
    const dataOn = document.createAttribute('data-on');
    dataOn.value = 'Subsidios';
    const dataOff = document.createAttribute('data-off');
    dataOff.value = 'Socioeconomicas';
    labels.attributes.setNamedItem(dataOn);
    labels.attributes.setNamedItem(dataOff);

    this.hiddenState.subscribe((hidden) => {
      if (hidden) container.classList.add('d-none');
      else container.classList.remove('d-none');
    });

    let events = DomEvent.on(
      container,
      'mousedown dblclick',
      DomEvent.stopPropagation
    )
      .on(container, 'click', DomEvent.stop)
      .on(container, 'click', () => {
        input.checked = !input.checked;
        if (input.checked) {
          //this.rightLayer.remove();
          map.removeLayer(this.rightLayer);
          this.leftLayer.addTo(map);
        } else {
          //this.leftLayer.remove();
          map.removeLayer(this.leftLayer);
          this.rightLayer.addTo(map);
        }
      });

    return container;
  }

  override onRemove(map: Map) {}

  public setLayers(rightLayer: LayerGroup, leftLayer: LayerGroup) {
    this.rightLayer = rightLayer;
    this.leftLayer = leftLayer;
    this.input.checked = false;
    this.rightLayer.addTo(this.map);
    //this.leftLayer.addTo(this.map);
    this.hiddenState.next(false);
  }

  constructor(options?: ControlOptions) {
    super(options);
  }
}
