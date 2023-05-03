import { NgModule } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';
import { TabViewModule } from 'primeng/tabview';

const primeModules = [
  DropdownModule,
  CheckboxModule,
  ButtonModule,
  CardModule,
  PanelModule,
  AccordionModule,
  SliderModule,
  ProgressSpinnerModule,
  TabViewModule,
];

@NgModule({
  imports: primeModules,
  exports: primeModules,
})
export class PrimengModule {}
