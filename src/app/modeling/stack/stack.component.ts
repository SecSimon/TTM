import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MyComponentTypeGroup, MyComponent, MyComponentStack, MyComponentType, MyComponentTypeIDs } from '../../model/component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';
import { IDragDropData } from '../stencil-palette/stencil-palette.component';
import { QuestionDialogComponent } from './question-dialog/question-dialog.component';
import { PropertyEditTypes } from '../../model/database';

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss']
})
export class StackComponent implements OnInit {

  public menuTopLeftPosition = { x: '0', y: '0' };
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger;

  @Input()
  public stack: MyComponentStack;

  public get components(): MyComponent[] { return this.stack?.GetChildren(); }

  @Input()
  public selectedComponent: MyComponent;

  @Output()
  public selectionChanged = new EventEmitter<MyComponent>();

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: MatDialog, private dialogService: DialogService, public elRef: ElementRef) { }

  ngOnInit(): void {
  }

  public CompBadge(comp: MyComponent): string {
    if (comp.IsActive && !comp.UserCheckedElement) return '!';
    return '';
  }

  public GetGroups(): MyComponentTypeGroup[] {
    return this.dataService.Config.GetMyComponentTypeGroups(this.stack.ComponentTypeID);
  }

  public GetComponents(group: MyComponentTypeGroup): MyComponent[] {
    return this.components.filter(x => group.Types.includes(x.Type));
  }

  public OnComponentClick(comp: MyComponent) {
    this.selectedComponent = comp;
    this.selectionChanged.emit(comp);
  }

  public OnComponentDblClick(comp: MyComponent) {
    comp.IsActive = true;
    this.selectedComponent = comp;

    let data = {
      'components': this.components.filter(x => x.IsActive),
      'selectedComponent': this.selectedComponent
    };
    const dialogRef = this.dialog.open(QuestionDialogComponent, { hasBackdrop: true, data: data });
    dialogRef.afterClosed().subscribe(x => {
      this.selectedComponent = data['selectedComponent'];
    });
  }

  public OnDrop(event, group: MyComponentTypeGroup) {
    const data: IDragDropData = JSON.parse(event.dataTransfer.getData('dragDropData'));
    let type: MyComponentType;
    if (data.componentTypeID) type = this.dataService.Config.GetMyComponentType(data.componentTypeID);
    if (!type) type = this.dataService.Config.CreateMyComponentType(group);
    const c = this.dataService.Project.CreateComponent(type);
    c.SyncNameToTypeName = true;
    c.Name = type.Name;
    c.IsActive = true;
    c.IsThirdParty = false;
    this.stack.AddChild(c);
  }

  public AllowDrop(ev) {
    ev.preventDefault();
  }

  public GetComponentColor(comp: MyComponent): string {
    if (comp == this.selectedComponent) return this.theme.Primary;
    if (this.theme.IsDarkMode) return 'white';
    else return 'black';
  }

  public GetComponentPort(comp: MyComponent): string {
    if (comp.TypeID == MyComponentTypeIDs.Software) {
      const port = comp.GetProperties().find(x => x.Type == PropertyEditTypes.PortBox);
      if (port) return comp.GetProperty(port.ID);
    }

    return null;
  }

  public AddThreat(item: MyComponent) {
    if (!item) item = this.selectedComponent;
    if (item) {
      let map = this.dataService.Project.CreateAttackScenario(this.stack.ID, false);
      map.SetMapping('', [], item, [item], null, null, null, null);
      map.IsGenerated = false;
      this.dialogService.OpenAttackScenarioDialog(map, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteAttackScenario(map);
        }
      });
    }
  }

  public ShowCVESearch() {
    this.dialogService.OpenCveSearchDialog(this.selectedComponent, this.stack.ID);
  }

  public AddTestCase(item: MyComponent) {
    if (!item) item = this.selectedComponent;
    if (item) {
      const tc = this.dataService.Project.CreateTestCase();
      tc.AddLinkedElement(item);
      this.dialogService.OpenTestCaseDialog(tc, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteTestCase(tc);
        }
      });
    }
  }

  public AddCountermeasure(item: MyComponent) {
    if (!item) item = this.selectedComponent;
    if (item) {
      let map = this.dataService.Project.CreateCountermeasure(this.stack.ID, false);
      map.SetMapping(null, [item], []);
      this.dialogService.OpenCountermeasureDialog(map, true, this.stack.GetChildrenFlat()).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteCountermeasure(map);
        }
      });
    }
  }

  public OnDeleteElement(component: MyComponent) {
    this.dialogService.OpenDeleteObjectDialog(component).subscribe(res => {
      if (res) this.dataService.Project.DeleteComponent(component);
    });
  }

  public MoveLeft(item: MyComponent) {
    const group = this.GetGroups().find(x => this.GetComponents(x).includes(item));
    const groupComps = this.GetComponents(group);
    const allComps = this.stack.GetChildren();
    const prevIndex = allComps.indexOf(item);
    const newIndex = allComps.indexOf(groupComps[groupComps.indexOf(item)-1]);
    if (prevIndex > 0 && newIndex >= 0) {
      const arr = this.stack.Data['childrenIDs'];
      arr.splice(newIndex, 0, arr.splice(prevIndex, 1)[0]);
    }
  }

  public MoveRight(item: MyComponent) {
    const group = this.GetGroups().find(x => this.GetComponents(x).includes(item));
    const groupComps = this.GetComponents(group);
    const allComps = this.stack.GetChildren();
    const prevIndex = allComps.indexOf(item);
    const newIndex = allComps.indexOf(groupComps[groupComps.indexOf(item)+1]);
    if (prevIndex < allComps.length-1 && newIndex >= 0) {
      const arr = this.stack.Data['childrenIDs'];
      arr.splice(newIndex, 0, arr.splice(prevIndex, 1)[0]);
    }
  }

  public OpenContextMenu(event, comp: MyComponent) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    this.matMenuTrigger.menuData = { item: comp };
    this.matMenuTrigger.openMenu();
  }
}
