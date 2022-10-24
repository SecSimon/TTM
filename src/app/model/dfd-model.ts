
import { EventEmitter } from '@angular/core';
import { StringExtension } from '../util/string-extension';
import { LowMediumHighNumber, MyData } from './assets';
import { ConfigFile } from './config-file';
import { DatabaseBase, DataReferenceTypes, IContainer, IDataReferences, IElementType, IKeyValue, IProperty, PropertyEditTypes, ViewElementBase } from './database';
import { ProjectFile } from './project-file';
import { FlowArrowPositions, FlowLineTypes, FlowTypes, ICanvasFlow } from './system-context';
import { RuleTypes, ThreatCategory, ThreatMapping, ThreatRule } from './threat-model';

export enum ElementTypeIDs {
  None = 0,
  LogProcessing = 11,
  PhyProcessing = 12,
  LogDataStore = 21,
  PhyDataStore = 22,
  LogExternalEntity = 31,
  PhyExternalEntity = 32,
  DataFlow = 41,
  PhysicalLink = 51,
  Interface = 61,
  LogTrustArea = 71,
  PhyTrustArea = 72,
}

export class ElementTypeUtil {
  public static Constructor(typeID: ElementTypeIDs) {
    switch (typeID) {
      case ElementTypeIDs.LogTrustArea: return LogTrustArea;
      case ElementTypeIDs.PhyTrustArea: return PhyTrustArea;
      case ElementTypeIDs.LogProcessing: return LogProcessing;
      case ElementTypeIDs.PhyProcessing: return PhyProcessing;
      case ElementTypeIDs.LogDataStore: return LogDataStore;
      case ElementTypeIDs.PhyDataStore: return PhyDataStore;
      case ElementTypeIDs.LogExternalEntity: return LogExternalEntity;
      case ElementTypeIDs.PhyExternalEntity: return PhyExternalEntity;
      case ElementTypeIDs.DataFlow: return DataFlow;
      case ElementTypeIDs.PhysicalLink: return PhysicalLink;
      case ElementTypeIDs.Interface: return Interface;
      default:
        console.error('Missing Element Type in ElementTypeUtil.Constructor()', typeID);
        return null;
    }
  }

  public static GetPhyiscalID(typeID: ElementTypeIDs): ElementTypeIDs {
    switch (typeID) {
      case ElementTypeIDs.LogDataStore: return ElementTypeIDs.PhyDataStore;
      case ElementTypeIDs.LogProcessing: return ElementTypeIDs.PhyProcessing;
      case ElementTypeIDs.LogExternalEntity: return ElementTypeIDs.PhyExternalEntity;
      case ElementTypeIDs.LogTrustArea: return ElementTypeIDs.PhyTrustArea;
      default:
        return null;
    }
  }

  public static GetTypes(): ElementTypeIDs[] {
    return [
      ElementTypeIDs.LogProcessing, ElementTypeIDs.PhyProcessing,
      ElementTypeIDs.LogDataStore, ElementTypeIDs.PhyDataStore,
      ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity,
      ElementTypeIDs.LogTrustArea, ElementTypeIDs.PhyTrustArea,
      ElementTypeIDs.DataFlow, ElementTypeIDs.PhysicalLink, ElementTypeIDs.Interface
    ]
  }

  public static Icon(typeID: ElementTypeIDs) {
    switch (typeID) {
      case ElementTypeIDs.LogTrustArea: return LogTrustArea.Icon;
      case ElementTypeIDs.PhyTrustArea: return PhyTrustArea.Icon;
      case ElementTypeIDs.LogProcessing: return LogProcessing.Icon;
      case ElementTypeIDs.PhyProcessing: return PhyProcessing.Icon;
      case ElementTypeIDs.LogDataStore: return LogDataStore.Icon;
      case ElementTypeIDs.PhyDataStore: return PhyDataStore.Icon;
      case ElementTypeIDs.LogExternalEntity: return LogExternalEntity.Icon;
      case ElementTypeIDs.PhyExternalEntity: return PhyExternalEntity.Icon;
      case ElementTypeIDs.DataFlow: return DataFlow.Icon;
      case ElementTypeIDs.PhysicalLink: return PhysicalLink.Icon;
      case ElementTypeIDs.Interface: return Interface.Icon;
      default:
        console.error('Missing Element Type in ElementTypeUtil.Icon()', typeID);
        return null;
    }
  }

