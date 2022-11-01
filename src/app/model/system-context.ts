import { EventEmitter } from "@angular/core";
import { StringExtension } from "../util/string-extension";
import { AssetGroup, MyData } from "./assets";
import { Checklist } from "./checklist";
import { MyComponentStack, MyComponentTypeIDs } from "./component";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences, ViewElementBase, PropertyEditTypes, DataReferenceTypes, IContainer, IElementType } from "./database";
import { CtxDiagram, Diagram, DiagramTypes, HWDFDiagram } from "./diagram";
import { Countermeasure } from "./mitigations";
import { ProjectFile } from "./project-file";
import { AttackScenario } from "./threat-model";

export class SystemContext extends DatabaseBase {
  private project: ProjectFile;

  public get ContextDiagram(): CtxDiagram { return this.project?.GetDiagram(this.Data['contextDiagramID']) as CtxDiagram; }
  public set ContextDiagram(diagram: CtxDiagram) { this.Data['contextDiagramID'] = diagram.ID; }

  public get UseCaseDiagram(): CtxDiagram { return this.project?.GetDiagram(this.Data['useCaseDiagramID']) as CtxDiagram; }
  public set UseCaseDiagram(diagram: CtxDiagram) { this.Data['useCaseDiagramID'] = diagram.ID; }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data);

    this.project = pf;

    if (!this.Data['contextDiagramID']) {
      this.ContextDiagram = pf.CreateDiagram(DiagramTypes.Context) as CtxDiagram;
      this.ContextDiagram.Name = 'System Context';
      this.ContextDiagram.Elements.Name = 'System Context Diagram';
    }
    if (!this.Data['useCaseDiagramID']) {
      this.UseCaseDiagram = pf.CreateDiagram(DiagramTypes.UseCase) as CtxDiagram;
      this.UseCaseDiagram.Name = 'Use Cases';
      this.UseCaseDiagram.Elements.Name = 'Use Case Diagram';
    }

    if (this.UseCaseDiagram) {
      this.UseCaseDiagram.IsUseCaseDiagram = true;
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): SystemContext {
    return new SystemContext(data, pf, cf);
  }
}

export enum ContextElementTypes {
  None = 0,
  Device = 1,
  Interface = 2,
  Interactor = 3,
  UseCase = 4,
  Flow = 5,
  TrustArea = 6,
  MobileApp = 7,
  ExternalEntity = 8
}

export class ContextElementTypeUtil {
  public static Constructor(typeID: ContextElementTypes) {
    switch (typeID) {
      case ContextElementTypes.Device: return Device;
      case ContextElementTypes.MobileApp: return MobileApp;
      case ContextElementTypes.Interface: return DeviceInterface;
      case ContextElementTypes.Interactor: return Interactor;
      case ContextElementTypes.UseCase: return SystemUseCase;
      case ContextElementTypes.Flow: return ContextFlow;
      case ContextElementTypes.TrustArea: return SystemContextContainer;
      case ContextElementTypes.ExternalEntity: return SystemExternalEntity;
      default:
        console.error('Missing Element Type in ContextElementTypeUtil.Constructor()', typeID);
        return null;
    }
  }

  public static ToString(typeID: ContextElementTypes): string {
    switch (typeID) {
      case ContextElementTypes.Device: return 'Device';
      case ContextElementTypes.MobileApp: return 'App';
      case ContextElementTypes.Interface: return 'Device Interface';
      case ContextElementTypes.Interactor: return 'Interactor';
      case ContextElementTypes.UseCase: return 'Use Case';
      case ContextElementTypes.Flow: return 'Flow';
      case ContextElementTypes.TrustArea: return 'Trust Area';
      case ContextElementTypes.ExternalEntity: return 'External Entity';
      case ContextElementTypes.None: return 'Container';
      default:
        console.error('Missing Element Type in ContextElementTypeUtil.ToString()', typeID);
        return null;
    }
  }
} 

export class ContextElement extends ViewElementBase implements IElementType {
  protected project: ProjectFile;

  public get Type(): ContextElementTypes { return this.Data['Type']; }
  public set Type(val: ContextElementTypes) { 
    this.Data['Type'] = val; 
    this.TypeChanged.emit(val);
  }

  public get Parent(): SystemContextContainer { 
    let res = this.project.GetContextElement(this.Data['parentID']); 
    return res ? res as SystemContextContainer : null;
  }
  public set Parent(parent: SystemContextContainer) {
    if (this.Parent && this.Parent.ID != parent.ID) {
      this.Parent.RemoveChild(this);
    }
    this.Data['parentID'] = parent.ID;
  }

