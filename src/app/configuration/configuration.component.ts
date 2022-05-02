import { Component, OnInit } from '@angular/core';
import { INavigationNode } from '../shared/components/nav-tree/nav-tree.component';
import { SideNavBase } from '../shared/components/side-nav/side-nav-base';
import { DataService } from '../util/data.service';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';
import { ThemeService } from '../util/theme.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent extends SideNavBase implements OnInit {

  private _selectedNode;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
  }

  constructor(public theme: ThemeService, public dataService: DataService, private locStorageService: LocalStorageService) { 
    super();
  }

  ngOnInit(): void {
  }

  public GetSelectedTabIndex() {
    let index = this.locStorageService.Get(LocStorageKeys.PAGE_CONFIG_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.selectedNode = null;
    this.locStorageService.Set(LocStorageKeys.PAGE_CONFIG_TAB_INDEX, event);
  }

  public GetSplitSize(): number {
    let size = this.locStorageService.Get(LocStorageKeys.PAGE_CONFIG_SPLIT_SIZE_1);
    if (size != null) return Number(size);
    return 300;
  }

  public OnSplitSizeChange(event) {
    this.locStorageService.Set(LocStorageKeys.PAGE_CONFIG_SPLIT_SIZE_1, event['sizes'][0]);
  }
}
