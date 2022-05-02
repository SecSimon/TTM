import { Component, ViewChild } from "@angular/core";
import { INavigationNode, NavTreeComponent } from "../nav-tree/nav-tree.component";

@Component({
  template: ''
})
export abstract class SideNavBase {

  public showLeftBar = true;

  @ViewChild(NavTreeComponent) navTree: NavTreeComponent;

  public OnSameRoute() {
    this.showLeftBar = !this.showLeftBar;
  }

  public SetNavTreeData(nodes) {
    this.navTree.SetNavTreeData(nodes);
  }
}