import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  constructor(private language: LanguageService) {}

  ngOnInit() {}

  public setLang(lang: string) {
    this.language.changeLang(lang).subscribe();
  }
}
