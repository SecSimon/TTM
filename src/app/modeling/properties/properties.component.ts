import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../../model/assets';
import { MyComponent } from '../../model/component';
import { DatabaseBase, IProperty, ViewElementBase } from '../../model/database';
import { DataFlowEntity, DFDElement, ElementTypeIDs, IElementTypeThreat, StencilType } from '../../model/dfd-model';
import { Diagram, DiagramTypes } from '../../model/diagram';
import { Device, DeviceInterfaceNames, DeviceInterfaceNameUtil, FlowArrowPositions, FlowArrowPositionUtil, FlowLineTypes, FlowLineTypeUtil, FlowTypes, FlowTypeUtil, SystemUseCase } from '../../model/system-context';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit {
  private _selectedObject: DatabaseBase;

  public get selectedObject(): DatabaseBase { return this._selectedObject; }
  @Input()
  public set selectedObject(val: DatabaseBase) { this._selectedObject = val; };

  public get selectedElement(): DFDElement { return this._selectedObject as DFDElement; }
  
  @Output()
  public selectedObjectChanged = new EventEmitter<ViewElementBase>();

  @Output() 
  public openQuestionnaire = new EventEmitter<MyComponent>();

  @Output()
  public openDiagram = new EventEmitter<Diagram>();

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService) { }

  ngOnInit(): void {
  }

  public GetValue(prop: IProperty) {
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

  public GetStencilType() {
    if (this.selectedObject instanceof DFDElement) return this.selectedObject.Type.ID;
    return null;
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
    if (id) this.openDiagram.emit(this.dataService.Project.GetDiagram(id));
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
      return this.dataService.Project.GetDFDElements().filter(x => x.IsPhysical && x.Type.ElementTypeID == element.Type.ElementTypeID+1);
    }
    return [];
  }

  public GetAvailableDevices() {
    return this.dataService.Project.GetDevices();
  }

  public GetAvailableInterfaces(dev: Device) {
    return dev.HardwareDiagram.Elements.GetChildrenFlat().filter(x => x.Type.ElementTypeID == ElementTypeIDs.Interface);
  }

  public SetInterface(prop: IProperty, elementID: string) {
    this.selectedObject.SetProperty(prop.ID, this.dataService.Project.GetDFDElement(elementID));
  }

  public GetAvailableTypes(element: DatabaseBase): StencilType[] {
    if (element instanceof DFDElement) return this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == element.Type.ElementTypeID);
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
    if (this.selectedObject) {
      let dia = this.dataService.Project.FindDiagramOfElement(this.selectedObject.ID);
      let map = this.dataService.Project.CreateThreatMapping(dia.ID, false);
      map.SetMapping('', [], this.selectedObject as DFDElement, [], null, null);
      map.IsGenerated = false;
      map.Name = letter.Name;
      map.Description = letter.Description;
      this.dialog.OpenThreatMappingDialog(map, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteThreatMapping(map);
        }
      });
    }
  }

  public OpenQuestionnaire() {
    this.openQuestionnaire.emit(this.selectedObject as MyComponent);
  }

  public CreateUseCaseDiagram() {
    let dia = this.dataService.Project.CreateDiagram(DiagramTypes.DataFlow);
    dia.Name = (this.selectedObject as SystemUseCase).Name.replace('\n', ' ');
    (this.selectedObject as SystemUseCase).DataFlowDiagramID = dia.ID;
    setTimeout(() => {
      this.openDiagram.emit(this.dataService.Project.GetDiagram(dia.ID));
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
