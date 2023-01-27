import { EventEmitter } from "@angular/core";
import { StringExtension } from "../util/string-extension";
import { AssetGroup, LowMediumHighNumber, MyData } from "./assets";
import { CharScope } from "./char-scope";
import { MyComponentType, MyComponent, MyComponentStack, MyComponentTypeIDs } from "./component";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataChangedTypes, IDatabaseBase, IDataChanged, IDataReferences, INote } from "./database";
import { DFDContainer, DFDContainerRef, DFDElement, DFDElementRef } from "./dfd-model";
import { CtxDiagram, Diagram, DiagramTypes, HWDFDiagram } from "./diagram";
import { ObjImpact } from "./obj-impact";
import { SystemThreat } from "./system-threat";
import { ThreatCategory, AttackScenario, ThreatStates } from "./threat-model";
import { ThreatActor, ThreatSources } from "./threat-source";
import { ContextElement, ContextElementRef, ContextElementTypes, Device, MobileApp, SystemContext, SystemContextContainerRef } from "./system-context";
import { Checklist, ChecklistType } from "./checklist";
import { Countermeasure, MitigationProcess, MitigationStates } from "./mitigations";
import { FileUpdateService } from "../util/file-update.service";
import { ExportTemplate } from "./export-template";
import { MyTag, MyTagChart as MyTagChart } from "./my-tags";

export interface IProjectFile extends IDatabaseBase {
  charSope: {};
  objImpact: {};
  sysContext: {};

  assetGroups: {}[];
  myData: {}[];
  threatActors: {}[];
  threatSources: {};
  systemThreats: {}[];

  contextElements: {}[];
  dfdElements: {}[];
  diagrams: {}[];
  stacks: {}[];
  components: {}[];

  attackScenarios: {}[];
  countermeasures: {}[]
  mitigationProcesses: {}[];

  checklists: {}[];

  tags: {}[];
  tagCharts: {}[];
  exportTemplates: {}[];

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
  private get projectAssetGroupId(): string { return this.Data['projectAssetGroupId']; }

  private myData: MyData[] = [];
  private threatActors: ThreatActor[] = [];
  private threatSources: ThreatSources;
  private systemThreats: SystemThreat[] = [];

  private contextElementMap = new Map<string, ContextElement>();
  private dfdElementMap = new Map<string, DFDElement>();
  private diagrams: Diagram[] = [];
  private stacks: MyComponentStack[] = [];
  private componentMap = new Map<string, MyComponent>();
  
  private attackScenarioMap = new Map<string, AttackScenario>();
  private countermeasureMap = new Map<string, Countermeasure>();
  private mitigationProcesses: MitigationProcess[] = [];

  private checklists: Checklist[] = [];

  private myTags: MyTag[] = [];
  private myTagCharts: MyTagChart[] = [];
  private exportTemplates: ExportTemplate[] = [];

  public get Version(): number { return this.Data['Version']; }
  public get TTModelerVersion(): string { return this.Data['TTModelerVersion']; }
  public set TTModelerVersion(val: string) { this.Data['TTModelerVersion'] = val; }
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
  public get Tasks(): INote[] { return this.Data['Tasks']; }
  public set Tasks(val: INote[]) { this.Data['Tasks'] = val; }
  public get Notes(): INote[] { return this.Data['Notes']; }
  public set Notes(val: INote[]) { this.Data['Notes'] = val; }
  public get Image(): string { return this.Data['Image']; }
  public set Image(val: string) { this.Data['Image'] = val; }

  public GetProjectName(): string { return StringExtension.FromCamelCase(this.Name.replace('.ttmp', '')); }

  public GetCharScope(): CharScope { return this.charScope; }
  public GetObjImpact(): ObjImpact { return this.objImpact; }
  public GetSysContext(): SystemContext { return this.sysContext; }

  public GetAssetGroups(): AssetGroup[] { return this.assetGroups; }
  public GetProjectAssetGroup(): AssetGroup { return this.GetAssetGroups().find(x => x.ID == this.projectAssetGroupId); }
  public GetMyDatas(): MyData[] { return this.myData; }
  public GetThreatActors(): ThreatActor[] { return this.threatActors; }
  public GetThreatSources(): ThreatSources { return this.threatSources; }
  public GetSystemThreats(): SystemThreat[] { return this.systemThreats; }
  
