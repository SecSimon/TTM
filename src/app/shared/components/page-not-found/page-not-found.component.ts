import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../util/theme.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {
  constructor(public theme: ThemeService) {}

  ngOnInit(): void {
  }
}