  public static IsPhysical(typeID: ElementTypeIDs): boolean {
    switch (typeID) {
      case ElementTypeIDs.None: return false;
      case ElementTypeIDs.LogTrustArea: return false;
      case ElementTypeIDs.PhyTrustArea: return true;
      case ElementTypeIDs.LogProcessing: return false;
      case ElementTypeIDs.PhyProcessing: return true;
      case ElementTypeIDs.LogDataStore: return false;
      case ElementTypeIDs.PhyDataStore: return true;
      case ElementTypeIDs.LogExternalEntity: return false;
      case ElementTypeIDs.PhyExternalEntity: return true;
      case ElementTypeIDs.DataFlow: return false;
      case ElementTypeIDs.PhysicalLink: return true;
      case ElementTypeIDs.Interface: return true;
      default:
        console.error('Missing Element Type in ElementTypeUtil.IsPhysical()', typeID);
        return null;
    }
  }

  public static ToString(typeID: ElementTypeIDs): string {
    switch (typeID) {
      case ElementTypeIDs.LogTrustArea: return "Logical Trust Area";
      case ElementTypeIDs.PhyTrustArea: return "Physical Trust Area";
      case ElementTypeIDs.LogProcessing: return "Logical Process";
      case ElementTypeIDs.PhyProcessing: return "Physical Processor";
      case ElementTypeIDs.LogDataStore: return "Logical Data Store";
      case ElementTypeIDs.PhyDataStore: return "Physical Data Store";
      case ElementTypeIDs.LogExternalEntity: return "Logical External Entity";
      case ElementTypeIDs.PhyExternalEntity: return "Physical External Entity";
      case ElementTypeIDs.DataFlow: return "Data Flow";
      case ElementTypeIDs.PhysicalLink: return "Physical Link";
      case ElementTypeIDs.Interface: return "Interface";
      default:
        console.error('Missing Element Type in ElementTypeUtil.ToString()', typeID);
        return null;
    }
  }
} 

export class StencilType extends DatabaseBase {
  private config: ConfigFile;

  public get ElementTypeID(): ElementTypeIDs { return this.Data['ElementTypeID']; }
  public set ElementTypeID(val: ElementTypeIDs) { this.Data['ElementTypeID'] = val; }
  public get IsDefault(): boolean { return this.Data['IsDefault']; }
  public set IsDefault(val: boolean) { this.Data['IsDefault'] = val; }
  public get Properties(): IProperty[] { return this.Data['Properties']; }
  public set Properties(val: IProperty[]) { this.Data['Properties'] = val; }
  public get PropertyOverwrites(): IKeyValue[] { return this.Data['PropertyOverwrites']; }
  public set PropertyOverwrites(val: IKeyValue[]) { this.Data['PropertyOverwrites'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;
    
    if (!this.Data['IsDefault']) this.Data['IsDefault'] = false;
    if (!this.Properties) this.Properties = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    // rules, elements
    pf?.GetDFDElements().filter(x => x.GetProperty('Type').ID == this.ID).forEach(x => res.push({ Type: DataReferenceTypes.ResetStencilType , Param: x }));
    cf.GetThreatRules().filter(x => x.RuleType == RuleTypes.Stencil && x.StencilRestriction?.stencilTypeID == this.ID).forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatRule , Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == this.ElementTypeID);
    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.ResetStencilType) {
        (ref.Param as DFDElement).SetProperty('Type', def); // reset the stencil type to default stencil
      }
      else if (ref.Type == DataReferenceTypes.DeleteThreatRule) {
        cf.DeleteThreatRule(ref.Param as ThreatRule);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): StencilType {
    return new StencilType(data, cf);
  }
}

export interface IStencilTemplateLayout {
  x: number;
  y: number;
  canEditSize: boolean;
  width: number;
  height: number;
}

export class StencilTypeTemplate extends DatabaseBase {
  private config: ConfigFile;

  public get ListInHWDiagram(): boolean { return this.Data['ListInHWDiagram']; }
  public set ListInHWDiagram(val: boolean) { this.Data['ListInHWDiagram'] = val; }
  public get ListInUCDiagram(): boolean { return this.Data['ListInUCDiagram']; }
  public set ListInUCDiagram(val: boolean) { this.Data['ListInUCDiagram'] = val; }

  public get ListInElementTypeIDs(): ElementTypeIDs[] { return this.Data['ListInElementTypeIDs']; }
  public set ListInElementTypeIDs(val: ElementTypeIDs[]) { this.Data['ListInElementTypeIDs'] = val; }

  public get StencilTypes(): StencilType[] { return this.config.GetStencilTypes().filter(x => this.Data['stencilTypeIDs'].includes(x.ID)); }
  public set StencilTypes(val: StencilType[]) { 
    this.Data['stencilTypeIDs'] = val.map(x => x.ID); 
    while (this.Layout.length < val.length) this.Layout.push({ x: 0, y: 0, canEditSize: false, width: 0, height: 0 });
    while (this.Layout.length > val.length) this.Layout.pop();

    for (let i = 0; i < val.length; i++) {
      this.Layout[i].canEditSize = val[i].ElementTypeID == ElementTypeIDs.LogTrustArea || val[i].ElementTypeID == ElementTypeIDs.PhyTrustArea;
    }
  }

