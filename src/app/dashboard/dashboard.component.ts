import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../util/data.service';
import { ThemeService } from '../util/theme.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(public theme: ThemeService, public dataService: DataService, private translate: TranslateService, private router: Router) { 
    if (!this.dataService.Project) {
      this.router.navigate(['/home'], {
        queryParams: { origin: 'dashboard' }
      });
    } 
  }

  ngOnInit(): void {
  }
}
