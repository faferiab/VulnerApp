import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable()
export class LanguageService {
  private lang = new BehaviorSubject<{ [key: string]: string }>({});

  constructor(private client: HttpClient) {
  }

  public getLang() {
    return this.lang.asObservable();
  }

  public changeLang(lang: string) {
    return this.client.get<{}>(`assets/i18n/${lang}.json`).pipe(
      tap((file) => {
        this.lang.next(file);
      })
    );
  }
}