  public GetContextElements(): ContextElement[] { return Array.from(this.contextElementMap, ([k, v]) => v); }
  public GetDFDElements(): DFDElement[] { return Array.from(this.dfdElementMap, ([k, v]) => v); }
  public GetDiagrams(): Diagram[] { return this.diagrams; }
  public GetDFDiagrams(): Diagram[] { return this.diagrams.filter(x => x.DiagramType == DiagramTypes.DataFlow); }
  public GetStacks(): MyComponentStack[] { return this.stacks; }
  public GetDevices(): Device[] { return this.GetContextElements().filter(x => x.Type == ContextElementTypes.Device && x instanceof Device) as Device[]; }
  public GetMobileApps(): MobileApp[] { return this.GetContextElements().filter(x => x.Type == ContextElementTypes.MobileApp && x instanceof MobileApp) as MobileApp[]; }
  public GetComponents(): MyComponent[] { return Array.from(this.componentMap, ([k, v]) => v); }

  public GetAttackScenarios(): AttackScenario[] { return Array.from(this.attackScenarioMap, ([k, v]) => v); }
  public GetAttackScenariosApplicable(): AttackScenario[] { return this.GetAttackScenarios().filter(x => ![ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(x.ThreatState)); }
  public GetAttackScenariosNotApplicable(): AttackScenario[] { return this.GetAttackScenarios().filter(x => [ThreatStates.NotApplicable, ThreatStates.Duplicate].includes(x.ThreatState)); }
  public GetCountermeasures(): Countermeasure[] { return Array.from(this.countermeasureMap, ([k, v]) => v); }
  public GetCountermeasuresApplicable(): Countermeasure[] { return this.GetCountermeasures().filter(x => ![MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.Duplicate].includes(x.MitigationState)); }
  public GetCountermeasuresNotApplicable(): Countermeasure[] { return this.GetCountermeasures().filter(x => [MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.Duplicate].includes(x.MitigationState)); }
  public GetMitigationProcesses(): MitigationProcess[] { return this.mitigationProcesses; }

  public GetChecklists(): Checklist[] { return this.checklists; }

  public GetMyTags(): MyTag[] { return this.myTags; }
  public GetMyTagCharts(): MyTagChart[] { return this.myTagCharts; }
  public GetExportTemplates(): ExportTemplate[] { return this.exportTemplates; }

  public get Config(): ConfigFile { return this.config; }

  public DevicesChanged = new EventEmitter<IDataChanged>();
  public MobileAppsChanged = new EventEmitter<IDataChanged>();
  public ContextElementsChanged = new EventEmitter<IDataChanged>();
  public DFDElementsChanged = new EventEmitter<IDataChanged>();
  public MyComponentsChanged = new EventEmitter<IDataChanged>();
  public AttackScenariosChanged = new EventEmitter<IDataChanged>();
  public CountermeasuresChanged = new EventEmitter<IDataChanged>();
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

    if (!this.projectAssetGroupId) {
      let newGroup = this.InitializeNewAssetGroup(cf);
      this.Data['projectAssetGroupId'] = newGroup.ID;
    }
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

  public InitializeNewAssetGroup(cf: ConfigFile): AssetGroup {
    let copyMyData = (copySource: MyData, parent: AssetGroup): MyData => {
      let d = this.CreateMyData(parent);
      d.CopyFrom(copySource.Data);
      return d;
    };

    let copyGroup = (copySource: AssetGroup, parent: AssetGroup): AssetGroup => {
      let g = this.CreateAssetGroup(parent);
      g.CopyFrom(copySource.Data);
      g.Data['assetGroupIDs'] = [];
      copySource.SubGroups.forEach(copySubGroup => {
        let sg = copyGroup(copySubGroup, g);
        g.AddAssetGroup(sg);
      });
      g.Data['associatedDataIDs'] = [];
      copySource.AssociatedData.forEach(copyA => {
        let a = copyMyData(copyA, g);
        g.AddMyData(a);
      });
      return g;
    };

    return copyGroup(cf.AssetGroups, null);
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
      ta.OnDelete(this, this.config);
      this.threatActors.splice(index, 1);
    }
    return index >= 0;
  }

  public GetSystemThreat(ID: string) {
    return this.systemThreats.find(x => x.ID == ID);
  }

  public CreateSystemThreat(cat: ThreatCategory): SystemThreat {
    let res = new SystemThreat({}, this, this.Config);
    res.Name = StringExtension.FindUniqueName(cat ? cat.Name : 'Threat', this.GetSystemThreats().map(x => x.Name));
    res.ThreatCategory = cat;
    this.systemThreats.push(res);
    return res;
  }

