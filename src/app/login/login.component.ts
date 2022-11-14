import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ElectronService } from '../core/services';
import { DataService } from '../util/data.service';
import { ThemeService } from '../util/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(public theme: ThemeService, private route: ActivatedRoute, public dataService: DataService, private electronService: ElectronService) { }

  ngOnInit(): void {
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('oncode', (e, args) => {
        this.dataService.LogIn(args);
      });
    }
    else {
      this.route.queryParams.subscribe(params => {
        if (params['code'] != null) {
          this.dataService.LogIn(params['code']);
        }
      });
    }
  }

  public onInstallAppClick() {
    window.open('https://github.com/apps/thingthreatmodeler', '_blank');
  }

  public onForkDataClick() {
    window.open('https://github.com/SecSimon/TTM-data', '_blank');
  }

  public onGithubLogin() {
    if (this.electronService.isElectron) window.open('https://github.com/login/oauth/authorize?client_id=Iv1.6824f14edcb01831&redirect_uri=http://localhost:4200/login', '_self');
    else window.open('https://github.com/login/oauth/authorize?client_id=Iv1.6824f14edcb01831&redirect_uri=' + window.location.href.toString(), '_self');
  }
}
