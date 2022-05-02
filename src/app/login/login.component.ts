import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../util/data.service';
import { LocalStorageService } from '../util/local-storage.service';
import { ThemeService } from '../util/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(public theme: ThemeService, private route: ActivatedRoute, public dataService: DataService, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['code'] != null) {
        this.dataService.LogIn(params['code']);
      }
    });
  }

  public onInstallAppClick() {
    window.open('https://github.com/apps/thingthreatmodeler', '_blank');
  }

  public onForkDataClick() {
    window.open('https://github.com/SecSimon/TTM-data', '_blank');
  }

  public onGithubLogin() {
    window.open('https://github.com/login/oauth/authorize?client_id=Iv1.6824f14edcb01831&redirect_uri=' + window.location.href.toString(), '_self');
  }
}