  public TypeChanged = new EventEmitter<ContextElementTypes>();

  constructor(data: {}, type: ContextElementTypes, pf: ProjectFile, cf: ConfigFile) {
    super(data);

    this.project = pf;
    this.Type = type;

    if (this.Name?.length == 0) {
      if (pf) {
        this.Name = StringExtension.FindUniqueName(ContextElementTypeUtil.ToString(type), pf.GetContextElements().map(x => x.GetProperty('Name')));
      }
      else {
        this.Name = type.toString();
      }
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs = super.FindReferences(pf, cf);
    pf?.GetContextElementRefs().filter(x => x.Ref.ID == this.ID).forEach(x => refs.push({ Type: DataReferenceTypes.DeleteElementReferences, Param: x })); // ContextElementRefs
    pf?.GetContextElements().filter(x => x instanceof ContextFlow && [x.Sender?.ID, x.Receiver?.ID].includes(this.ID)).forEach(x => refs.push({ Type: DataReferenceTypes.DeleteContextFlow, Param: x })); // Sender/Receiver
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);
    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
      if (x.Type == DataReferenceTypes.DeleteElementReferences) pf.DeleteContextElement(x.Param as ContextElement);
      else if (x.Type == DataReferenceTypes.DeleteContextFlow) pf.DeleteContextElement(x.Param as ContextFlow);
    });

    if (this.Parent != null) {
      this.Parent.RemoveChild(this);
    }
  }

  public static Instantiate(type: ContextElementTypes, pf: ProjectFile, cf: ConfigFile): ContextElement {
    let element = ContextElementTypeUtil.Constructor(type);
    let res = new element({}, pf, cf);
    return res;
  }

  public static FromJSON(data: {}, pf: ProjectFile, cf: ConfigFile): ContextElement {
    let res: ContextElement;
    let type = data['Type'];

    if (data['refID']) res = new ContextElementRef(data, data['Type'], pf, cf);
    else if (type == ContextElementTypes.Device) res = new Device(data, pf, cf);
    else if (type == ContextElementTypes.MobileApp) res = new MobileApp(data, pf, cf);
    else if (type == ContextElementTypes.Interface) res = new DeviceInterface(data, pf, cf);
    else if (type == ContextElementTypes.Interactor) res = new Interactor(data, pf, cf);
    else if (type == ContextElementTypes.UseCase) res = new SystemUseCase(data, pf, cf);
    else if (type == ContextElementTypes.Flow) res = new ContextFlow(data, pf, cf);
    else if (type == ContextElementTypes.ExternalEntity) res = new SystemExternalEntity(data, pf, cf);
    else if (type == ContextElementTypes.None) res = new SystemContextContainer(data, pf, cf);
    else {
      throw new Error('Unknown Type: ' + data['Type']);
    }

    return res;
  }
}

export enum DeviceInterfaceNames {
  None = 'properties.deviceinterfacenames.None',
  HumanInterface = 'properties.deviceinterfacenames.HumanInterface',
  MachineInterface = 'properties.deviceinterfacenames.MachineInterface',
  Environment = 'properties.deviceinterfacenames.Environment'
}

export class DeviceInterfaceNameUtil {
  public static GetKeys() {
    return [DeviceInterfaceNames.None, DeviceInterfaceNames.HumanInterface, DeviceInterfaceNames.MachineInterface, DeviceInterfaceNames.Environment];
  }
}

export class Device extends ContextElement {

  public static Icon: string = 'memory';

  public get Name(): string { return this.Data['Name']; }
  public set Name(val: string) {
    this.Data['Name'] = val;
    if (this.HardwareDiagram != null) this.HardwareDiagram.Name = this.Name + "'s Hardware";
    if (this.SoftwareStack != null) this.SoftwareStack.Name = this.Name + "'s Software";
    if (this.ProcessStack != null) this.ProcessStack.Name = this.Name + "'s Processes";
    this.NameChanged.emit(val);
  }

  public get AssetGroup(): AssetGroup { return this.project?.GetAssetGroup(this.Data['assetGroupID']); }

  public get HardwareDiagram(): HWDFDiagram { return this.project?.GetDiagram(this.Data['hardwareDiagramID']) as HWDFDiagram; }
  public set HardwareDiagram(diagram: HWDFDiagram) { this.Data['hardwareDiagramID'] = diagram.ID; }

  public get SoftwareStack(): MyComponentStack { return this.project?.GetStack(this.Data['softwareStackID']); }
  public set SoftwareStack(stack: MyComponentStack) { this.Data['softwareStackID'] = stack.ID; }
  public get ProcessStack(): MyComponentStack { return this.project?.GetStack(this.Data['processStackID']); }
  public set ProcessStack(stack: MyComponentStack) { this.Data['processStackID'] = stack.ID; }

