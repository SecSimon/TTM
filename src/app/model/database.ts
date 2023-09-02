import { EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DataService } from '../util/data.service';
import { ConfigFile } from './config-file';
import { Countermeasure } from './mitigations';
import { ProjectFile } from './project-file';
import { TestCase } from './test-case';
import { AttackScenario } from './threat-model';

export interface IKeyValue {
  Key: string|any;
  Value: any;
}

export interface INote {
  Author: string;
  Date: string;
  ShowTimestamp: boolean;
  HasCheckbox: boolean;
  IsChecked: boolean;
  Note: string;
}

export interface IDataChanged {
  ID: string;
  Type: DataChangedTypes;
}

export enum DataChangedTypes {
  Added = 1,
  Changed = 2,
  Removed = 3
}

export enum PropertyEditTypes {
  ArrowPosition = 'Arrow Position',
  AssignNumberToAsset = 'Assign Number To Asset',
  CheckBox = 'Check Box',
  DevInterfaceName = 'Device Interface Name',
  DataFlowDiagramReference = 'Data Flow Diagram Reference',
  DiagramReference = 'Diagram Reference',
  ElementName = 'Element Name',
  FlowType = 'Flow Type',
  ImpactCategory = 'Impact Category',
  InterfaceElementSelect = 'Interface Element Select',
  LineType = 'Line Type',
  LowMediumHighSelect = 'Low Medium High Select',
  MyDataSelect = 'Data Select',
  PhysicalElementSelect = 'Physical Element Select',
  PortBox = 'Port Box',
  ProtocolSelect = 'Protocol Select',
  OpenNotes = 'Open Notes',
  OpenQuestionnaire = 'Open Questionnaire',
  StencilType = 'Stencil Type',
  TextArea = 'Text Area',
  TextBox = 'Text Box',
  TextBoxValidator = 'Text Box Validator',
}

export class PropertyEditTypesUtil {
  public static GetTypeNames(): string[] {
    return Object.keys(PropertyEditTypes).map(key => PropertyEditTypes[key]).filter(value => typeof value === 'string') as string[];
  }

  public static GetMappableTypeNames(): string[] {
    return [
      PropertyEditTypes.CheckBox, PropertyEditTypes.DiagramReference, PropertyEditTypes.LowMediumHighSelect, PropertyEditTypes.MyDataSelect, 
      PropertyEditTypes.PhysicalElementSelect, PropertyEditTypes.StencilType, PropertyEditTypes.TextArea, PropertyEditTypes.TextBox
    ];
  } 
}

export interface IProperty {
  DisplayName: string;
  ID: string;
  Tooltip: string;
  HasGetter: boolean;
  Type: PropertyEditTypes;
  Editable: boolean;
  DefaultValue?: any;
  Callback?: any;
}

export enum DataReferenceTypes {
  // DFD Element References
  DeleteElementReferences,
  MoveChildElements,
  RemovePhysicalElementReference,
  DeleteDataFlow,
  RemoveInterfaceReference,
  DeleteAttackScenario,
  RemoveElementFromAttackScenario,
  RemoveElementFromTestCase,

  // Context References
  DeleteContextFlow,

  // Stencil References, Threat Model
  ResetStencilType,
  DeleteDFDElement,
  DeleteThreatRule,
  DeleteThreatRuleGroup,
  DeleteThreatQuestion,
  DeleteMyComponentType,
  DeleteComponent,
  DeleteThreatCategory,
  DeleteAttackVector,
  DeleteAttackVectorGroup,
  RemoveStencilTypeTemplateFromStencilType,

  // Protocol References
  RemoveFromStencilProtocolStack,
  RemoveFromElementProtocolStack,

  // Threat Model
  RemoveThreatCategoryFromAttackVector,
  RemoveThreatCategoryFromThreatRule,
  RemoveThreatCategoryFromAttackScenario,
  RemoveThreatCategoryFromThreatMnemonic,
  RemoveThreatQuestionFromComponent,
  RemoveAttackVectorFromControl,

  RemoveSystemThreatFromAttackScenario,