  public get Layout(): IStencilTemplateLayout[] { return this.Data['Layout']; }
  public set Layout(val: IStencilTemplateLayout[]) { this.Data['Layout'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.ListInHWDiagram) this.ListInHWDiagram = true;
    if (!this.ListInElementTypeIDs) this.ListInElementTypeIDs = [];
    if (!this.Layout) this.Layout = [];
    if (!this.Data['stencilTypeIDs']) this.Data['stencilTypeIDs'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, cf: ConfigFile): StencilTypeTemplate {
    return new StencilTypeTemplate(data, cf);
  }
}

export interface IElementTypeThreat {
  Name: string;
  Letter: string;
  Description: string;
  AffectedElementTypes: ElementTypeIDs[];
  threatCategoryID: string;
}

export class StencilThreatMnemonic extends DatabaseBase {
  private config: ConfigFile;

  public get Letters(): IElementTypeThreat[] { return this.Data['Letters']; }
  public set Letters(val: IElementTypeThreat[]) { this.Data['Letters'] = val; }

  constructor(data: {}, cf: ConfigFile) {
    super(data);

    this.config = cf;

    if (this.Data['Letters'] == null) this.Letters = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, cf: ConfigFile): StencilThreatMnemonic {
    return new StencilThreatMnemonic(data, cf);
  }
}

export abstract class DFDElement extends ViewElementBase implements IElementType { 

  protected project: ProjectFile;
  protected config: ConfigFile;

  public get Type(): StencilType { return this.config.GetStencilType(this.Data['typeID']); }
  public set Type(type: StencilType) { 
    this.setTypeProperties(type, this.Type);
    if (type) {
      this.Data['typeID'] = type.ID;
    }
    else {
      const def = this.config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == this.Data['ElementTypeID']);
      if (def) this.Data['typeID'] = def.ID;
      else this.Data['typeID'] = null;
    }
    this.TypeChanged.emit(type);
  }

  public get Parent(): DFDContainer { 
    let res = this.project.GetDFDElement(this.Data['parentID']); 
    return res ? res as DFDContainer : null;
  }
  public set Parent(parent: DFDContainer) {
    if (this.Parent && this.Parent.ID != parent.ID) {
      this.Parent.RemoveChild(this);
    }
    this.Data['parentID'] = parent.ID;
  }

  public get IsPhysical(): boolean { return this.Data['IsPhyiscal']; }
  public get PhysicalElement(): DataFlowEntity { return this.project.GetDFDElement(this.Data['physicalElementID']) as DataFlowEntity; }
  public set PhysicalElement(val: DataFlowEntity) { this.Data['physicalElementID'] = val?.ID; }

  public TypeChanged = new EventEmitter<StencilType>();

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;
    this.Type = type;

    if (this.Name?.length == 0) {
      if (pf) {
        this.Name = StringExtension.FindUniqueName(type.Name, pf.GetDFDElements().map(x => x.Name));
      }
      else {
        this.Name = type?.Name;
      }
    }

    if (!this.Data['IsPhyiscal']) {
      this.Data['IsPhyiscal'] = ElementTypeUtil.IsPhysical(type.ElementTypeID);
    }

