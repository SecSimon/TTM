import { EventEmitter } from "@angular/core";
import { StringExtension } from "../util/string-extension";
import { AssetGroup, LowMediumHighNumber, MyData } from "./assets";
import { CharScope } from "./char-scope";
import { MyComponentType, MyComponent, MyComponentStack, MyComponentTypeIDs } from "./component";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataChangedTypes, IDatabaseBase, IDataChanged, IDataReferences } from "./database";
import { DFDContainerRef, DFDElement, DFDElementRef } from "./dfd-model";
import { CtxDiagram, Diagram, DiagramTypes, HWDFDiagram } from "./diagram";
import { ObjImpact } from "./obj-impact";
import { DeviceThreat } from "./device-threat";
import { ThreatCategory, ThreatMapping } from "./threat-model";
import { ThreatActor, ThreatSources } from "./threat-source";
import { ContextElement, ContextElementRef, ContextElementTypes, Device, MobileApp, SystemContext, SystemContextContainerRef } from "./system-context";
import { Checklist, ChecklistType } from "./checklist";
import { INote, ITask, MitigationMapping, MitigationProcess } from "./mitigations";
import { FileUpdateService } from "../util/file-update.service";

export interface IProjectFile extends IDatabaseBase {
  charSope: {};
  objImpact: {};
  sysContext: {};

  assetGroups: {}[];
  myData: {}[];
  threatActors: {}[];
  threatSources: {};
  deviceThreats: {}[];

  contextElements: {}[];
  dfdElements: {}[];
  diagrams: {}[];
  stacks: {}[];
  components: {}[];

  threatMappings: {}[];
  mitigationMappings: {}[]
  mitigationProcesses: {}[];

  checklists: {}[];

  config: {};
}

export interface IUserInfo {
  Name: string;
  Email: string;
}

export class ProjectFile extends DatabaseBase {
  private config: ConfigFile;
  private fileChanged = false;

  private charScope: CharScope;
  private objImpact: ObjImpact;
  private sysContext: SystemContext;
  
  private assetGroups: AssetGroup[] = [];
  private myData: MyData[] = [];
  private threatActors: ThreatActor[] = [];
  private threatSources: ThreatSources;
  private deviceThreats: DeviceThreat[] = [];

  private contextElementMap = new Map<string, ContextElement>();
  private dfdElementMap = new Map<string, DFDElement>();
  private diagrams: Diagram[] = [];
  private stacks: MyComponentStack[] = [];
  private componentMap = new Map<string, MyComponent>();
  
  private threatMappingMap = new Map<string, ThreatMapping>();
  private mitigationMappingMap = new Map<string, MitigationMapping>();
  private mitigationProcesses: MitigationProcess[] = [];

  private checklists: Checklist[] = [];

  public get Version(): number { return this.Data['Version']; }
  public get ProgressTracker() { return this.Data['ProgressTracker']; }
  public get ProgressStep(): number { return this.Data['ProgressStep']; }
  public set ProgressStep(val: number) { this.Data['ProgressStep'] = val; }
  public get FileChanged(): boolean {
    return this.fileChanged || this.Config.FileChanged;
  }
  public set FileChanged(val: boolean) { 
    this.fileChanged = val;
    if (val) this.DataChanged.emit();
  }

  public get UserVersion(): string { return this.Data['UserVersion']; }
  public set UserVersion(val: string) { this.Data['UserVersion'] = val; }
  public get Participants(): IUserInfo[] { return this.Data['Participants']; }
  public set Participants(val: IUserInfo[]) { this.Data['Participants'] = val; }
  public get Tasks(): ITask[] { return this.Data['Tasks']; }
  public set Tasks(val: ITask[]) { this.Data['Tasks'] = val; }
  public get Notes(): INote[] { return this.Data['Notes']; }
  public set Notes(val: INote[]) { this.Data['Notes'] = val; }

  public GetCharScope(): CharScope { return this.charScope; }
  public GetObjImpact(): ObjImpact { return this.objImpact; }
  public GetSysContext(): SystemContext { return this.sysContext; }