  public get InterfaceTop(): DeviceInterfaceNames { return this.Data['InterfaceTop']; }
  public set InterfaceTop(val: DeviceInterfaceNames) {
    this.Data['InterfaceTop'] = val;
    this.DeviceInterfaceNameChanged.emit();
  }
  public get InterfaceRight(): DeviceInterfaceNames { return this.Data['InterfaceRight']; }
  public set InterfaceRight(val: DeviceInterfaceNames) {
    this.Data['InterfaceRight'] = val;
    this.DeviceInterfaceNameChanged.emit();
  }
  public get InterfaceBottom(): DeviceInterfaceNames { return this.Data['InterfaceBottom']; }
  public set InterfaceBottom(val: DeviceInterfaceNames) {
    this.Data['InterfaceBottom'] = val;
    this.DeviceInterfaceNameChanged.emit();
  }
  public get InterfaceLeft(): DeviceInterfaceNames { return this.Data['InterfaceLeft']; }
  public set InterfaceLeft(val: DeviceInterfaceNames) {
    this.Data['InterfaceLeft'] = val;
    this.DeviceInterfaceNameChanged.emit();
  }

  public DeviceInterfaceNameChanged = new EventEmitter();

  public get Checklists(): Checklist[] { 
    let res: Checklist[] = [];
    this.Data['checklistIDs'].forEach(x => res.push(this.project.GetChecklist(x)));
    return res;
  }
  public set Checklists(val: Checklist[]) { this.Data['checklistIDs'] = val?.map(x => x.ID); }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.Device, pf, cf);

    if (!this.Data['assetGroupID']) {
      let root = pf.InitializeNewAssetGroup(cf);
      this.Data['assetGroupID'] = root.ID;
    }

    if (!this.Data['hardwareDiagramID']) {
      this.HardwareDiagram = pf.CreateDiagram(DiagramTypes.Hardware) as HWDFDiagram;
    }

    if (!this.Data['softwareStackID']) {
      this.SoftwareStack = pf.CreateStack(MyComponentTypeIDs.Software);
      cf.GetMyComponentSWTypeGroups().forEach(x => x.Types.forEach(y => this.SoftwareStack.AddChild(pf.CreateComponent(y))));
    }

    if (!this.Data['processStackID']) {
      this.ProcessStack = pf.CreateStack(MyComponentTypeIDs.Process);
      cf.GetMyComponentPTypeGroups().forEach(x => x.Types.forEach(y => this.ProcessStack.AddChild(pf.CreateComponent(y))));
    }

    if (!this.Data['checklistIDs']) this.Data['checklistIDs'] = [];

    if (this.InterfaceTop == null) {
      this.InterfaceTop = DeviceInterfaceNames.None;
      this.InterfaceRight = DeviceInterfaceNames.MachineInterface;
      this.InterfaceBottom = DeviceInterfaceNames.Environment;
      this.InterfaceLeft = DeviceInterfaceNames.HumanInterface;
    }

    this.Name = this.Name; // call setter
  }

  public AddChecklist(list: Checklist) {
    if (!this.Checklists.includes(list)) this.Data['checklistIDs'].push(list.ID);
  }

  public RemoveChecklist(list: Checklist) {
    if (this.Checklists.includes(list)) {
      this.Data['checklistIDs'].splice(this.Data['checklistIDs'].indexOf(list.ID), 1);
    }
  }

  public GetAttackScenarios(): AttackScenario[] {
    let res: AttackScenario[] = [];

    this.project.GetAttackScenarios().filter(x => x.ViewID == this.project.GetSysContext().ContextDiagram.ID).filter(x => x.Targets.includes(this)).forEach(x => res.push(x));
    let ucRef = this.project.GetContextElementRefs().filter(x => x.Ref.ID == this.ID).find(x => this.project.FindDiagramOfElement(x.ID)?.ID == this.project.GetSysContext().UseCaseDiagram.ID);
    if (ucRef) this.project.GetAttackScenarios().filter(x => x.ViewID == this.project.GetSysContext().UseCaseDiagram.ID).filter(x => x.Targets.includes(ucRef)).forEach(x => res.push(x));
    if (this.HardwareDiagram) res.push(...this.project.GetAttackScenarios().filter(x => x.ViewID == this.HardwareDiagram.ID));
    if (this.SoftwareStack) res.push(...this.project.GetAttackScenarios().filter(x => x.ViewID == this.SoftwareStack.ID));
    if (this.ProcessStack) res.push(...this.project.GetAttackScenarios().filter(x => x.ViewID == this.ProcessStack.ID));

    return res;
  }

  public GetCountermeasures(): Countermeasure[] {
    let res: Countermeasure[] = [];

    this.project.GetCountermeasures().filter(x => x.ViewID == this.project.GetSysContext().ContextDiagram.ID).filter(x => x.Targets.includes(this)).forEach(x => res.push(x));
    let ucRef = this.project.GetContextElementRefs().filter(x => x.Ref.ID == this.ID).find(x => this.project.FindDiagramOfElement(x.ID)?.ID == this.project.GetSysContext().UseCaseDiagram.ID);
    if (ucRef) this.project.GetCountermeasures().filter(x => x.ViewID == this.project.GetSysContext().UseCaseDiagram.ID).filter(x => x.Targets.includes(ucRef)).forEach(x => res.push(x));
    if (this.HardwareDiagram) res.push(...this.project.GetCountermeasures().filter(x => x.ViewID == this.HardwareDiagram.ID));
    if (this.SoftwareStack) res.push(...this.project.GetCountermeasures().filter(x => x.ViewID == this.SoftwareStack.ID));
    if (this.ProcessStack) res.push(...this.project.GetCountermeasures().filter(x => x.ViewID == this.ProcessStack.ID));

    return res;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = super.FindReferences(pf, cf);

    refs.push({ Type: DataReferenceTypes.DeleteDiagram, Param: this.HardwareDiagram });
    refs.push({ Type: DataReferenceTypes.DeleteStack, Param: this.SoftwareStack });
    refs.push({ Type: DataReferenceTypes.DeleteStack, Param: this.ProcessStack });

    refs.push({ Type: DataReferenceTypes.DeleteAssetGroup, Param: this.AssetGroup });
    this.Checklists.forEach(x => refs.push({ Type: DataReferenceTypes.DeleteChecklist, Param: x }));

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteDiagram) pf.DeleteDiagram(ref.Param as Diagram);
      else if (ref.Type == DataReferenceTypes.DeleteStack) pf.DeleteStack(ref.Param as MyComponentStack);
      else if (ref.Type == DataReferenceTypes.DeleteAssetGroup) pf.DeleteAssetGroup(ref.Param as AssetGroup);
      else if (ref.Type == DataReferenceTypes.DeleteChecklist) pf.DeleteChecklist(ref.Param as Checklist);
    });
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.InterfaceTop', 'InterfaceTop', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceRight', 'InterfaceRight', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceBottom', 'InterfaceBottom', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceLeft', 'InterfaceLeft', '', true, PropertyEditTypes.DevInterfaceName, true);
  }
}