  // Device
  DeleteDiagram,
  DeleteStack,
  DeleteMyData,
  DeleteAssetGroup,

  // Mitigation
  DeleteControl,
  DeleteControlGroup,
  DeleteCountermeasure,
  RemoveElementFromCountermeasure,
  RemoveAttackScenarioFromCountermeasure,
  RemoveAttackScenarioFromAttackScenario,
  RemoveAttackScenarioFromTestCase,
  RemoveCountermeasureFromTestCase,
  RemoveMitigationProcessFromCountermeasure,

  // Checklist
  DeleteRequirementType,
  RemoveRequirementTypeFromChecklistType,
  RemoveRequirementTypeFromChecklist,
  DeleteChecklist,

  DeleteTestCase,

  RemoveMyTagFromAttackScenario
}

export interface IDataReferences {
  Type: DataReferenceTypes;
  Param: DatabaseBase;
}

export class DataReferencesUtil {
  public static ToString(val: IDataReferences, dataService: DataService, translate: TranslateService) {

    switch (val.Type) {
      case DataReferenceTypes.DeleteElementReferences: return  translate.instant('dialog.delete.DeleteElementReferences') + ' ' + dataService.Project.FindDiagramOfElement(val.Param?.ID)?.Name;
      default: return translate.instant('dialog.delete.' + DataReferenceTypes[val.Type]) + ' ' + val.Param?.Name;
    }
  }

  public static FindAllReferencesDeep(val: DatabaseBase, pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    val.FindReferences(pf, cf).forEach(ref => {
      res.push(ref);
      
      if (DataReferenceTypes[ref.Type].startsWith('Delete')) {
        res.push(...this.FindAllReferencesDeep(ref.Param, pf, cf));
      }
    });

    let toDel = [];
    for (let i = 1; i < res.length; i++) {
      const index = res.findIndex(x => x.Type == res[i].Type && x.Param == res[i].Param);
      if (index >= 0 && index < i) {
        toDel.push(i);
      }
    }
    toDel.forEach(x => {
      res.splice(x, 1);
    });

    return res;
  }
}

export interface IDatabaseBase {
  Data: {};
}

export interface IContainer extends IDatabaseBase {
  Root: IContainer;
  AddChild(child);
  RemoveChild(child): boolean;
  DeleteChild(child): boolean;
  GetChildren(): ViewElementBase[];
  GetChildrenFlat(): ViewElementBase[];
  ChildrenChanged: EventEmitter<boolean>;
}

export interface IElementType {
  Parent: IContainer;
  Type: any;
  TypeChanged: EventEmitter<any>;
}

export interface ICustomNumber extends IDatabaseBase {
  Number: string;
  CheckUniqueNumber(): boolean;
  GetLongName(): string;
}

export abstract class DatabaseBase implements IDatabaseBase {
  private properties: IProperty[] = [];
  public Data: {};

  public get ID(): string { return this.Data['ID']; }
  //public get Created(): string { return this.Data['Created']; }
  public get Name(): string { return this.Data['Name'].replace(/\n/g, ' '); }
  public set Name(val: string) { 
    this.Data['Name'] = val;
    this.NameChanged.emit(val); 
  }
  public get NameRaw(): string { return this.Data['Name']; }
  public set NameRaw(val: string) { this.Name = val; }
  public get Description(): string { return this.Data['Description']; }
  public set Description(val: string) { this.Data['Description'] = val; }

  public NameChanged = new EventEmitter<string>();
  public DataChanged = new EventEmitter<IDataChanged>();

  constructor(data: {}) {
    this.Data = data;
    if (Object.keys(data).length == 0) {
      this.Data['ID'] = uuidv4();
      //this.Data['Created'] = new Date(Date.now()).toISOString();

      this.Name = '';
      this.Description = '';
    }

    this.initProperties();
  }

  public GetProperties(): IProperty[] { return this.properties; }

