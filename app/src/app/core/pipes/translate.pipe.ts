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

  transform(key: string): string {
    return this.lang[key] || key;
  }
}