export class SystemContextContainer extends ContextElement implements IContainer {

  private get children(): ContextElement[] { 
    let res = [];
    this.Data['childrenIDs'].forEach(x => res.push(this.project.GetContextElement(x)));
    return res.sort((a,b) => a.GroupId >= b.GroupId ? 1 : -1); 
  }

  public ChildrenChanged = new EventEmitter<boolean>();
  public get Root(): IContainer {
    return this.project.GetContextElement(this.Data['rootID']) as SystemContextContainer;
  }
  public set Root(val: IContainer) {
    this.Data['rootID'] = (val as SystemContextContainer)?.ID;
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.None, pf, cf);

    if (!this.Data['childrenIDs']) this.Data['childrenIDs'] = [];
  }

  protected initProperties(): void {
    super.initProperties();
    this.GetProperties().find(x => x.ID == 'Name').Type = PropertyEditTypes.TextBox;
  }

  public AddChild(child: ContextElement) {
    if (child == null) {
      console.error('child undefined');
      return;
    }
    if (!this.Data['childrenIDs'].includes(child.ID)) {
      this.Data['childrenIDs'].push(child.ID);
      child.Parent = this;
      this.project.AddContextElement(child);

      if (child instanceof SystemContextContainer) {
        child.Root = this.Root ? this.Root : this;
      }

      if (this.Root) this.Root.ChildrenChanged.emit(true);
      else this.ChildrenChanged.emit(true);
    }
  }

  public RemoveChild(child: ContextElement): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);
      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public DeleteChild(child: ContextElement): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);
      this.project.DeleteContextElement(child);
      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public GetChildren(): ContextElement[] {
    return this.children;
  }

  public GetChildrenFlat(): ContextElement[] {
    let res = [];
    res.push(...this.GetChildren());
    this.GetChildren().forEach(x => {
      if (x instanceof SystemContextContainer) res.push(...x.GetChildrenFlat());
    });

    return res;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = super.FindReferences(pf, cf);

    if (this.children.length > 0) refs.push({ Type: DataReferenceTypes.MoveChildElements, Param: this.Parent });

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);

    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
      if (x.Type == DataReferenceTypes.MoveChildElements) this.GetChildren().forEach(x => this.Parent.AddChild(x));
    });
  }
}

