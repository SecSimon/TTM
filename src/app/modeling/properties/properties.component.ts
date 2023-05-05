import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { MyComponent } from '../../model/component';
import { DatabaseBase, IProperty, ViewElementBase } from '../../model/database';
import { DataFlowEntity, DFDElement, ElementTypeIDs, IElementTypeThreat, StencilType, TrustArea } from '../../model/dfd-model';
import { DiagramTypes } from '../../model/diagram';
import { Device, DeviceInterfaceNameUtil, FlowArrowPositions, FlowArrowPositionUtil, FlowLineTypes, FlowLineTypeUtil, FlowTypes, FlowTypeUtil, SystemUseCase } from '../../model/system-context';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';
import { ThreatEngineService } from '../../util/threat-engine.service';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit {
  private _selectedObject: DatabaseBase;

  public get selectedObject(): DatabaseBase { return this._selectedObject; }
  @Input()
  public set selectedObject(val: DatabaseBase) { 
    this._selectedObject = val;
    setTimeout(() => {
      Array.from(document.getElementsByTagName('textarea')).forEach(x => {
        x.style.height = 'auto';
        x.style.height = x.scrollHeight.toString() + 'px';
      }); 
    }, 10);
    
    // focus first element when element was selected
    // setTimeout(() => {
    //   this.FocusFirst();
    // }, 100);
  };

  public get selectedElement(): DFDElement { return this._selectedObject as DFDElement; }
  
  @Output()
  public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() 
  public openQuestionnaire = new EventEmitter<MyComponent>();

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService, private threatEngine: ThreatEngineService,
    private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.key == 'F2') {
      event.preventDefault();
      this.FocusFirst();
    }
  }

  public FocusFirst() {
    const table = document.getElementById('proptable');
    if (table) {
      if (table.children.length > 0 && table.children[1].children.length > 0 && table.children[1].children[1].children.length > 0) {
        (table.children[1].children[1].children[0] as HTMLElement).focus();
      }
    }
  }

  public GetValue(prop: IProperty) {
    if (prop.ID == 'Name') {
      if (this.selectedObject['Ref'] != null) return this.selectedObject['Ref']['NameRaw'];
      return this.selectedObject.NameRaw;
    }
    return this.selectedObject.GetProperty(prop.ID);
  }

  public SetValue(prop: IProperty, value) {
    this.selectedObject.SetProperty(prop.ID, value);
  }

  public SetType(prop: IProperty, ID: string) {
    if (this.selectedObject instanceof DFDElement) {
      let stencilType = this.dataService.Config.GetStencilTypes().find(x => x.ID == ID);
      this.selectedObject.SetProperty(prop.ID, stencilType);
    }
    else {
      console.error('Cant set type of non DFDElement');
    }
  }

  public SetPhysicalElement(prop: IProperty, ID: string) {
    if (this.selectedObject instanceof DFDElement) {
      this.selectedObject.PhysicalElement = this.dataService.Project.GetDFDElement(ID) as DataFlowEntity;
    }
  }

  public GetStencilType() {
    if (this.selectedObject instanceof DFDElement) return this.selectedObject.GetProperty('Type').ID;
    return null;
  }

  public GetImpactCategory(prop: IProperty) {
    const arr = this.selectedObject.Data[prop.ID.split('-')[0]];
    const cat = Number(prop.ID.split('-')[1]);
    return arr.includes(cat);
  }

  public SetImpactCategory(prop: IProperty) {
    const cat = Number(prop.ID.split('-')[1]);
    const arr = this.selectedObject.Data[prop.ID.split('-')[0]];
    const index = arr.indexOf(cat);
    if (index >= 0) arr.splice(index, 1);
    else arr.push(cat);
  }

  public GetElementName(prop: IProperty): string {
    return this.selectedObject.GetProperty(prop.ID)?.Name;
  }

  public OnElementName(prop: IProperty) {
    let val = this.selectedObject.GetProperty(prop.ID);
    if (val && val instanceof ViewElementBase) {
      this.selectedObjectChanged.emit(val);
    }
  }

  public GetDiagramReference(prop: IProperty) {
    let id = this.selectedObject.GetProperty(prop.ID) as string;
    if (id) {
      let dia = this.dataService.Project.GetDiagram(id);
      if (dia) return dia.Name;
    }
    return '';
  }

  public OnDiagramReference(prop: IProperty) {
    let id = this.selectedObject.GetProperty(prop.ID);
    if (id) {
      const queryParams: Params = { viewID: id };
      if (this.selectedObject['Ref']) queryParams['elementID'] = this.selectedObject['Ref']['ID'];
      this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, replaceUrl: true });
    }
  }

  public GetAvailableDataFlowDiagrams() {
    let dia = this.dataService.Project.FindDiagramOfElement(this.selectedObject.ID);
    return this.dataService.Project.GetDiagrams().filter(x => x.ID != dia.ID && x.DiagramType == DiagramTypes.DataFlow);
  }

  public GetAvailableDiagrams() {
    let dia = this.dataService.Project.FindDiagramOfElement(this.selectedObject.ID);
    return this.dataService.Project.GetDiagrams().filter(x => x.ID != dia.ID && x.DiagramType == dia.DiagramType);
  }

  public GetAvailablePhysicalElements(element: DatabaseBase) {
    if (element instanceof DataFlowEntity) {
      return this.dataService.Project.GetDFDElements().filter(x => x.IsPhysical && x.GetProperty('Type').ElementTypeID == element.GetProperty('Type').ElementTypeID+1);
    }
    else if (element instanceof TrustArea) {
      return this.dataService.Project.GetDFDElements().filter(x => x.Type.ElementTypeID == ElementTypeIDs.PhyTrustArea);
    }
    return [];
  }

  public GetAvailableDevices() {
    return this.dataService.Project.GetDevices();
  }

  public GetAvailableInterfaces(dev: Device) {
    return dev.HardwareDiagram.Elements.GetChildrenFlat().filter(x => x.GetProperty('Type').ElementTypeID == ElementTypeIDs.Interface);
  }

  public SetInterface(prop: IProperty, elementID: string) {
    this.selectedObject.SetProperty(prop.ID, this.dataService.Project.GetDFDElement(elementID));
  }

  public GetAvailableTypes(element: DatabaseBase): StencilType[] {
    if (element instanceof DFDElement) return this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == element.GetProperty('Type').ElementTypeID);
    return [];
  }

  public GetProtocols() {
    return this.dataService.Config.GetProtocols();
  }

  public AddMyData(prop: IProperty) {
    let data = this.dataService.Project.CreateMyData(null);
    this.dialog.OpenAddMyDataDialog(data).subscribe(res => {
      if (res) {
        let val = this.selectedObject.GetProperty(prop.ID);
        val.push(data);
        this.selectedObject.SetProperty(prop.ID, val);
      }
      else {
        this.dataService.Project.DeleteMyData(data);
      }
    });
  }

  public GetMyDatas() {
    return this.dataService.Project.GetMyDatas();
    // let res = [];
    // this.dataService.Project.GetDevices().forEach(x => res.push(...x.AssetGroup.GetMyDataFlat()));
    // return res;
  }

  public GetFlowTypes() {
    return FlowTypeUtil.GetKeys();
  }

  public GetFlowTypeName(type: FlowTypes) {
    return FlowTypeUtil.ToString(type);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public GetLineTypes() {
    return FlowLineTypeUtil.GetKeys();
  }

  public GetLineTypeName(type: FlowLineTypes) {
    return FlowLineTypeUtil.ToString(type);
  }

  public GetArrowPositions() {
    return FlowArrowPositionUtil.GetKeys();
  }

  public GetArrowPositionName(type: FlowArrowPositions) {
    return FlowArrowPositionUtil.ToString(type);
  }

  public GetDeviceInterfaceNames() {
    return DeviceInterfaceNameUtil.GetKeys();
  }

  public GetMnemonics() {
    return this.dataService.Config.GetStencilThreatMnemonics();
  }

  public GetLetterTooltip(letter: IElementTypeThreat): string {
    let res = letter.Name;
    if (letter.Description?.length > 0) res += '\n\n'+ letter.Description;
    return res;
  }

  public AddMnemonicThreat(letter: IElementTypeThreat) {
    this.threatEngine.AddMnemonicThreat(this.selectedElement, letter);
  }

  public OpenNotes() {
    this.dialog.OpenNotesDialog((this.selectedObject as MyComponent).Notes, true, false, true, true);
  }

  public OpenQuestionnaire() {
    this.openQuestionnaire.emit(this.selectedObject as MyComponent);
  }

  public QuestionnaireBadge(): string {
    if (this.selectedObject instanceof MyComponent && this.selectedObject.IsActive) {
      const unanswered = Object.values(this.selectedObject.ThreatQuestions).filter(x => x == null).length;
      if (unanswered > 0) return unanswered.toString();
    }
    return '';
  }

  public NotesBadge(): string {
    if (this.selectedObject instanceof MyComponent) {
      const count = this.selectedObject.Notes.length;
      if (count > 0) return count.toString();
    }
    return '';
  }

  public CreateUseCaseDiagram() {
    let dia = this.dataService.Project.CreateDiagram(DiagramTypes.DataFlow);
    dia.Name = (this.selectedObject as SystemUseCase).Name;
    (this.selectedObject as SystemUseCase).DataFlowDiagramID = dia.ID;
    setTimeout(() => {
      const queryParams: Params = { viewID: dia.ID };
      this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, replaceUrl: true });
    }, 500);
  }

  public IsDFDElement(): boolean {
    return this.selectedObject instanceof DFDElement;
  }

  public IsComponent(): boolean {
    return this.selectedObject instanceof MyComponent;
  }

  public IsUseCase(): boolean {
    return this.selectedObject instanceof SystemUseCase;
  }
}