  public AddProperty(displayName: string, id: string, tooltip: string, hasGetter: boolean, type: PropertyEditTypes, editable: boolean, defaultValue?: any, callback?: any): IProperty {
    let existing = this.properties.find(x => x.ID == id && x.Type == type && x.Editable == editable); 
    if (existing) return existing;
    let res: IProperty = {
      DisplayName: displayName,
      ID: id,
      Tooltip: tooltip,
      HasGetter: hasGetter,
      Type: type,
      Editable: editable,
      Callback: callback
    };
    if (defaultValue) res.DefaultValue = defaultValue;
    this.properties.push(res);
    return res;
  }

  public GetProperty(id: string): any {
    let prop = this.properties.find(x => x.ID == id);
    if (!prop) return null;
    if (prop.HasGetter) return this[prop.ID];
    else return this.Data[prop.ID];
  }

  public SetProperty(id: string, value: any) {
    let prop = this.properties.find(x => x.ID == id);
    if (!prop) return;
    if (prop.HasGetter) this[prop.ID] = value;
    else this.Data[prop.ID] = value;
  }

  public CopyFrom(data: {}) {
    const id = this.ID;
    this.Data = JSON.parse(JSON.stringify(data));
    this.Data['ID'] = id;
  } 

  public ToJSON(): {} {
      return this.Data;
  }

  public abstract FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[];
  public abstract OnDelete(pf: ProjectFile, cf: ConfigFile);

  protected initProperties() {
    this.AddProperty('properties.Name', 'Name', '', true, PropertyEditTypes.TextBox, true);
    this.AddProperty('properties.Description', 'Description', '', true, PropertyEditTypes.TextArea, true);
  }
}

export abstract class ViewElementBase extends DatabaseBase {
  private subscription: Subscription; 

  public get UserCheckedElement(): boolean { return this.Data['UserCheckedElement']; }
  public set UserCheckedElement(val: boolean) { this.Data['UserCheckedElement'] = val; }

  public get OutOfScope(): boolean { return this.Data['OutOfScope']; }
  public set OutOfScope(val: boolean) { 
    this.Data['OutOfScope'] = val;
    this.OutOfScopeChanged.emit(val);
  }

  public OutOfScopeChanged = new EventEmitter<boolean>();

  constructor(data: {}) {
    super(data);

    if (!this.Data['UserCheckedElement']) this.Data['UserCheckedElement'] = false;

    this.InitSubsriptions();
  }

  protected initProperties(): void {
    super.initProperties();
    this.GetProperties().find(x => x.ID == 'Name').Type = PropertyEditTypes.TextArea;
    this.AddProperty('properties.OutOfScope', 'OutOfScope', '', true, PropertyEditTypes.CheckBox, true, false);
  }

  public InitSubsriptions() {
    if (!this.UserCheckedElement) {
      setTimeout(() => {
        this.subscription = this.NameChanged.subscribe(() => {
          this.UserCheckedElement = true;
          this.subscription.unsubscribe();
        });
      }, 1000);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = [];
    pf?.GetAttackScenarios().filter(x => x.Target == this || x.Targets?.includes(this)).forEach(x => {
      if (x.ThreatRule && x.ThreatRule['RuleGenerationType'] == 2 && x.Target == null) {
        refs.push({ Type: DataReferenceTypes.RemoveElementFromAttackScenario, Param: x });
      }
      else {
        refs.push({ Type: DataReferenceTypes.DeleteAttackScenario, Param: x });
      }
    });
    pf?.GetCountermeasures().filter(x => x.Targets.includes(this)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveElementFromCountermeasure, Param: x }));
    pf?.GetTestCases().filter(x => x.LinkedElements.includes(this)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveElementFromTestCase, Param: x }));
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
      if (x.Type == DataReferenceTypes.DeleteAttackScenario) pf.DeleteAttackScenario(x.Param as AttackScenario);
      else if (x.Type == DataReferenceTypes.RemoveElementFromAttackScenario) (x.Param as AttackScenario).Targets = (x.Param as AttackScenario).Targets.filter(y => y != this);
      else if (x.Type == DataReferenceTypes.RemoveElementFromCountermeasure) (x.Param as Countermeasure).RemoveTarget(this.ID);
      else if (x.Type == DataReferenceTypes.RemoveCountermeasureFromTestCase) (x.Param as TestCase).RemoveLinkedElement(this.ID);
    });
  }
}