export class Interactor extends ContextElement {

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.Interactor, pf, cf);
  }

  protected initProperties(): void {
    super.initProperties();
    this.GetProperties().find(x => x.ID == 'Name').Type = PropertyEditTypes.TextBox;
  }
}

export enum FlowLineTypes {
  Solid = 1,
  Dashed = 2
}

export class FlowLineTypeUtil {
  public static GetKeys() {
    return [FlowLineTypes.Solid, FlowLineTypes.Dashed];
  }

  public static ToString(val: FlowLineTypes): string {
    switch (val) {
      case FlowLineTypes.Solid: return 'properties.Solid';
      case FlowLineTypes.Dashed: return 'properties.Dashed';
    }
  }
}

export enum FlowArrowPositions {
  Start = 1,
  End = 2,
  Both = 3,
  Initiator = 4,
  None = 5
}

export class FlowArrowPositionUtil {
  public static GetKeys() {
    return [FlowArrowPositions.Start, FlowArrowPositions.End, FlowArrowPositions.Both, FlowArrowPositions.Initiator, FlowArrowPositions.None];
  }

  public static ToString(val: FlowArrowPositions): string {
    switch (val) {
      case FlowArrowPositions.Start: return 'properties.flowarrowpositions.Start';
      case FlowArrowPositions.End: return 'properties.flowarrowpositions.End';
      case FlowArrowPositions.Both: return 'properties.flowarrowpositions.Both';
      case FlowArrowPositions.Initiator: return 'properties.flowarrowpositions.Initiator';
      case FlowArrowPositions.None: return 'properties.flowarrowpositions.None';
    }
  }
}

export enum FlowTypes {
  Normal = 1,
  Extend = 2,
  Include = 3
}

export class FlowTypeUtil {
  public static GetKeys() {
    return [FlowTypes.Normal, FlowTypes.Extend, FlowTypes.Include];
  }

  public static ToString(val: FlowTypes): string {
    switch (val) {
      case FlowTypes.Normal: return 'properties.Normal';
      case FlowTypes.Extend: return 'properties.Extend';
      case FlowTypes.Include: return 'properties.Include';
    }
  }
}

export interface ICanvasFlow {
  Sender: ViewElementBase;
  Receiver: ViewElementBase;
  FlowType: FlowTypes;
  ShowName: boolean;
  LineType: FlowLineTypes;
  LineTypeChanged: EventEmitter<FlowLineTypes>;
  BendFlow: boolean;
  BendFlowChanged: EventEmitter<boolean>;
  ArrowPos: FlowArrowPositions;
  ArrowPosChanged: EventEmitter<FlowArrowPositions>;
}

export class ContextFlow extends ContextElement implements ICanvasFlow {

  public get Sender(): ViewElementBase { return this.project.GetContextElement(this.Data['senderID']); }
  public set Sender(val: ViewElementBase) { this.Data['senderID'] = val?.ID; }
  public get Receiver(): ViewElementBase { return this.project.GetContextElement(this.Data['receiverID']); }
  public set Receiver(val: ViewElementBase) { this.Data['receiverID'] = val?.ID; }

  public get FlowType(): FlowTypes { return this.Data['FlowType']; }
  public set FlowType(val: FlowTypes) { 
    this.Data['FlowType'] = Number(val); 
    if (val == FlowTypes.Extend || val == FlowTypes.Include) {
      this.ShowName = true;
      this.LineType = FlowLineTypes.Dashed;
      this.ArrowPos = val == FlowTypes.Extend ? FlowArrowPositions.Start : FlowArrowPositions.End;
    }
    else {
      this.ShowName = false;
      this.LineType = FlowLineTypes.Solid;
      this.ArrowPos = FlowArrowPositions.End;
    }
    this.NameChanged.emit(this.Name);
  }

  public get ShowName(): boolean { return this.Data['ShowName']; }
  public set ShowName(val: boolean) { 
    this.Data['ShowName'] = val; 
    this.NameChanged.emit(this.GetProperty('Name'));
  }

  public get BendFlow(): boolean { return this.Data['BendFlow']; }
  public set BendFlow(val: boolean) { 
    this.Data['BendFlow'] = val;
    this.BendFlowChanged.emit(val);
  }

  public get LineType(): FlowLineTypes { return this.Data['LineType']; }
  public set LineType(val: FlowLineTypes) { 
    this.Data['LineType'] = Number(val);
    this.LineTypeChanged.emit(val);
  }