    if (!this.IsPhysical && this.GetProperty('Type').ElementTypeID != ElementTypeIDs.DataFlow) this.AddProperty('properties.PhysicalElement', 'PhysicalElement', 'properties.PhysicalElement.tt', true, PropertyEditTypes.PhysicalElementSelect, true);
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = super.FindReferences(pf, cf);
    pf?.GetDFDElementRefs().filter(x => x.Ref.ID == this.ID).forEach(x => refs.push({ Type: DataReferenceTypes.DeleteElementReferences, Param: x })); // DFDElementRefs
    if (this instanceof DFDContainer) refs.push({ Type: DataReferenceTypes.MoveChildElements, Param: this.Parent }); // parent
    if (this.IsPhysical) pf?.GetDFDElements().filter(x => x.PhysicalElement?.ID == this.ID).forEach(x => refs.push({ Type: DataReferenceTypes.RemovePhysicalElementReference, Param: x })); // physical element
    pf?.GetDFDElements().filter(x => x instanceof DataFlow && [x.Sender?.ID, x.Receiver?.ID].includes(this.ID)).forEach(x => refs.push({ Type: DataReferenceTypes.DeleteDataFlow, Param: x })); // Sender/Receiver
    if (this instanceof Interface) pf?.GetDFDElements().filter(x => x instanceof DataFlow && [x.SenderInterface?.ID, x.ReceiverInterface?.ID].includes(this.ID)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveInterfaceReference, Param: x })); // Sender/Receiver-interface
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);
    if (this.Parent != null) {
      this.Parent.RemoveChild(this);
    }

    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
      if (x.Type == DataReferenceTypes.DeleteElementReferences) pf.DeleteDDFElement(x.Param as DFDElement);
      else if (x.Type == DataReferenceTypes.MoveChildElements && this instanceof DFDContainer) this.GetChildren().forEach(x => this.Parent.AddChild(x));
      else if (x.Type == DataReferenceTypes.RemovePhysicalElementReference) (x.Param as DFDElement).PhysicalElement = null;
      else if (x.Type == DataReferenceTypes.RemoveInterfaceReference) {
        let df = x.Param as DataFlow;
        if (df.SenderInterface?.ID == this.ID) df.SenderInterface = null;
        if (df.ReceiverInterface?.ID == this.ID) df.ReceiverInterface = null;
      }
      else if (x.Type == DataReferenceTypes.DeleteDataFlow) pf.DeleteDDFElement(x.Param as DataFlow);
      else if (x.Type == DataReferenceTypes.DeleteThreatMapping) pf.DeleteThreatMapping(x.Param as ThreatMapping);
    });
  }

  public static Instantiate(type: StencilType, pf: ProjectFile, cf: ConfigFile): DFDElement {
    let element = ElementTypeUtil.Constructor(type.ElementTypeID);
    let res = new element({}, type, pf, cf);
    return res;
  }

  public static FromJSON(data: {}, pf: ProjectFile, cf: ConfigFile): DFDElement {
    let res: DFDElement;
    let type = cf.GetStencilType(data['typeID']);

    if (data['refID']) {
      const ref = pf.GetDFDElement(data['refID']);
      if (ref instanceof DFDContainer) res = new DFDContainerRef(data, type, pf, cf);
      else res = new DFDElementRef(data, type, pf, cf);
    }
    else if (data['ElementTypeID'] == ElementTypeIDs.LogTrustArea) res = new LogTrustArea(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.PhyTrustArea) res = new PhyTrustArea(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.LogProcessing) res = new LogProcessing(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.PhyProcessing) res = new PhyProcessing(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.LogDataStore) res = new LogDataStore(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.PhyDataStore) res = new PhyDataStore(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.LogExternalEntity) res = new LogExternalEntity(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.PhyExternalEntity) res = new PhyExternalEntity(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.DataFlow) res = new DataFlow(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.PhysicalLink) res = new PhysicalLink(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.Interface) res = new Interface(data, type, pf, cf);
    else if (data['ElementTypeID'] == ElementTypeIDs.None) res = new DFDContainer(data, type, pf, cf);
    else {
      throw new Error('Unknown ElementTypeID: ' + data['ElementTypeID']);
    }

    return res;
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.Type', 'Type', '', true, PropertyEditTypes.StencilType, true);
  }

  private setTypeProperties(type: StencilType, oldType: StencilType) {
    let elementType: StencilType = null;
    if (type) {
      // add properties of element type (e.g. data store)
      elementType = this.config.GetStencilElementType(type);
      if (!type.IsDefault && elementType && elementType.Properties) {
        elementType.Properties.forEach(x => {
          this.AddProperty((x.DisplayName == null ? x.ID : x.DisplayName), x.ID, x.Tooltip, false, x.Type, x.Editable);
          
          let overwrite = type.PropertyOverwrites?.find(y => y.Key == x.ID);
          if (overwrite) {
            if (x.HasGetter) this[x.ID] = overwrite.Value;
            else this.Data[x.ID] = overwrite.Value;
          }
          else if (this.Data[x.ID] == null) {
            if (x.HasGetter) this[x.ID] = x.DefaultValue;
            else this.Data[x.ID] = x.DefaultValue;
          }
        });
      }

      // add properties of specific stencil (e.g. file)
      if (type.Properties) {
        type.Properties.forEach(x => {
          this.AddProperty((x.DisplayName == null ? x.ID : x.DisplayName), x.ID, x.Tooltip, x.HasGetter, x.Type, x.Editable);
          if (this.Data[x.ID] == null) {
            if (x.HasGetter) this[x.ID] = x.DefaultValue;
            else this.Data[x.ID] = x.DefaultValue;
          }
        });
      }
    }

    // remove properties of old type
    if (oldType && oldType.Properties && type.Properties) {
      let newPropIds = type.Properties.map(x => x.ID);
      if (elementType) newPropIds.push(...elementType.Properties.map(x => x.ID));
      oldType.Properties.filter(x => !newPropIds.includes(x.ID)).forEach(x => {
        delete this.Data[x.ID];
      });
    }
  }
}

export class DFDElementRef extends DFDElement {

  private get diagramID(): string {
    return this.project.FindDiagramOfElement(this.Ref.ID).ID;
  }

  public get Name(): string { return this.Ref?.GetProperty('Name') + '-Reference'; }
  public set Name(val: string) { 
    if (this.Ref) this.Ref.Name = val;
  }

