import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private lang: { [key: string]: string } = {};

  constructor(private language: LanguageService) {
    language.getLang().subscribe((lang) => {
      this.lang = lang;
    });
  }

  transform(key: string | null): string {
    let sanitKey = key !== null ? key : '';
    return this.lang[sanitKey] || sanitKey;
  }
}