  public get ArrowPos(): FlowArrowPositions { return this.Data['ArrowPos']; }
  public set ArrowPos(val: FlowArrowPositions) { 
    this.Data['ArrowPos'] = Number(val);
    this.ArrowPosChanged.emit(val);
  }

  public LineTypeChanged = new EventEmitter<FlowLineTypes>();
  public ArrowPosChanged = new EventEmitter<FlowArrowPositions>();
  public BendFlowChanged = new EventEmitter<boolean>();

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.Flow, pf, cf);

    if (!this.Data['FlowType']) this.FlowType = FlowTypes.Normal;
    if (!this.Data['LineType']) this.LineType = FlowLineTypes.Solid;
    if (!this.Data['ArrowPos']) this.ArrowPos = FlowArrowPositions.End;
    if (this.Data['ShowName'] == null) this.ShowName = false;
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.Sender', 'Sender', '', true, PropertyEditTypes.ElementName, true);
    this.AddProperty('properties.Receiver', 'Receiver', '', true, PropertyEditTypes.ElementName, true);
    this.AddProperty('properties.FlowType', 'FlowType', '', true, PropertyEditTypes.FlowType, true);
    this.AddProperty('properties.ShowName', 'ShowName', '', true, PropertyEditTypes.CheckBox, true);
    this.AddProperty('properties.BendFlow', 'BendFlow', '', true, PropertyEditTypes.CheckBox, true);
    this.AddProperty('properties.LineType', 'LineType', '', true, PropertyEditTypes.LineType, true);
    this.AddProperty('properties.ArrowPos', 'ArrowPos', '', true, PropertyEditTypes.ArrowPosition, true);
  }
}

export class DeviceInterface extends ContextElement {

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.Interface, pf, cf);
  }

  protected initProperties(): void {
    super.initProperties();
    this.GetProperties().find(x => x.ID == 'Name').Type = PropertyEditTypes.TextBox;
  }
}

export class SystemUseCase extends ContextElement {

  public get DataFlowDiagramID(): string {
    return this.Data['dataFlowDiagramID'];
  }
  public set DataFlowDiagramID(val: string) {
    this.Data['dataFlowDiagramID'] = val;
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.UseCase, pf, cf);
  }

  protected initProperties(): void {
    super.initProperties();

    this.AddProperty('properties.DataFlowDiagram', 'DataFlowDiagramID', 'properties.DataFlowDiagram.tt', true, PropertyEditTypes.DataFlowDiagramReference, true);
    this.AddProperty('properties.OpenDataFlowDiagram', 'DataFlowDiagramID', '', true, PropertyEditTypes.DataFlowDiagramReference, false);
  }
}

export class MobileApp extends ContextElement {

  public static Icon: string = 'devices';

  public get Name(): string { return this.Data['Name']; }
  public set Name(val: string) {
    this.Data['Name'] = val;
    if (this.SoftwareStack != null) this.SoftwareStack.Name = this.Name + "'s Software";
    if (this.ProcessStack != null) this.ProcessStack.Name = this.Name + "'s Processes";
    this.NameChanged.emit(val);
  }

  public get AssetGroup(): AssetGroup { return this.project?.GetAssetGroup(this.Data['assetGroupID']); }

  public get SoftwareStack(): MyComponentStack { return this.project?.GetStack(this.Data['softwareStackID']); }
  public set SoftwareStack(stack: MyComponentStack) { this.Data['softwareStackID'] = stack.ID; }
  public get ProcessStack(): MyComponentStack { return this.project?.GetStack(this.Data['processStackID']); }
  public set ProcessStack(stack: MyComponentStack) { this.Data['processStackID'] = stack.ID; }

  public get InterfaceTop(): DeviceInterfaceNames { return this.Data['InterfaceTop']; }
  public set InterfaceTop(val: DeviceInterfaceNames) {
    this.Data['InterfaceTop'] = val;
    this.MobileAppInterfaceNameChanged.emit();
  }
  public get InterfaceRight(): DeviceInterfaceNames { return this.Data['InterfaceRight']; }
  public set InterfaceRight(val: DeviceInterfaceNames) {
    this.Data['InterfaceRight'] = val;
    this.MobileAppInterfaceNameChanged.emit();
  }
  public get InterfaceBottom(): DeviceInterfaceNames { return this.Data['InterfaceBottom']; }
  public set InterfaceBottom(val: DeviceInterfaceNames) {
    this.Data['InterfaceBottom'] = val;
    this.MobileAppInterfaceNameChanged.emit();
  }
  public get InterfaceLeft(): DeviceInterfaceNames { return this.Data['InterfaceLeft']; }
  public set InterfaceLeft(val: DeviceInterfaceNames) {
    this.Data['InterfaceLeft'] = val;
    this.MobileAppInterfaceNameChanged.emit();
  }