  public GetAssetGroups(): AssetGroup[] { return this.assetGroups; }
  public GetMyDatas(): MyData[] { return this.myData; }
  public GetThreatActors(): ThreatActor[] { return this.threatActors; }
  public GetThreatSources(): ThreatSources { return this.threatSources; }
  public GetDeviceThreats(): DeviceThreat[] { return this.deviceThreats; }
  
  public GetContextElements(): ContextElement[] { return Array.from(this.contextElementMap, ([k, v]) => v); }
  public GetDFDElements(): DFDElement[] { return Array.from(this.dfdElementMap, ([k, v]) => v); }
  public GetDiagrams(): Diagram[] { return this.diagrams; }
  public GetStacks(): MyComponentStack[] { return this.stacks; }
  public GetDevices(): Device[] { return this.GetContextElements().filter(x => x.Type == ContextElementTypes.Device && x instanceof Device) as Device[]; }
  public GetMobileApps(): MobileApp[] { return this.GetContextElements().filter(x => x.Type == ContextElementTypes.MobileApp && x instanceof MobileApp) as MobileApp[]; }
  public GetDFDiagrams(): Diagram[] { return this.diagrams.filter(x => x.DiagramType == DiagramTypes.DataFlow); }
  public GetComponents(): MyComponent[] { return Array.from(this.componentMap, ([k, v]) => v); }

  public GetThreatMappings(): ThreatMapping[] { return Array.from(this.threatMappingMap, ([k, v]) => v); }
  public GetMitigationMappings(): MitigationMapping[] { return Array.from(this.mitigationMappingMap, ([k, v]) => v); }
  public GetMitigationProcesses(): MitigationProcess[] { return this.mitigationProcesses; }

  public GetChecklists(): Checklist[] { return this.checklists; }

  public get Config(): ConfigFile { return this.config; }

  public DevicesChanged = new EventEmitter<IDataChanged>();
  public MobileAppsChanged = new EventEmitter<IDataChanged>();
  public ContextElementsChanged = new EventEmitter<IDataChanged>();
  public DFDElementsChanged = new EventEmitter<IDataChanged>();
  public MyComponentsChanged = new EventEmitter<IDataChanged>();
  public ThreatMappingsChanged = new EventEmitter<IDataChanged>();
  public MitigationMappingsChanged = new EventEmitter<IDataChanged>();
  public MitigationProcessesChanged = new EventEmitter<IDataChanged>();

  constructor(data: {}, cf: ConfigFile) {
    super(data);
    if (!this.Data['Name']) this.Data['Name'] = 'New Project';
    if (!this.Data['Version']) this.Data['Version'] = FileUpdateService.ProjectVersion;
    if (!this.Data['ProgressTracker']) this.Data['ProgressTracker'] = {};
    if (!this.Data['Participants']) this.Data['Participants'] = [];
    if (!this.Data['Tasks']) this.Data['Tasks'] = [];
    if (!this.Data['Notes']) this.Data['Notes'] = [];
    this.config = cf;
  }

  public InitializeNewProject() {
    this.charScope = new CharScope({}, this, this.config);
    this.objImpact = new ObjImpact({}, this, this.config);
    this.sysContext = new SystemContext({}, this, this.config);
    this.threatSources = new ThreatSources({}, this, this.config);
  }

  public CreateDevice(): Device {
    let dev = ContextElement.Instantiate(ContextElementTypes.Device, this, this.Config);
    this.AddContextElement(dev);
    this.DevicesChanged.emit({ ID: dev.ID, Type: DataChangedTypes.Added });
    return dev as Device;
  }

  public CreateMobileApp(): MobileApp {
    let app = ContextElement.Instantiate(ContextElementTypes.MobileApp, this, this.Config);
    this.AddContextElement(app);
    this.MobileAppsChanged.emit({ ID: app.ID, Type: DataChangedTypes.Added });
    return app as MobileApp;
  }

  public AddContextElement(element: ContextElement): boolean {
    if (!this.contextElementMap.has(element.ID)) {
      this.contextElementMap.set(element.ID, element);
      return true;
    }
    return false;
  }