  public get Ref(): DFDElement { return this.project?.GetDFDElement(this.Data['refID']); }
  public set Ref(val: DFDElement) { 
    this.Data['refID'] = val.ID; 

    this.rerouteEvents();
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.project = pf;
    this.config = cf;

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
    this.Ref.TypeChanged.subscribe(x => this.TypeChanged.emit(x));
  }

  public static InstantiateRef(ref: DFDElement, pf: ProjectFile, cf: ConfigFile): DFDElement {
    if (ref instanceof DFDContainer) return DFDContainerRef.InstantiateRef(ref, pf, cf);
    let res = new DFDElementRef({}, ref.Type, pf, cf);
    res.Ref = ref;
    res.Data['Name'] = 'Reference to ' + ref.ID;
    return res;
  }
}

export abstract class DataFlowEntity extends DFDElement {

  public get ProcessedData(): MyData[] {
    let res = [];
    this.Data['ProcessedDataIDs'].forEach(x => res.push(this.project.GetMyData(x)));
    return res;
  }
  public set ProcessedData(val: MyData[]) { 
    this.Data['ProcessedDataIDs'] = val?.map(x => x.ID); 
    if (val && val.length > 0) this.ProcessedDataSensitivity = Math.max(...val.map(x => x.Sensitivity));
  }

  public get ProcessedDataSensitivity(): LowMediumHighNumber { return this.Data['ProcessedDataSensitivity']; }
  public set ProcessedDataSensitivity(val: LowMediumHighNumber) { this.Data['ProcessedDataSensitivity'] = val; }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);

    if (!this.Data['ProcessedDataIDs']) this.Data['ProcessedDataIDs'] = [];
  }
  
  protected initProperties(): void {
    super.initProperties();

    this.AddProperty('properties.ProcessedData', 'ProcessedData', 'properties.ProcessedData.tt', true, PropertyEditTypes.MyDataSelect, true);
    this.AddProperty('properties.ProcessedDataSensitivity', 'ProcessedDataSensitivity', 'properties.ProcessedDataSensitivity.tt', true, PropertyEditTypes.LowMediumHighSelect, true, LowMediumHighNumber.Medium);
  }
}

export abstract class Processing extends DataFlowEntity {
  public static Icon: string = 'memory';
} 

export class LogProcessing extends Processing {
  public static ElementTypeID = ElementTypeIDs.LogProcessing;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == LogProcessing.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(LogProcessing.ElementTypeID);
      def.Name = 'Process';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.LogProcessing;
  }
}

export class PhyProcessing extends Processing {
  public static ElementTypeID = ElementTypeIDs.PhyProcessing;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == PhyProcessing.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(PhyProcessing.ElementTypeID);
      def.Name = 'Processor';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.PhyProcessing;
  }

}

export abstract class DataStore extends DataFlowEntity {
  public static Icon: string = 'sd_card';
} 

export class LogDataStore extends DataStore {
  public static ElementTypeID = ElementTypeIDs.LogDataStore;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == LogDataStore.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(LogDataStore.ElementTypeID);
      def.Name = 'Data Store';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.LogDataStore;
  }

}

export class PhyDataStore extends DataStore {
  public static ElementTypeID = ElementTypeIDs.PhyDataStore;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == PhyDataStore.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(PhyDataStore.ElementTypeID);
      def.Name = 'Phy Data Store';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.PhyDataStore;
  }

}

export abstract class ExternalEntity extends DataFlowEntity {
  public static Icon: string = 'cloud';
}

export class LogExternalEntity extends ExternalEntity {
  public static ElementTypeID = ElementTypeIDs.LogExternalEntity;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == LogExternalEntity.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(LogExternalEntity.ElementTypeID);
      def.Name = 'Ext. Entity';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.LogExternalEntity;
  }

}

export class PhyExternalEntity extends ExternalEntity {
  public static ElementTypeID = ElementTypeIDs.PhyExternalEntity;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == PhyExternalEntity.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(PhyExternalEntity.ElementTypeID);
      def.Name = 'Phy Ext. Entity';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.PhyExternalEntity;
  }

}

export class PhysicalLink extends DataFlowEntity {
  public static Icon: string = 'precision_manufacturing';
  public static ElementTypeID = ElementTypeIDs.PhysicalLink;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == PhysicalLink.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(PhysicalLink.ElementTypeID);
      def.Name = 'Physical Link';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.PhysicalLink;
  }

}

export class Interface extends DataFlowEntity {
  public static Icon: string = 'sync_alt'; //'label_important_outline';
  public static ElementTypeID = ElementTypeIDs.Interface;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == Interface.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(Interface.ElementTypeID);
      def.Name = 'Interface';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.Interface;
  }

}