  public MobileAppInterfaceNameChanged = new EventEmitter();

  public get Checklists(): Checklist[] { 
    let res: Checklist[] = [];
    this.Data['checklistIDs'].forEach(x => res.push(this.project.GetChecklist(x)));
    return res;
  }
  public set Checklists(val: Checklist[]) { this.Data['checklistIDs'] = val?.map(x => x.ID); }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.MobileApp, pf, cf);

    if (!this.Data['assetGroupID']) {
      let root = pf.InitializeNewAssetGroup(cf);
      this.Data['assetGroupID'] = root.ID;
    }

    if (!this.Data['softwareStackID']) {
      this.SoftwareStack = pf.CreateStack(MyComponentTypeIDs.Software);
      //cf.GetMyComponentSWTypeGroups().forEach(x => x.Types.forEach(y => this.SoftwareStack.AddChild(pf.CreateComponent(y))));
    }

    if (!this.Data['processStackID']) {
      this.ProcessStack = pf.CreateStack(MyComponentTypeIDs.Process);
      cf.GetMyComponentPTypeGroups().forEach(x => x.Types.forEach(y => this.ProcessStack.AddChild(pf.CreateComponent(y))));
    }

    if (!this.Data['checklistIDs']) this.Data['checklistIDs'] = [];

    if (this.InterfaceTop == null) {
      this.InterfaceTop = DeviceInterfaceNames.None;
      this.InterfaceRight = DeviceInterfaceNames.MachineInterface;
      this.InterfaceBottom = DeviceInterfaceNames.None;
      this.InterfaceLeft = DeviceInterfaceNames.HumanInterface;
    }

    this.Name = this.Name; // call setter
  }

  public AddChecklist(list: Checklist) {
    if (!this.Checklists.includes(list)) this.Data['checklistIDs'].push(list.ID);
  }

  public RemoveChecklist(list: Checklist) {
    if (this.Checklists.includes(list)) {
      this.Data['checklistIDs'].splice(this.Data['checklistIDs'].indexOf(list.ID), 1);
    }
  }

  public GetAttackScenarios(): AttackScenario[] {
    let res: AttackScenario[] = [];

    this.project.GetAttackScenarios().filter(x => x.ViewID == this.project.GetSysContext().ContextDiagram.ID).filter(x => x.Targets.includes(this)).forEach(x => res.push(x));
    let ucRef = this.project.GetContextElementRefs().filter(x => x.Ref.ID == this.ID).find(x => this.project.FindDiagramOfElement(x.ID)?.ID == this.project.GetSysContext().UseCaseDiagram.ID);
    if (ucRef) this.project.GetAttackScenarios().filter(x => x.ViewID == this.project.GetSysContext().UseCaseDiagram.ID).filter(x => x.Targets.includes(ucRef)).forEach(x => res.push(x));
    if (this.SoftwareStack) res.push(...this.project.GetAttackScenarios().filter(x => x.ViewID == this.SoftwareStack.ID));
    if (this.ProcessStack) res.push(...this.project.GetAttackScenarios().filter(x => x.ViewID == this.ProcessStack.ID));

    return res;
  }

  public GetCountermeasures(): Countermeasure[] {
    let res: Countermeasure[] = [];

    this.project.GetCountermeasures().filter(x => x.ViewID == this.project.GetSysContext().ContextDiagram.ID).filter(x => x.Targets.includes(this)).forEach(x => res.push(x));
    let ucRef = this.project.GetContextElementRefs().filter(x => x.Ref.ID == this.ID).find(x => this.project.FindDiagramOfElement(x.ID)?.ID == this.project.GetSysContext().UseCaseDiagram.ID);
    if (ucRef) this.project.GetCountermeasures().filter(x => x.ViewID == this.project.GetSysContext().UseCaseDiagram.ID).filter(x => x.Targets.includes(ucRef)).forEach(x => res.push(x));
    if (this.SoftwareStack) res.push(...this.project.GetCountermeasures().filter(x => x.ViewID == this.SoftwareStack.ID));
    if (this.ProcessStack) res.push(...this.project.GetCountermeasures().filter(x => x.ViewID == this.ProcessStack.ID));

    return res;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = super.FindReferences(pf, cf);

    refs.push({ Type: DataReferenceTypes.DeleteStack, Param: this.SoftwareStack });
    refs.push({ Type: DataReferenceTypes.DeleteStack, Param: this.ProcessStack });

    refs.push({ Type: DataReferenceTypes.DeleteAssetGroup, Param: this.AssetGroup });
    this.Checklists.forEach(x => refs.push({ Type: DataReferenceTypes.DeleteChecklist, Param: x }));

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteDiagram) pf.DeleteDiagram(ref.Param as Diagram);
      else if (ref.Type == DataReferenceTypes.DeleteStack) pf.DeleteStack(ref.Param as MyComponentStack);
      else if (ref.Type == DataReferenceTypes.DeleteAssetGroup) pf.DeleteAssetGroup(ref.Param as AssetGroup);
      else if (ref.Type == DataReferenceTypes.DeleteChecklist) pf.DeleteChecklist(ref.Param as Checklist);
    });
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.InterfaceTop', 'InterfaceTop', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceRight', 'InterfaceRight', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceBottom', 'InterfaceBottom', '', true, PropertyEditTypes.DevInterfaceName, true);
    this.AddProperty('properties.InterfaceLeft', 'InterfaceLeft', '', true, PropertyEditTypes.DevInterfaceName, true);
  }
}