  public DeleteSystemThreat(dt: SystemThreat): boolean {
    const index = this.systemThreats.indexOf(dt);
    if (index >= 0) {
      dt.OnDelete(this, this.config);
      this.systemThreats.splice(index, 1);
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

  public GetAttackScenario(ID: string) {
    return this.attackScenarioMap.get(ID);
  }

  public CreateAttackScenario(viewID: string, isGenerated: boolean) {
    let as = new AttackScenario({}, this, this.Config);
    as.IsGenerated = isGenerated;
    if (this.GetAttackScenarios().length == 0) as.Number = '1';
    else as.Number = (Math.max(...this.GetAttackScenarios().map(x => Number(x.Number)))+1).toString();
    as.ViewID = viewID;
    this.attackScenarioMap.set(as.ID, as);
    this.AttackScenariosChanged.emit({ ID: as.ID, Type: DataChangedTypes.Added });
    return as;
  }

  public DeleteAttackScenario(map: AttackScenario) {
    if (this.attackScenarioMap.has(map.ID)) {
      map.OnDelete(this, this.config);
      this.attackScenarioMap.delete(map.ID);
      this.AttackScenariosChanged.emit({ ID: map.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public CleanUpGeneratedAttackScenarios() {
    this.attackScenarioMap.forEach(x => {
      if (x.IsGenerated) this.attackScenarioMap.delete(x.ID);
    });
  }

  public MoveItemAttackScenario(prevIndex: number, currIndex: number) {
    this.moveItemInMap<AttackScenario>('attackScenarioMap', prevIndex, currIndex);
  }

  public GetCountermeasure(ID: string) {
    return this.countermeasureMap.get(ID);
  }

  public CreateCountermeasure(viewID: string, isGenerated: boolean) {
    let map = new Countermeasure({}, this, this.Config);
    map.IsGenerated = isGenerated
    if (this.GetCountermeasures().length == 0) map.Number = '1';
    else map.Number = (Math.max(...this.GetCountermeasures().map(x => Number(x.Number)))+1).toString();
    map.ViewID = viewID;
    this.countermeasureMap.set(map.ID, map);
    this.CountermeasuresChanged.emit({ ID: map.ID, Type: DataChangedTypes.Added });
    return map;
  }

  public DeleteCountermeasure(map: Countermeasure) {
    if (this.countermeasureMap.has(map.ID)) {
      map.OnDelete(this, this.config);
      this.countermeasureMap.delete(map.ID);
      this.CountermeasuresChanged.emit({ ID: map.ID, Type: DataChangedTypes.Removed });
      return true;
    }
    return false;
  }

  public MoveItemCountermeasures(prevIndex: number, currIndex: number) {
    this.moveItemInMap<Countermeasure>('countermeasureMap', prevIndex, currIndex);
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
    list.Description = type.Description;
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

  public GetExportTemplate(ID: string) {
    return this.exportTemplates.find(x => x.ID == ID);
  }

  public CreateExportTemplate(): ExportTemplate {
    let template = new ExportTemplate({}, this, this.Config);
    template.Name = StringExtension.FindUniqueName('Export Template', this.GetExportTemplates().map(x => x.Name));
    this.exportTemplates.push(template);
    return template;
  }

  public DeleteExportTemplate(template: ExportTemplate) {
    const index = this.exportTemplates.indexOf(template);
    if (index >= 0) {
      template.OnDelete(this, this.config);
      this.exportTemplates.splice(index, 1);
    }
    return index >= 0;
  }

  public GetMyTag(ID: string) {
    return this.myTags.find(x => x.ID == ID);
  }

  public CreateMyTag(): MyTag {
    let tag = new MyTag({}, this, this.Config);
    tag.Name = StringExtension.FindUniqueName('Tag', this.GetMyTags().map(x => x.Name));
    this.myTags.push(tag);
    return tag;
  }

  public DeleteMyTag(tag: MyTag) {
    const index = this.myTags.indexOf(tag);
    if (index >= 0) {
      tag.OnDelete(this, this.config);
      this.myTags.splice(index, 1);
    }
    return index >= 0;
  }

  public GetMyTagChart(ID: string) {
    return this.myTagCharts.find(x => x.ID == ID);
  }

  public CreateMyTagChart(): MyTagChart {
    let chart = new MyTagChart({}, this, this.Config);
    chart.Name = StringExtension.FindUniqueName('Tag Chart', this.GetMyTagCharts().map(x => x.Name));
    this.myTagCharts.push(chart);
    return chart;
  }

  public DeleteMyTagChart(chart: MyTagChart) {
    const index = this.myTagCharts.indexOf(chart);
    if (index >= 0) {
      chart.OnDelete(this, this.config);
      this.myTagCharts.splice(index, 1);
    }
    return index >= 0;
  }

  public GetView(viewID: string) {
    let view: Diagram|MyComponentStack = this.GetDiagram(viewID);
    if (!view) view = this.GetStack(viewID);
    return view;
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
      systemThreats: [],
      contextElements: [],
      dfdElements: [],
      diagrams: [],
      stacks: [],
      components: [],
      attackScenarios: [],
      countermeasures: [],
      mitigationProcesses: [],
      checklists: [],
      tags: [],
      tagCharts: [],
      exportTemplates: [],
      config: this.Config.ToJSON()
    };

    this.assetGroups.forEach(x => res.assetGroups.push(x.ToJSON()));
    this.myData.forEach(x => res.myData.push(x.ToJSON()));
    this.threatActors.forEach(x => res.threatActors.push(x.ToJSON()));
    this.systemThreats.forEach(x => res.systemThreats.push(x.ToJSON()));

    this.contextElementMap.forEach(x => res.contextElements.push(x.ToJSON()));
    this.dfdElementMap.forEach(x => res.dfdElements.push(x.ToJSON()));
    this.diagrams.forEach(x => res.diagrams.push(x.ToJSON()));
    this.stacks.forEach(x => res.stacks.push(x.ToJSON()));
    this.componentMap.forEach(x => res.components.push(x.ToJSON()));
    this.attackScenarioMap.forEach(x => res.attackScenarios.push(x.ToJSON()));
    this.countermeasureMap.forEach(x => res.countermeasures.push(x.ToJSON()));
    this.mitigationProcesses.forEach(x => res.mitigationProcesses.push(x.ToJSON()));

    this.checklists.forEach(x => res.checklists.push(x.ToJSON()));
    this.myTags.forEach(x => res.tags.push(x.ToJSON()));
    this.myTagCharts.forEach(x => res.tagCharts.push(x.ToJSON()));
    this.exportTemplates.forEach(x => res.exportTemplates.push(x.ToJSON()));

    return res;
  }

  public static FromJSON(val: IProjectFile): ProjectFile {
    let cf = ConfigFile.FromJSON(val.config);
    let res = new ProjectFile(val.Data, cf);

    if (val.charSope) res.charScope = CharScope.FromJSON(val.charSope, res, cf);
    if (val.objImpact) res.objImpact = ObjImpact.FromJSON(val.objImpact, res, cf);
    val.assetGroups?.forEach(x => res.assetGroups.push(AssetGroup.FromJSON(x, res, cf)));
    val.myData?.forEach(x => res.myData.push(MyData.FromJSON(x, res, cf)));

    val.contextElements?.forEach(x => res.contextElementMap.set(x['ID'], ContextElement.FromJSON(x, res, cf)));
    val.dfdElements.forEach(x => res.dfdElementMap.set(x['ID'], DFDElement.FromJSON(x, res, cf)));
    val.diagrams.forEach(x => res.diagrams.push(Diagram.FromJSON(x, res, cf)));
    if (val.sysContext) res.sysContext = SystemContext.FromJSON(val.sysContext, res, cf);

    val.threatActors?.forEach(x => res.threatActors.push(ThreatActor.FromJSON(x, cf)));
    if (val.threatSources) res.threatSources = ThreatSources.FromJSON(val.threatSources, res, cf);
    val.systemThreats?.forEach(x => res.systemThreats.push(SystemThreat.FromJSON(x, res, cf)));

    val.components.forEach(x => res.componentMap.set(x['ID'], MyComponent.FromJSON(x, res, cf)));
    val.stacks.forEach(x => res.stacks.push(MyComponentStack.FromJSON(x, res, cf)));
    val.attackScenarios?.forEach(x => res.attackScenarioMap.set(x['ID'], AttackScenario.FromJSON(x, res, cf)));
    val.countermeasures?.forEach(x => res.countermeasureMap.set(x['ID'], Countermeasure.FromJSON(x, res, cf)));
    val.mitigationProcesses?.forEach(x => res.mitigationProcesses.push(MitigationProcess.FromJSON(x, res, cf)));

    val.checklists?.forEach(x => res.checklists.push(Checklist.FromJSON(x, res, cf)));

    val.tags?.forEach(x => res.myTags.push(MyTag.FromJSON(x, res, cf)));
    val.tagCharts?.forEach(x => res.myTagCharts.push(MyTagChart.FromJSON(x, res, cf)));
    val.exportTemplates?.forEach(x => res.exportTemplates.push(ExportTemplate.FromJSON(x, res, cf)));

    res.GetDFDElements().forEach(ele => {
      if (ele instanceof DFDContainer) {
        let childs = ele.GetChildren();
        if (childs.some(x => x == undefined)) {
          console.error('Uncleared reference');
          ele.Data['childrenIDs'] = childs.filter(x => x).map(x => x.ID);
        }
      }
    });

    return res;
  }
}