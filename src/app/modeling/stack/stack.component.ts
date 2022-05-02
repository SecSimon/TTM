import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MyComponentTypeGroup, MyComponent, MyComponentStack, MyComponentType } from '../../model/component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';
import { IDragDropData } from '../stencil-palette/stencil-palette.component';
import { QuestionDialogComponent } from './question-dialog/question-dialog.component';

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

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: MatDialog, private dialogService: DialogService) { }

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
    let data: IDragDropData = JSON.parse(event.dataTransfer.getData('dragDropData'));
    let type: MyComponentType;
    if (data.componentTypeID) type = this.dataService.Config.GetMyComponentType(data.componentTypeID);
    if (!type) type = this.dataService.Config.CreateMyComponentType(group);
    let c = this.dataService.Project.CreateComponent(type);
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

  public AddThreat(item: MyComponent) {
    if (!item) item = this.selectedComponent;
    if (item) {
      let map = this.dataService.Project.CreateThreatMapping(this.stack.ID, false);
      map.SetMapping('', [], item, [item], null, null);
      map.IsGenerated = false;
      this.dialogService.OpenThreatMappingDialog(map, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteThreatMapping(map);
        }
      });
    }
  }

  public AddMitigation(item: MyComponent) {
    if (!item) item = this.selectedComponent;
    if (item) {
      let map = this.dataService.Project.CreateMitigationMapping(this.stack.ID);
      map.SetMapping(null, [item], []);
      map.IsGenerated = false;
      this.dialogService.OpenMitigationMappingDialog(map, true, this.stack.GetChildrenFlat()).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteMitigationMapping(map);
        }
      });
    }
  }

  public OnDeleteElement(component: MyComponent) {
    this.dialogService.OpenDeleteObjectDialog(component).subscribe(res => {
      if (res) this.dataService.Project.DeleteComponent(component);
    });
  }

  public OpenContextMenu(event, comp: MyComponent) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    this.matMenuTrigger.menuData = { item: comp };
    this.matMenuTrigger.openMenu();
  }
}