export class SystemExternalEntity extends ContextElement {

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, ContextElementTypes.ExternalEntity, pf, cf);
  }
}

export class ContextElementRef extends ContextElement {

  private get diagramID(): string {
    return this.project.FindDiagramOfElement(this.Ref.ID)?.ID;
  }

  public get Name(): string { return this.Ref?.GetProperty('Name') + '-Reference'; }
  public set Name(val: string) { 
    if (this.Ref) this.Ref.Name = val;
  }

  public get Ref(): ViewElementBase { return this.project?.GetContextElement(this.Data['refID']); }
  public set Ref(val: ViewElementBase) { 
    this.Data['refID'] = val.ID; 

    this.rerouteEvents();
  }

  constructor(data: {}, type: ContextElementTypes, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);

    this.rerouteEvents();
  }

  public GetProperty(propertyName: string) {
    if (propertyName == 'Ref') return this.Ref;
    else if (propertyName == 'diagramID') return this.diagramID;
    return this.Ref.GetProperty(propertyName);
  }

  public SetProperty(propertyName: string, value: any) {
    this.Ref.SetProperty(propertyName, value);
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.GoToRef', 'diagramID', '', true, PropertyEditTypes.DiagramReference, false);
  }

  private rerouteEvents() {
    if (!this.Ref) return; 
    this.Ref.NameChanged.subscribe(x => this.NameChanged.emit(x));
    this.Ref.DataChanged.subscribe(x => this.DataChanged.emit(x));
  }

  public static InstantiateRef(ref: ContextElement, pf: ProjectFile, cf: ConfigFile): ContextElement {
    if (ref instanceof SystemContextContainer) return SystemContextContainerRef.InstantiateRef(ref, pf, cf);
    let res = new ContextElementRef({}, ref.Type, pf, cf);
    res.Ref = ref;
    res.Data['Name'] = 'Reference to ' + ref.ID;
    return res;
  }
}

export class SystemContextContainerRef extends SystemContextContainer {

  private get diagramID(): string {
    return this.project.FindDiagramOfElement(this.Ref.ID).ID;
  }

  public get Name(): string { return this.Ref?.GetProperty('Name') + '-Reference'; }
  public set Name(val: string) { 
    if (this.Ref) this.Ref.Name = val;
  }

  public get Ref(): SystemContextContainer { return this.project?.GetContextElement(this.Data['refID']) as SystemContextContainer; }
  public set Ref(val: SystemContextContainer) { 
    this.Data['refID'] = val.ID; 

    this.rerouteEvents();
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, pf, cf);
    this.project = pf;

    this.rerouteEvents();
  }

  public GetProperty(id: string) {
    if (id == 'Ref') return this.Ref;
    else if (id == 'diagramID') return this.diagramID;
    return this.Ref.GetProperty(id);
  }

  public SetProperty(id: string, value: any) {
    this.Ref.SetProperty(id, value);
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.GoToRef', 'diagramID', '', true, PropertyEditTypes.DiagramReference, false);
  }

  private rerouteEvents() {
    if (!this.Ref) return; 
    this.Ref.NameChanged.subscribe(x => this.NameChanged.emit(x));
    this.Ref.DataChanged.subscribe(x => this.DataChanged.emit(x));
  }

  public static InstantiateRef(ref: SystemContextContainer, pf: ProjectFile, cf: ConfigFile): ContextElement {
    let res = new SystemContextContainerRef({}, pf, cf);
    res.Ref = ref;
    res.Data['Name'] = 'Reference to ' + ref.ID;
    return res;
  }
}