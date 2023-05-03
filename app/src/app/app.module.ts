import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent, HeaderComponent, MapComponent } from './components';
import { DropdownComponent } from './components/ux/dropdown/dropdown.component';
import { SwitchComponent } from './components/ux/switch/switch.component';
import { TranslatePipe } from './core/pipes/translate.pipe';
import { LanguageService } from './core/services/language.service';
import { HomePageComponent, MapPageComponent } from './pages';
import { QueryMapService } from './pages/map-page/services/query-map.service';
import { PrimengModule } from './primeng/primeng.module';

const LanguageInitApp = {
  provide: APP_INITIALIZER,
  useFactory: (service: LanguageService) => {
    return () => service.changeLang('es');
  },
  deps: [LanguageService],
  multi: true,
};

@NgModule({
  imports: [
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    PrimengModule,
    AppRoutingModule,
  ],
  declarations: [
    AppComponent,
    FooterComponent,
    HeaderComponent,
    MapComponent,
    HomePageComponent,
    MapPageComponent,
    TranslatePipe,
    DropdownComponent,
    SwitchComponent,
  ],
  providers: [QueryMapService, LanguageInitApp, LanguageService],
  bootstrap: [AppComponent],
})
export class AppModule {}
