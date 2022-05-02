import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DatabaseBase } from "../../../model/database";
import { INavigationNode } from "./nav-tree.component";

@Component({
  template: ''
})
export abstract class NavTreeBase {
  protected _selectedNode: INavigationNode; 
  
  public Nodes: INavigationNode[] = [];

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input() 
  public set selectedNode(val: INavigationNode) { this._selectedNode = val; }

  @Output()
  public nodeTreeChanged = new EventEmitter<INavigationNode[]>();

  public FindNodeOfObject(obj: DatabaseBase): INavigationNode {
    return NavTreeBase.findNodeOfObjectRec(obj, this.Nodes);
  }

  public static TransferExpandedState(oldNodes: INavigationNode[], newNodes: INavigationNode[]) {
    if (oldNodes == null || newNodes == null) return;
    let oldFlat = NavTreeBase.FlattenNodes(oldNodes);
    let newFlat = NavTreeBase.FlattenNodes(newNodes);
    newFlat.forEach(node => {
      if (node.data != null) { // identify by data
        let prev = oldFlat.find(x => x.data == node.data);
        if (prev && prev.isExpanded != null) node.isExpanded = prev.isExpanded;
      }
      else { // identify by name
        let prevs = oldFlat.filter(x => x.name() == node.name() && x.data == null);
        if (prevs?.length == 1) {
          if (prevs[0] && prevs[0].isExpanded != null) node.isExpanded = prevs[0].isExpanded;
        }
      }
    });
  }

  public static FlattenNodes(nodes: INavigationNode[]) {
    let flat: INavigationNode[] = [];
    let addNodes = (nodes: INavigationNode[]) => {
      nodes.forEach(x => {
        flat.push(x);
        if (x.children) addNodes(x.children);
      });
    };
    addNodes(nodes);
    return flat;
  }

  public static FindNodeOfObject(obj: DatabaseBase, nodes: INavigationNode[]): INavigationNode {
    return NavTreeBase.findNodeOfObjectRec(obj, nodes);
  }

  private static findNodeOfObjectRec(obj: DatabaseBase, nodes: INavigationNode[]): INavigationNode {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].data == obj) return nodes[i];
      else if (nodes[i].children) {
        let res = this.findNodeOfObjectRec(obj, nodes[i].children);
        if (res) return res;
      }
    }
  }
}