export class Protocol extends DatabaseBase {
  private config: ConfigFile;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetProtocols().find(x => x.IsDefault);
    if (!def) {
      def = cf.CreateProtocol();
      def.Name = 'Protocol';
      def.IsDefault = true;
    }

    return def;
  }

  public get IsDefault(): boolean { return this.Data['IsDefault']; }
  public set IsDefault(val: boolean) { this.Data['IsDefault'] = val; }
  public get Properties(): IProperty[] { return this.Data['Properties']; }
  public set Properties(val: IProperty[]) { this.Data['Properties'] = val; }
  public get PropertyOverwrites(): IKeyValue[] { return this.Data['PropertyOverwrites']; }
  public set PropertyOverwrites(val: IKeyValue[]) { this.Data['PropertyOverwrites'] = val; }

  constructor(data: {}, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (this.Data['IsDefault'] == null) this.Data['IsDefault'] = false;
    if (!this.Properties) this.Properties = [];
  }

  public GetProperty(id: string) {
    let prop = this.Properties.find(x => x.ID == id);
    if (!prop && !this.IsDefault) prop = Protocol.GetDefaultType(this.config).Properties.find(x => x.ID == id);
    if (prop) {
      if (!this.IsDefault) {
        let overwrite = this.PropertyOverwrites?.find(x => x.Key == id);
        if (overwrite) return overwrite.Value;
      }
      return prop.DefaultValue;
    }

    return super.GetProperty(id);
  }

  public SetProperty(id: string, value: any): void {
    console.log('Protocol set property');
    super.SetProperty(id, value);
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    // DF protocol stack, DFD DFs
    cf.GetStencilTypes().filter(x => x.ElementTypeID == ElementTypeIDs.DataFlow).forEach(df => {
      let stack = df.PropertyOverwrites?.find(x => x.Key == 'ProtocolStack');
      if (stack && stack.Value.includes(this.ID)) res.push({ Type: DataReferenceTypes.RemoveFromStencilProtocolStack, Param: df });
    });
    pf?.GetDFDElements().filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow).filter(x => (x as DataFlow).ProtocolStack.includes(this)).forEach(df => {
      res.push({ Type: DataReferenceTypes.RemoveFromElementProtocolStack, Param: df });
    });

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.RemoveFromStencilProtocolStack) {
        let key = (ref.Param as StencilType).PropertyOverwrites.find(x => x.Key == this.ID);
        (ref.Param as StencilType).PropertyOverwrites.splice((ref.Param as StencilType).PropertyOverwrites.indexOf(key), 1);
      }
      else if (ref.Type == DataReferenceTypes.RemoveFromElementProtocolStack) {
        (ref.Param as DataFlow).ProtocolStack.splice((ref.Param as DataFlow).ProtocolStack.indexOf(this), 1);
      }
    });
    return true;
  }

  public static FromJSON(data, cf: ConfigFile): Protocol {
    return new Protocol(data, cf);
  }
}

export class DataFlow extends DFDElement implements ICanvasFlow {
  public static Icon: string = 'timeline';
  public static ElementTypeID = ElementTypeIDs.DataFlow;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == DataFlow.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(DataFlow.ElementTypeID);
      def.Name = 'Data Flow';
      def.IsDefault = true;