  public DeleteContextElement(element: ContextElement): boolean {
    if (this.contextElementMap.has(element.ID)) {
      element.OnDelete(this, this.config);
      this.contextElementMap.delete(element.ID);
      this.ContextElementsChanged.emit({ ID: element.ID, Type: DataChangedTypes.Removed });
      if (element instanceof Device) this.DevicesChanged.emit({ ID: element.ID, Type: DataChangedTypes.Removed });
      if (element instanceof MobileApp) this.MobileAppsChanged.emit({ ID: element.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public GetContextElement(ID: string) {
    return this.contextElementMap.get(ID);
  }

  public GetContextElementRefs(): ContextElementRef[] { return this.GetContextElements().filter(x => x instanceof ContextElementRef || x instanceof SystemContextContainerRef) as ContextElementRef[]; }

  public MoveItemInContextElements(prevIndex: number, currIndex: number) {
    this.moveItemInMap<ContextElement>('contextElementMap', prevIndex, currIndex);
  }

  public GetAssetGroup(ID: string) {
    return this.assetGroups.find(x => x.ID == ID);
  }

  public CreateAssetGroup(parentGroup: AssetGroup): AssetGroup {
    let res = new AssetGroup({}, this, this.Config);
    this.assetGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Asset Group', this.assetGroups.map(x => x.Name));
    if (parentGroup != null) parentGroup.AddAssetGroup(res);
    return res;
  }

  public DeleteAssetGroup(group: AssetGroup) {
    const index = this.assetGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this, this.config);
      this.assetGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public GetMyData(ID: string) {
    return this.myData.find(x => x.ID == ID);
  }

  public CreateMyData(asset: AssetGroup): MyData {
    let res = new MyData({}, this, this.Config);
    if (asset) asset.AddMyData(res);
    this.myData.push(res);
    res.Name = StringExtension.FindUniqueName('Data', this.GetMyDatas().map(x => x.Name));
    return res;
  }

  public DeleteMyData(data: MyData): boolean {
    const index = this.myData.indexOf(data);
    if (index >= 0) {
      data.OnDelete(this, this.config);
      this.myData.splice(index, 1);
    }
    return index >= 0;
  }

  public GetThreatActor(ID: string) {
    return this.threatActors.find(x => x.ID == ID);
  }

  public CreateThreatActor() {
    let res = new ThreatActor({}, this.Config);
    res.Name = StringExtension.FindUniqueName('Threat Actor', this.threatActors.map(x => x.Name));
    res.Likelihood = LowMediumHighNumber.Medium;
    res.Motive = [];
    this.threatActors.push(res);
    return res;
  }

  public DeleteThreatActor(ta: ThreatActor) {
    const index = this.threatActors.indexOf(ta);
    if (index >= 0) {
      this.threatActors.splice(index, 1);
    }
    return index >= 0;
  }

  public GetDeviceThreat(ID: string) {
    return this.deviceThreats.find(x => x.ID == ID);
  }

  public CreateDeviceThreat(cat: ThreatCategory): DeviceThreat {
    let res = new DeviceThreat({}, this, this.Config);
    res.Name = StringExtension.FindUniqueName(cat ? cat.Name : 'Threat', this.GetDeviceThreats().map(x => x.Name));
    res.ThreatCategory = cat;
    this.deviceThreats.push(res);
    return res;
  }

  public DeleteDeviceThreat(dt: DeviceThreat): boolean {
    const index = this.deviceThreats.indexOf(dt);
    if (index >= 0) {
      dt.OnDelete(this, this.config);
      this.deviceThreats.splice(index, 1);
    }
    return index >= 0;
  }

  public AddDFDElement(element: DFDElement): boolean {
    if (!this.dfdElementMap.has(element.ID)) {
      this.dfdElementMap.set(element.ID, element);
      this.DFDElementsChanged.emit({ ID: element.ID, Type: DataChangedTypes.Added });
      return true;
    }
    return false;
  }

  public DeleteDDFElement(element: DFDElement): boolean {
    if (this.dfdElementMap.has(element.ID)) {
      element.OnDelete(this, this.config);
      this.dfdElementMap.delete(element.ID);
      this.DFDElementsChanged.emit({ ID: element.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public GetDFDElement(ID: string) {
    return this.dfdElementMap.get(ID);
  }

  public GetDFDElementRefs(): DFDElementRef[] { return this.GetDFDElements().filter(x => x instanceof DFDElementRef || x instanceof DFDContainerRef) as DFDElementRef[]; }

  public FindDeviceOfDiagram(dia: Diagram): Device {
    return this.GetDevices().find(x => x.HardwareDiagram.ID == dia.ID);
  }

  public CreateDiagram(type: DiagramTypes): Diagram {
    let dia: Diagram;
    if (type == DiagramTypes.Hardware || type == DiagramTypes.DataFlow) dia = new HWDFDiagram({}, this, this.Config);
    else if(type == DiagramTypes.Context || type == DiagramTypes.UseCase) dia = new CtxDiagram({}, this, this.Config);
    dia.DiagramType = type;
    let name = 'Context';
    if (type == DiagramTypes.UseCase) name = 'Use Case';
    else if (type == DiagramTypes.Hardware) name = 'Hardware';
    else if (type == DiagramTypes.DataFlow) name = 'Data Flow';
    dia.Name = StringExtension.FindUniqueName(name + ' Diagram', this.diagrams.filter(x => x.DiagramType == type).map(x => x.Name));
    this.diagrams.push(dia);
    return dia;
  }

  public GetDiagram(ID: string) {
    return this.diagrams.find(x => x.ID == ID);
  }

  public GetHWDFDiagrams() {
    return this.GetDiagrams().filter(x => [DiagramTypes.Hardware, DiagramTypes.DataFlow].includes(x.DiagramType));
  }

  public DeleteDiagram(diagram: Diagram): boolean {
    const index = this.diagrams.indexOf(diagram);
    if (index >= 0) {
      diagram.OnDelete(this, this.config);
      this.diagrams.splice(index, 1);
    }
    return index >= 0;
  }

  public FindDiagramOfElement(elementID: string): Diagram {
    //return this.GetHWDFDiagrams().find(x => (x as HWDFDiagram).Elements.GetChildrenFlat().some(y => y.ID == elementID));
    return this.GetDiagrams().find(x => x.Elements?.GetChildrenFlat().some(y => y.ID == elementID));
  } 

  public AddComponent(comp: MyComponent): boolean {
    if (!this.componentMap.has(comp.ID)) {
      this.componentMap.set(comp.ID, comp);
      return true;
    }
    return false;
  }

  public GetComponent(ID: string) {
    return this.componentMap.get(ID);
  }

  public CreateComponent(type: MyComponentType): MyComponent {
    let comp = new MyComponent({}, type, this, this.Config);
    this.componentMap.set(comp.ID, comp);
    return comp;
  }

  public DeleteComponent(comp: MyComponent) {
    if (this.componentMap.has(comp.ID)) {
      comp.OnDelete(this, this.config);
      this.componentMap.delete(comp.ID);
      return true;
    }
    return false;
  }

  public GetStack(ID: string): MyComponentStack {
    return this.stacks.find(x => x.ID == ID);
  }

  public CreateStack(type: MyComponentTypeIDs): MyComponentStack {
    let stack = new MyComponentStack({}, this, this.Config);
    stack.ComponentTypeID = type;
    this.stacks.push(stack);
    return stack;
  }

  public DeleteStack(stack: MyComponentStack) {
    const index = this.stacks.indexOf(stack);
    if (index >= 0) {
      stack.OnDelete(this, this.config);
      this.stacks.splice(index, 1);
    }
    return index >= 0;
  }

  public GetThreatMapping(ID: string) {
    return this.threatMappingMap.get(ID);
  }

  public CreateThreatMapping(viewID: string, isGenerated: boolean) {
    let map = new ThreatMapping({}, this, this.Config);
    map.IsGenerated = isGenerated;
    if (this.GetThreatMappings().length == 0) map.Number = '1';
    else map.Number = (Math.max(...this.GetThreatMappings().map(x => Number(x.Number)))+1).toString();
    //map.Number = StringExtension.FindUniqueName('', this.threatMappings.map(x => x.Number));
    map.ViewID = viewID;
    this.threatMappingMap.set(map.ID, map);
    this.ThreatMappingsChanged.emit({ ID: map.ID, Type: DataChangedTypes.Added });
    return map;
  }

  public DeleteThreatMapping(map: ThreatMapping) {
    if (this.threatMappingMap.has(map.ID)) {
      map.OnDelete(this, this.config);
      this.threatMappingMap.delete(map.ID);
      this.ThreatMappingsChanged.emit({ ID: map.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public CleanUpGeneratedThreatMappings() {
    this.threatMappingMap.forEach(x => {
      if (x.IsGenerated) this.threatMappingMap.delete(x.ID);
    });
  }

  public GetMitigationMapping(ID: string) {
    return this.mitigationMappingMap.get(ID);
  }

  public CreateMitigationMapping(viewID: string) {
    let map = new MitigationMapping({}, this, this.Config);
    if (this.GetMitigationMappings().length == 0) map.Number = '1';
    else map.Number = (Math.max(...this.GetMitigationMappings().map(x => Number(x.Number)))+1).toString();
    //map.Number = StringExtension.FindUniqueName('', this.threatMappings.map(x => x.Number));
    map.ViewID = viewID;
    this.mitigationMappingMap.set(map.ID, map);
    this.MitigationMappingsChanged.emit({ ID: map.ID, Type: DataChangedTypes.Added });
    return map;
  }

  public DeleteMitigationMapping(map: MitigationMapping) {
    if (this.mitigationMappingMap.has(map.ID)) {
      map.OnDelete(this, this.config);
      this.mitigationMappingMap.delete(map.ID);
      this.MitigationMappingsChanged.emit({ ID: map.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public GetMitigationProcess(ID: string) {
    return this.mitigationProcesses.find(x => x.ID == ID);
  }

  public CreateMitigationProcess() {
    let proc = new MitigationProcess({}, this, this.Config);
    if (this.mitigationProcesses.length == 0) proc.Number = '1';
    else proc.Number = (Math.max(...this.mitigationProcesses.map(x => Number(x.Number)))+1).toString();
    this.mitigationProcesses.push(proc);
    proc.Name = StringExtension.FindUniqueName('Mitigation Process', this.GetMitigationProcesses().map(x => x.Name));
    this.MitigationProcessesChanged.emit({ ID: proc.ID, Type: DataChangedTypes.Added });
    return proc;
  }

  public DeleteMitigationProcess(map: MitigationProcess) {
    const index = this.mitigationProcesses.indexOf(map);
    if (index >= 0) {
      map.OnDelete(this, this.config);
      this.mitigationProcesses.splice(index, 1);
      this.MitigationProcessesChanged.emit({ ID: map.ID, Type: DataChangedTypes.Removed });
    }
    return index >= 0;
  }

  public GetChecklist(ID: string) {
    return this.checklists.find(x => x.ID == ID);
  }

  public CreateChecklist(item: Device | MobileApp, type: ChecklistType): Checklist {
    let list = new Checklist({}, type, this, this.Config);
    list.Name = type.Name;
    item.AddChecklist(list);
    this.checklists.push(list);
    return list;
  }

  public DeleteChecklist(list: Checklist) {
    const index = this.checklists.indexOf(list);
    if (index >= 0) {
      list.OnDelete(this, this.config);
      this.checklists.splice(index, 1);
    }
    return index >= 0;
  }

  private moveItemInMap<Type>(mapName: string, prevIndex: number, currIndex: number) {
    let map = this[mapName] as Map<string, any>;
    let arr = Array.from(map.entries());
    arr.splice(currIndex, 0, arr.splice(prevIndex, 1)[0]);
    this[mapName] = new Map<string, Type>(arr);
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return null;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public ToJSON(): IProjectFile {
    let res: IProjectFile = {
      Data: this.Data,
      charSope: this.charScope.ToJSON(),
      objImpact: this.objImpact.ToJSON(),
      sysContext: this.sysContext.ToJSON(),
      assetGroups: [],
      myData: [],
      threatActors: [],
      threatSources: this.threatSources.ToJSON(),
      deviceThreats: [],
      contextElements: [],
      dfdElements: [],
      diagrams: [],
      stacks: [],
      components: [],
      threatMappings: [],
      mitigationMappings: [],
      mitigationProcesses: [],
      checklists: [],
      config: this.Config.ToJSON()
    };

    this.assetGroups.forEach(x => res.assetGroups.push(x.ToJSON()));
    this.myData.forEach(x => res.myData.push(x.ToJSON()));
    this.threatActors.forEach(x => res.threatActors.push(x.ToJSON()));
    this.deviceThreats.forEach(x => res.deviceThreats.push(x.ToJSON()));

    this.contextElementMap.forEach(x => res.contextElements.push(x.ToJSON()));
    this.dfdElementMap.forEach(x => res.dfdElements.push(x.ToJSON()));
    this.diagrams.forEach(x => res.diagrams.push(x.ToJSON()));
    this.stacks.forEach(x => res.stacks.push(x.ToJSON()));
    this.componentMap.forEach(x => res.components.push(x.ToJSON()));
    this.threatMappingMap.forEach(x => res.threatMappings.push(x.ToJSON()));
    this.mitigationMappingMap.forEach(x => res.mitigationMappings.push(x.ToJSON()));
    this.mitigationProcesses.forEach(x => res.mitigationProcesses.push(x.ToJSON()));

    this.checklists.forEach(x => res.checklists.push(x.ToJSON()));

    return res;
  }

  public static FromJSON(val: IProjectFile): ProjectFile {
    let cf = ConfigFile.FromJSON(val.config);
    let res = new ProjectFile(val.Data, cf);

    if (val.charSope) res.charScope = CharScope.FromJSON(val.charSope, res, cf);
    if (val.objImpact) res.objImpact = ObjImpact.FromJSON(val.objImpact, res, cf);
    if (val.sysContext) res.sysContext = SystemContext.FromJSON(val.sysContext, res, cf);
    val.assetGroups?.forEach(x => res.assetGroups.push(AssetGroup.FromJSON(x, res, cf)));
    val.myData?.forEach(x => res.myData.push(MyData.FromJSON(x, res, cf)));

    val.contextElements?.forEach(x => res.contextElementMap.set(x['ID'], ContextElement.FromJSON(x, res, cf)));
    val.dfdElements.forEach(x => res.dfdElementMap.set(x['ID'], DFDElement.FromJSON(x, res, cf)));
    val.diagrams.forEach(x => res.diagrams.push(Diagram.FromJSON(x, res, cf)));

    val.threatActors?.forEach(x => res.threatActors.push(ThreatActor.FromJSON(x, cf)));
    if (val.threatSources) res.threatSources = ThreatSources.FromJSON(val.threatSources, res, cf);
    val.deviceThreats?.forEach(x => res.deviceThreats.push(DeviceThreat.FromJSON(x, res, cf)));

    val.components.forEach(x => res.componentMap.set(x['ID'], MyComponent.FromJSON(x, res, cf)));
    val.stacks.forEach(x => res.stacks.push(MyComponentStack.FromJSON(x, res, cf)));
    val.threatMappings?.forEach(x => res.threatMappingMap.set(x['ID'], ThreatMapping.FromJSON(x, res, cf)));
    val.mitigationMappings?.forEach(x => res.mitigationMappingMap.set(x['ID'], MitigationMapping.FromJSON(x, res, cf)));
    val.mitigationProcesses?.forEach(x => res.mitigationProcesses.push(MitigationProcess.FromJSON(x, res, cf)));

    val.checklists?.forEach(x => res.checklists.push(Checklist.FromJSON(x, res, cf)));

    return res;
  }
}