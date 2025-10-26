import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
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

//import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

const LanguageInitApp = provideAppInitializer(() => { 
  const service = inject(LanguageService);
  return service.changeLang('es')
  
});

@NgModule({
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
  bootstrap: [AppComponent],
  imports: [
    FormsModule,
    BrowserAnimationsModule,
    PrimengModule,
    AppRoutingModule
  ],
  providers: [
    QueryMapService,
    LanguageInitApp,
    LanguageService,
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })

  ]
})
export class AppModule { }