      def.AddProperty('Overwrite Data', 'OverwriteDataProperties', 'By default, processed data and data sensitivity are referenced from sender. Overwrite to set them manually', true, PropertyEditTypes.CheckBox, true);
      def.AddProperty('Processed Data', 'ProcessedData', 'Data that the element processes, stores, produces, or receives', true, PropertyEditTypes.MyDataSelect, true);
      def.AddProperty('Data Sensitivity', 'ProcessedDataSensitivity', 'Sensitivity of the processed data', true, PropertyEditTypes.LowMediumHighSelect, true, LowMediumHighNumber.Medium);
      def.AddProperty('Overwrite Stack', 'OverwriteProtocolProperties', 'Use either the properties derived from the protocols or define them manually', true, PropertyEditTypes.CheckBox, true);
      def.AddProperty('Protocol Stack', 'ProtocolStack', 'List of protocols used within the communication', true, PropertyEditTypes.ProtocolSelect, true);
    }

    return def;
  }

  private protocolProperties: string[] = [];

  public get Sender(): DataFlowEntity { return this.project.GetDFDElement(this.Data['senderID']) as DataFlowEntity; }
  public set Sender(val: DataFlowEntity) { this.Data['senderID'] = val.ID; }
  public get Receiver(): DataFlowEntity { return this.project.GetDFDElement(this.Data['receiverID']) as DataFlowEntity; }
  public set Receiver(val: DataFlowEntity) { this.Data['receiverID'] = val?.ID; }
  public get SenderInterface(): Interface { return this.project.GetDFDElement(this.Data['senderInterfaceID']) as DataFlowEntity; }
  public set SenderInterface(val: Interface) { this.Data['senderInterfaceID'] = val?.ID; }
  public get ReceiverInterface(): Interface { return this.project.GetDFDElement(this.Data['receiverInterfaceID']) as DataFlowEntity; }
  public set ReceiverInterface(val: Interface) { this.Data['receiverInterfaceID'] = val?.ID; }

  public get OverwriteProtocolProperties(): boolean { return this.Data['OverwriteProtocolProperties']; }
  public set OverwriteProtocolProperties(val: boolean) { 
    this.Data['OverwriteProtocolProperties'] = val;
    this.protocolProperties?.forEach(x => {
      this.GetProperties().find(y => x == y.ID).Editable = val;
    });
  }
  public get ProtocolStack(): Protocol[] { 
    let res = [];
    this.Data['protocolStackIDs'].forEach(x => res.push(this.config.GetProtocol(x)));
    return res;
  }
  public set ProtocolStack(val: Protocol[]) {  this.Data['protocolStackIDs'] = val?.map(x => x?.ID ? x.ID : x); }

  public get ProcessedData(): MyData[] {
    if (this.OverwriteDataProperties) {
      let res = [];
      this.Data['ProcessedDataIDs'].forEach(x => res.push(this.project.GetMyData(x)));
      return res;
    }
    else {
      return this.Sender?.ProcessedData;
    }
    
  }
  public set ProcessedData(val: MyData[]) { 
    this.Data['ProcessedDataIDs'] = val?.map(x => x.ID); 
    if (val && val.length > 0) this.ProcessedDataSensitivity = Math.max(...val.map(x => x.Sensitivity));
  }

  public get ProcessedDataSensitivity(): LowMediumHighNumber { 
    if (this.OverwriteDataProperties) return this.Data['ProcessedDataSensitivity'];
    return this.Sender?.ProcessedDataSensitivity;
  }
  public set ProcessedDataSensitivity(val: LowMediumHighNumber) { this.Data['ProcessedDataSensitivity'] = val; }

  public get OverwriteDataProperties(): boolean { return this.Data['OverwriteDataProperties']; }
  public set OverwriteDataProperties(val: boolean) { 
    this.Data['OverwriteDataProperties'] = val;
    const procData = this.GetProperties().find(x => x.ID == 'ProcessedData');
    if (procData) procData.Editable = val;
    const dataSens = this.GetProperties().find(x => x.ID == 'ProcessedDataSensitivity'); 
    if (dataSens) dataSens.Editable = val;
  }

  // Canvas Properties
  public get FlowType(): FlowTypes { return this.Data['FlowType']; }
  public set FlowType(val: FlowTypes) { 
    this.Data['FlowType'] = Number(val); 
    if (val == FlowTypes.Extend || val == FlowTypes.Include) {
      this.ShowName = true;
      this.LineType = FlowLineTypes.Dashed;
      this.ArrowPos = val == FlowTypes.Extend ? FlowArrowPositions.Start : FlowArrowPositions.End;
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

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.DataFlow;

    if (!this.Data['protocolStackIDs']) this.Data['protocolStackIDs'] = [];
    if (this.OverwriteProtocolProperties == null) this.OverwriteProtocolProperties = false;

    if (!this.Data['ProcessedDataIDs']) this.Data['ProcessedDataIDs'] = [];
    if (this.Data['OverwriteDataProperties'] == null) this.OverwriteDataProperties = false;
    else this.OverwriteDataProperties = this.OverwriteDataProperties; // update editable

    if (this.Data['ShowName'] == null) this.ShowName = true;
    if (this.Data['LineType'] == null) this.LineType = FlowLineTypes.Solid;
    if (this.Data['ArrowPos'] == null) this.ArrowPos = FlowArrowPositions.End;

    Protocol.GetDefaultType(this.config).Properties.forEach(x => {
      let prop = this.AddProperty(x.DisplayName, x.ID, x.Tooltip, x.HasGetter, x.Type, false, x.DefaultValue);
      this.protocolProperties.push(x.ID);
      prop.Editable = this.OverwriteProtocolProperties;
    });
  }

  public GetProperty(id: string) {
    if (!this.OverwriteProtocolProperties && this.protocolProperties?.includes(id)) {
      return this.ProtocolStack.some(x => x.GetProperty(id));
    }
    return super.GetProperty(id);
  }

  public SetProperty(id: string, value: any): void {
    super.SetProperty(id, value);
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.Sender', 'Sender', '', true, PropertyEditTypes.ElementName, true);
    this.AddProperty('properties.SenderInterface', 'SenderInterface', '', true, PropertyEditTypes.InterfaceElementSelect, true);
    this.AddProperty('properties.Receiver', 'Receiver', '', true, PropertyEditTypes.ElementName, true);
    this.AddProperty('properties.ReceiverInterface', 'ReceiverInterface', '', true, PropertyEditTypes.InterfaceElementSelect, true);
    this.AddProperty('properties.ShowName', 'ShowName', '', true, PropertyEditTypes.CheckBox, true);
    this.AddProperty('properties.BendFlow', 'BendFlow', '', true, PropertyEditTypes.CheckBox, true);
    this.AddProperty('properties.ArrowPos', 'ArrowPos', '', true, PropertyEditTypes.ArrowPosition, true);
  }
}

export class DFDContainer extends DFDElement implements IContainer {
  public static Icon: string = 'select_all';
  public static ElementTypeID = ElementTypeIDs.None;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == DFDContainer.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(DFDContainer.ElementTypeID);
      def.Name = 'DFD Container';
      def.IsDefault = true;
    }

    return def;
  }

  private get children(): DFDElement[] { 
    let res = [];
    this.Data['childrenIDs'].forEach(x => res.push(this.project.GetDFDElement(x)));
    return res.sort((a,b) => a.GroupId >= b.GroupId ? 1 : -1); 
  }

  public ChildrenChanged = new EventEmitter<boolean>();
  public get Root(): IContainer {
    return this.project.GetDFDElement(this.Data['rootID']) as DFDContainer;
  }
  public set Root(val: IContainer) {
    this.Data['rootID'] = (val as DFDContainer)?.ID;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    
    if (!this.Data['childrenIDs']) this.Data['childrenIDs'] = [];
    this.Data['ElementTypeID'] = ElementTypeIDs.None;
  }

  public AddChild(child: DFDElement) {
    if (child == null) {
      console.error('child undefined');
      return;
    }
    if (child.ID == this.ID) {
      return;
    }
    if (!this.Data['childrenIDs'].includes(child.ID)) {
      child.Parent = this;
      this.Data['childrenIDs'].push(child.ID);
      this.project.AddDFDElement(child);

      if (child instanceof DFDContainer) {
        child.Root = this.Root ? this.Root : this;
      }

      if (this.Root) this.Root.ChildrenChanged.emit(true);
      else this.ChildrenChanged.emit(true);
    }
  }

  public RemoveChild(child: DFDElement): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);

      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public DeleteChild(child: DFDElement): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);
      this.project.DeleteDDFElement(child);
      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public GetChildren(): DFDElement[] {
    return this.children;
  }

  public GetChildrenFlat(): DFDElement[] {
    let res = [];
    res.push(...this.GetChildren());
    this.GetChildren().forEach(x => {
      if (x instanceof DFDContainer) res.push(...x.GetChildrenFlat());
    });

    return res;
  }

  protected initProperties(): void {
    super.initProperties();
    this.GetProperties().find(x => x.ID == 'Name').Type = PropertyEditTypes.TextBox;
  }
} 

export class DFDContainerRef extends DFDContainer {

  private get diagramID(): string {
    return this.project.FindDiagramOfElement(this.Ref.ID).ID;
  }

  public get Name(): string { return this.Ref?.GetProperty('Name') + '-Reference'; }
  public set Name(val: string) { 
    if (this.Ref) this.Ref.Name = val;
  }

  public get Ref(): DFDContainer { return this.project?.GetDFDElement(this.Data['refID']) as DFDContainer; }
  public set Ref(val: DFDContainer) { 
    this.Data['refID'] = val.ID; 

    this.rerouteEvents();
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.project = pf;
    this.config = cf;

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
    this.Ref.TypeChanged.subscribe(x => this.TypeChanged.emit(x));
  }

  public static InstantiateRef(ref: DFDContainer, pf: ProjectFile, cf: ConfigFile): DFDElement {
    let res = new DFDContainerRef({}, ref.GetProperty('Type'), pf, cf);
    res.Ref = ref;
    res.Data['Name'] = 'Reference to ' + ref.ID;
    return res;
  }
}

export abstract class TrustArea extends DFDContainer {
}

export class LogTrustArea extends TrustArea {
  public static ElementTypeID = ElementTypeIDs.LogTrustArea;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == LogTrustArea.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(LogTrustArea.ElementTypeID);
      def.Name = 'Trust Area';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.LogTrustArea;
  }

}

export class PhyTrustArea extends TrustArea {
  public static ElementTypeID = ElementTypeIDs.PhyTrustArea;

  public static GetDefaultType(cf: ConfigFile) {
    let def = cf.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == PhyTrustArea.ElementTypeID);
    if (!def) {
      def = cf.CreateStencilType(PhyTrustArea.ElementTypeID);
      def.Name = 'Phy Trust Area';
      def.IsDefault = true;
    }

    return def;
  }

  constructor(data: {}, type: StencilType, pf: ProjectFile, cf: ConfigFile) {
    super(data, type, pf, cf);
    this.Data['ElementTypeID'] = ElementTypeIDs.PhyTrustArea;
  }
  
}
