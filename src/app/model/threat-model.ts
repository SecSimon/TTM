import { TranslateService } from "@ngx-translate/core";
import { DataService } from "../util/data.service";
import { LowMediumHighNumber, LowMediumHighNumberUtil } from "./assets";
import { MyComponent, MyComponentType } from "./component";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IDataReferences, IKeyValue, IProperty, PropertyEditTypes, ViewElementBase } from "./database";
import { SystemThreat } from "./system-threat";
import { ElementTypeIDs, ElementTypeUtil, StencilThreatMnemonic, StencilType } from "./dfd-model";
import { Control, Countermeasure } from "./mitigations";
import { ProjectFile } from "./project-file";


export enum ImpactCategories {
  Confidentiality = 1,
  Integrity = 2,
  Availability = 3,
  Authorization = 4,
  Authenticity = 5,
  NonRepudiation = 6,
  Auditability = 7,
  Trustworthiness = 8,
  Safety = 9,
  Privacy = 10,
  Compliance = 11,
  Financial = 12,
  Reputation = 13,
  CustomerSatisfaction = 14,
  ProductionProcess = 15
}

export class ImpactCategoryUtil {
  public static GetKeys() {
    return [ImpactCategories.Confidentiality, ImpactCategories.Integrity, ImpactCategories.Availability, ImpactCategories.Authorization, ImpactCategories.Authenticity,
      ImpactCategories.NonRepudiation, ImpactCategories.Auditability, ImpactCategories.Trustworthiness, ImpactCategories.Safety, ImpactCategories.Privacy, 
      ImpactCategories.Compliance, ImpactCategories.Financial, ImpactCategories.Reputation, ImpactCategories.CustomerSatisfaction, ImpactCategories.ProductionProcess];
  }

  public static ToString(cat: ImpactCategories): string {
    switch (cat) {
      case ImpactCategories.Confidentiality: return "impactcategory.Confidentiality";
      case ImpactCategories.Integrity: return "impactcategory.Integrity";
      case ImpactCategories.Availability: return "impactcategory.Availability";
      case ImpactCategories.Authorization: return "impactcategory.Authorization";
      case ImpactCategories.Authenticity: return "impactcategory.Authenticity";
      case ImpactCategories.NonRepudiation: return "impactcategory.NonRepudiation";
      case ImpactCategories.Auditability: return "impactcategory.Auditability";
      case ImpactCategories.Trustworthiness: return "impactcategory.Trustworthiness";
      case ImpactCategories.Safety: return "impactcategory.Safety";
      case ImpactCategories.Privacy: return "impactcategory.Privacy";
      case ImpactCategories.Compliance: return "impactcategory.Compliance";
      case ImpactCategories.Financial: return "impactcategory.Financial";
      case ImpactCategories.Reputation: return "impactcategory.Reputation";
      case ImpactCategories.CustomerSatisfaction: return "impactcategory.CustomerSatisfaction";
      case ImpactCategories.ProductionProcess: return "impactcategory.ProductionProcess";
      default:
        console.error('Missing Cat in ImpactCategoryUtil.ToString()', cat)
        return 'Undefined';
    }
  }
}

export class ThreatCategory extends DatabaseBase {

  public get ImpactCats(): ImpactCategories[] { return this.Data['ImpactCats']; }

  constructor(data, cf: ConfigFile) {
    super(data);

    if (!this.ImpactCats) this.Data['ImpactCats'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    // threat questions, threat origin, attack scenarios, threat rule
    cf.GetThreatOrigins().filter(x => x.ThreatCategories?.includes(this)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatCategoryFromThreatOrigin, Param: x });
    });
    cf.GetThreatRules().filter(x => x.ThreatCategories?.includes(this)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatCategoryFromThreatRule, Param: x });
    });
    cf.GetStencilThreatMnemonics().filter(x => x.Letters.some(y => y.threatCategoryID == this.ID)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatCategoryFromThreatMnemonic, Param: x });
    });
    pf?.GetAttackScenarios().filter(x => x.ThreatCategories?.includes(this)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatCategoryFromAttackScenario, Param: x });
    });
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfThreatCategory(this);
    if (group) group.RemoveThreatCategory(this);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.RemoveThreatCategoryFromAttackScenario) {
        let cats = (ref.Param as AttackScenario).Mapping.Threat.ThreatCategoryIDs;
        cats.splice(cats.indexOf(ref.Param.ID), 1);
      }
      else if (ref.Type == DataReferenceTypes.RemoveThreatCategoryFromThreatOrigin) {
        let cats = ref.Param.Data['threatCategorieIDs'];
        cats.splice(cats.indexOf(ref.Param.ID), 1);
      }
      else if (ref.Type == DataReferenceTypes.RemoveThreatCategoryFromThreatRule) {
        let cats = (ref.Param as ThreatRule).Mapping.ThreatCategoryIDs;
        cats.splice(cats.indexOf(ref.Param.ID), 1);
      }
      else if (ref.Type == DataReferenceTypes.RemoveThreatCategoryFromThreatMnemonic) {
        (ref.Param as StencilThreatMnemonic).Letters.forEach(x => {
          if (x.threatCategoryID == this.ID) x.threatCategoryID = null;
        });
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatCategory {
    return new ThreatCategory(data, cf);
  }
}

export class ThreatCategoryGroup extends DatabaseBase {
  private config: ConfigFile;

  public get ThreatCategories(): ThreatCategory[] { 
    let res = [];
    this.Data['threatCategorieIDs'].forEach(id => res.push(this.config.GetThreatCategory(id)));
    return res;
  }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['threatCategorieIDs']) { this.Data['threatCategorieIDs'] = []; }
  }

  public AddThreatCategory(cat: ThreatCategory) {
    if (!this.ThreatCategories.includes(cat)) this.Data['threatCategorieIDs'].push(cat.ID);
  }

  public RemoveThreatCategory(cat: ThreatCategory) {
    if (this.ThreatCategories.includes(cat)) {
      this.Data['threatCategorieIDs'].splice(this.Data['threatCategorieIDs'].indexOf(cat.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.ThreatCategories.forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatCategory, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteThreatCategory) {
        cf.DeleteThreatCategory(ref.Param as ThreatCategory);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatCategoryGroup {
    return new ThreatCategoryGroup(data, cf);
  }
}


export enum LifeCycle {
  Concept = 'C',
  Implementation = 'I',
  Production = 'P',
  Distribution = 'D',
  Setup = 'S',
  Operation = 'O',
  Update = 'U',
  Maintenance = 'M',
  EndOfLife = 'E'
}
export class LifeCycleUtil {
  public static GetKeys() {
    return [LifeCycle.Concept, LifeCycle.Implementation, LifeCycle.Production, LifeCycle.Distribution, LifeCycle.Setup, LifeCycle.Operation, LifeCycle.Update, LifeCycle.Maintenance, LifeCycle.EndOfLife];
  }
  
  public static GetMitigationKeys() {
    return [LifeCycle.Concept, LifeCycle.Implementation, LifeCycle.Production, LifeCycle.Operation, LifeCycle.Update, LifeCycle.Maintenance];
  }

  public static ToString(lc: LifeCycle): string {
    switch (lc) {
      case LifeCycle.Concept: return "lifecycle.Concept";
      case LifeCycle.Implementation: return "lifecycle.Implementation";
      case LifeCycle.Production: return "lifecycle.Production";
      case LifeCycle.Distribution: return "lifecycle.Distribution";
      case LifeCycle.Setup: return "lifecycle.Setup";
      case LifeCycle.Operation: return "lifecycle.Operation";
      case LifeCycle.Update: return "lifecycle.Update";
      case LifeCycle.Maintenance: return "lifecycle.Maintenance";
      case LifeCycle.EndOfLife: return "lifecycle.EndOfLife";
      default:
        console.error('Missing Life Cycle in LifeCycleUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ThreatOriginTypes {
  Weakness = 1,
  AttackTechnique = 2
}

export class ThreatOriginTypesUtil {
  public static GetTypes(): ThreatOriginTypes[] {
    return [ThreatOriginTypes.Weakness, ThreatOriginTypes.AttackTechnique];
  }

  public static GetTypeNames(): string[] {
    let res = [];
    ThreatOriginTypesUtil.GetTypes().forEach(x => res.push(ThreatOriginTypesUtil.ToString(x)));
    return res;
  }

  public static ToString(ot: ThreatOriginTypes): string {
    switch (ot) {
      case ThreatOriginTypes.Weakness: return "general.Weakness";
      case ThreatOriginTypes.AttackTechnique: return "general.AttackTechnique";
      default:
        console.error('Missing Option Type in ThreatOriginTypes.ToString()')
        return 'Undefined';
    }
  }
}

export enum AttackVectors {
  Network = 'N',
  AdjacentNetwork = 'A',
  Local = 'L',
  Physical = 'P'
}

export enum AttackComplexities {
  Low = 'L',
  High = 'H',
}

export enum LowHighNone {
  None = 'N',
  Low = 'L',
  High = 'H'
}

export enum UserInteractions {
  None = 'N',
  Required = 'R'
}

export enum Scopes {
  Unchanged = 'U',
  Changed = 'C'
}

export interface ICVSSEntry {
  AV: AttackVectors;
  AC: AttackComplexities;
  PR: LowHighNone;
  UI: UserInteractions;
  S: Scopes;
  C: LowHighNone;
  I: LowHighNone;
  A: LowHighNone;
  Score: number;
}

export interface IOwaspRREntry {
  SL: number; // skill level
  M: number; // motive
  O: number; // opportunity
  S: number; // size
  ED: number; // ease of discovery
  EE: number; // ease of exploit
  A: number; // awareness
  ID: number; // intrusion detection
  LC: number; // loss of confidentiality
  LI: number; // loss of integrity
  LAV: number; // loss of availablility
  LAC: number; // loss of accountability
  FD: number; // financial damage
  RD: number; // repudational damage
  NC: number; // non-compliance
  PV: number; // privacy violation
  Impact: LowMediumHighNumber;
  Likelihood: LowMediumHighNumber;
  Score: ThreatSeverities;
}

export interface IAttackTechnique {
  CAPECID: number;
  CVSS: ICVSSEntry;
}

export interface IWeakness {
  CWEID: number;
}

export enum ThreatSeverities {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export class ThreatSeverityUtil {
  public static GetTypes(): ThreatSeverities[] {
    return [ThreatSeverities.None, ThreatSeverities.Low, ThreatSeverities.Medium, ThreatSeverities.High, ThreatSeverities.Critical];
  }

  public static GetTypesDashboard(): ThreatSeverities[] {
    return [ThreatSeverities.Low, ThreatSeverities.Medium, ThreatSeverities.High, ThreatSeverities.Critical];
  }

  public static ToString(ot: ThreatSeverities): string {
    switch (ot) {
      case ThreatSeverities.None: return 'properties.threatseverity.None';
      case ThreatSeverities.Low: return 'properties.threatseverity.Low';
      case ThreatSeverities.Medium: return 'properties.threatseverity.Medium';
      case ThreatSeverities.High: return 'properties.threatseverity.High';
      case ThreatSeverities.Critical: return 'properties.threatseverity.Critical';
      default:
        console.error('Missing Option Type in ThreatSeverityUtil.ToString()')
        return 'Undefined';
    }
  }
}

export class ThreatOrigin extends DatabaseBase {
  private config: ConfigFile;

  public get ThreatIntroduced(): string[] { return this.Data['ThreatIntroduced']; }
  public get ThreatExploited(): string[] { return this.Data['ThreatExploited']; }
  public get Adversaries(): string { return this.Data['Adversaries']; }
  public set Adversaries(val: string) { this.Data['Adversaries'] = val; }
  public get OriginTypes(): ThreatOriginTypes[] { return this.Data['OriginTypes']; }
  public set OriginTypes(val: ThreatOriginTypes[]) {
    this.Data['OriginTypes'] = val;
    if (val.includes(ThreatOriginTypes.Weakness) && !this.Weakness) this.Weakness = {} as IWeakness;
    if (val.includes(ThreatOriginTypes.AttackTechnique) && !this.AttackTechnique) this.AttackTechnique = { CVSS: {} } as IAttackTechnique;
  }
  public get ThreatCategories(): ThreatCategory[] {
    let res = [];
    this.Data['threatCategorieIDs'].forEach(id => res.push(this.config.GetThreatCategory(id)));
    return res;
  }
  public set ThreatCategories(val: ThreatCategory[]) { this.Data['threatCategorieIDs'] = val?.map(x => x.ID); }
  public get Weakness(): IWeakness { return this.Data['Weakness']; }
  public set Weakness(val: IWeakness) { this.Data['Weakness'] = val; }
  public get AttackTechnique(): IAttackTechnique { return this.Data['AttackTechnique']; }
  public set AttackTechnique(val: IAttackTechnique) { this.Data['AttackTechnique'] = val; }
  public get Severity(): ThreatSeverities { return this.Data['Severity']; }
  public set Severity(val: ThreatSeverities) { this.Data['Severity'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.OriginTypes) this.OriginTypes = [];
    if (!this.ThreatIntroduced) {
      this.Data['ThreatIntroduced'] = [];
    }
    if (!this.ThreatExploited) {
      this.Data['ThreatExploited'] = [];
    }
    if (!this.Data['threatCategorieIDs']) this.Data['threatCategorieIDs'] = [];

    if (this.AttackTechnique && !this.AttackTechnique.CVSS) this.AttackTechnique.CVSS = {} as ICVSSEntry;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    cf.GetThreatRules().filter(x => x.ThreatOrigin?.ID == this.ID).forEach(x => {
      res.push({ Type: DataReferenceTypes.DeleteThreatRule, Param: x });
    });
    cf.GetControls().filter(x => x.MitigatedThreatOrigins.some(x => x.ID == this.ID)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatOriginFromControl, Param: x });
    });
    pf?.GetAttackScenarios().filter(x => x.ThreatOrigin?.ID == this.ID).forEach(x => {
      res.push( { Type: DataReferenceTypes.DeleteAttackScenario, Param: x });
    })

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfThreatOrigin(this);
    if (group) group.RemoveThreatOrigin(this);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteThreatRule) {
        cf.DeleteThreatRule(ref.Param as ThreatRule);
      }
      else if (ref.Type == DataReferenceTypes.RemoveThreatOriginFromControl) {
        (ref.Param as Control).MitigatedThreatOrigins = (ref.Param as Control).MitigatedThreatOrigins.filter(x => x.ID != this.ID);
      }
      else if (ref.Type == DataReferenceTypes.DeleteAttackScenario) {
        pf.DeleteAttackScenario(ref.Param as AttackScenario);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatOrigin {
    return new ThreatOrigin(data, cf);
  }
}

export class ThreatOriginGroup extends DatabaseBase {
  private config: ConfigFile;

  public get SubGroups(): ThreatOriginGroup[] { 
    let res = [];
    this.Data['threatOriginGroupIDs'].forEach(id => res.push(this.config.GetThreatOriginGroup(id)));
    return res;
  }
  public get ThreatOrigins(): ThreatOrigin[] { 
    let res = [];
    this.Data['threatOriginIDs'].forEach(id => res.push(this.config.GetThreatOrigin(id)));
    return res;
  }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['threatOriginGroupIDs']) { this.Data['threatOriginGroupIDs'] = []; }
    if (!this.Data['threatOriginIDs']) { this.Data['threatOriginIDs'] = []; }
  }

  public AddThreatOriginGroup(group: ThreatOriginGroup) {
    if (!this.SubGroups.includes(group)) this.Data['threatOriginGroupIDs'].push(group.ID);
  }

  public RemoveThreatOriginGroup(group: ThreatOriginGroup) {
    if (this.SubGroups.includes(group)) {
      this.Data['threatOriginGroupIDs'].splice(this.Data['threatOriginGroupIDs'].indexOf(group.ID), 1);
    }
  }

  public AddThreatOrigin(origin: ThreatOrigin) {
    if (!this.ThreatOrigins.includes(origin)) this.Data['threatOriginIDs'].push(origin.ID);
  }

  public RemoveThreatOrigin(origin: ThreatOrigin) {
    if (this.ThreatOrigins.includes(origin)) {
      this.Data['threatOriginIDs'].splice(this.Data['threatOriginIDs'].indexOf(origin.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.SubGroups.forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatOriginGroup, Param: x }));
    this.ThreatOrigins.forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatOrigin, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfThreatOriginGroup(this);
    if (group) group.RemoveThreatOriginGroup(this);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteThreatOrigin) {
        cf.DeleteThreatOrigin(ref.Param as ThreatOrigin);
      }
      else if (ref.Type == DataReferenceTypes.DeleteThreatOriginGroup) {
        cf.DeleteThreatOriginGroup(ref.Param as ThreatOriginGroup);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatOriginGroup {
    return new ThreatOriginGroup(data, cf);
  }
}

export enum OptionTypes {
  YesNo = 1,
}

export class OptionTypesUtil {
  public static GetOptions(ot: OptionTypes): IKeyValue[] {
    switch (ot) {
      case OptionTypes.YesNo: return [{ 'Key': 'general.Yes', 'Value': true }, { 'Key': 'general.No', 'Value': false }, { 'Key': 'general.N/A', 'Value': 'undefined' }];
      default:
        console.error('Missing Option Type in OptionTypeUtil.GetOptions()', ot)
        return null;
    }
  }

  public static GetTypes(): OptionTypes[] {
    return [OptionTypes.YesNo]
  }

  public static GetTypeNames(): string[] {
    let res = [];
    OptionTypesUtil.GetTypes().forEach(x => res.push(OptionTypesUtil.ToString(x)));
    return res;
  }

  public static ToString(ot: OptionTypes): string {
    switch (ot) {
      case OptionTypes.YesNo: return "optiontype.yesno";
      default:
        console.error('Missing Option Type in OptionTypeUtil.ToString()')
        return 'Undefined';
    }
  }
}

export interface IThreatOriginCategoryMapping {
  ThreatOriginID: string;
  ThreatCategoryIDs: string[];
}

export class ThreatQuestion extends DatabaseBase {
  private config: ConfigFile;

  public get Question(): string { return this.Data['Question']; }
  public set Question(val: string) { this.Data['Question'] = val; }
  public get ComponentType(): MyComponentType { return this.config.GetMyComponentType(this.Data['componentTypeID']); }
  public set ComponentType(type: MyComponentType) { this.Data['componentTypeID'] = type.ID; }
  public get OptionType(): OptionTypes { return this.Data['OptionType']; }
  public set OptionType(val: OptionTypes) {
    this.Data['OptionType'] = val;
  }
  public get Property(): IProperty { return this.ComponentType.Properties.find(x => x.ID == this.Data['propertyID']); }
  public set Property(val: IProperty) { 
    this.Data['propertyID'] = val?.ID; 
    if (val && this.OptionType == OptionTypes.YesNo) {
      OptionTypesUtil.GetOptions(this.OptionType).forEach(x => {
        this.ChangesPerOption[x.Key] = {};
        this.ChangesPerOption[x.Key]['Active'] = true && x.Value != undefined;
        this.ChangesPerOption[x.Key]['Value'] = x.Value;
      });
    } 
  }

  public get ChangesPerOption() { return this.Data['ChangesPerOption']; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.ChangesPerOption) this.Data['ChangesPerOption'] = {};
    if (!this.OptionType) this.OptionType = OptionTypes.YesNo;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];
    
    // attack scenarios, components
    pf?.GetAttackScenarios().filter(x => x.ThreatQuestion?.ID == this.ID).forEach(x => {
      res.push({ Type: DataReferenceTypes.DeleteAttackScenario, Param: x });
    });
    pf?.GetComponents().filter(x => Object.keys(x.ThreatQuestions).includes(this.ID)).forEach(x => {
      res.push({ Type: DataReferenceTypes.RemoveThreatQuestionFromComponent, Param: x });
    });

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteAttackScenario) {
        pf.DeleteAttackScenario(ref.Param as AttackScenario);
      }
      else if (ref.Type == DataReferenceTypes.RemoveThreatQuestionFromComponent) {
        (ref.Param as MyComponent).RemoveThreatQuestion(this);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatQuestion {
    return new ThreatQuestion(data, cf);
  }
}

export enum RuleTypes {
  Stencil = 1,
  DFD = 2,
  Component = 3,
  Protocol = 4
}

export enum RuleGenerationTypes {
  EachElement = 1,
  OnceForAllElements = 2,
  OnceForEachElement = 3
}

export class RuleGenerationTypsUtil {
  public static GetTypes(): RuleGenerationTypes[] {
    return [RuleGenerationTypes.EachElement, RuleGenerationTypes.OnceForAllElements, RuleGenerationTypes.OnceForEachElement];
  }

  public static ToString(rgt: RuleGenerationTypes): string {
    switch (rgt) {
      case RuleGenerationTypes.EachElement: return 'properties.eachElement';
      case RuleGenerationTypes.OnceForAllElements: return 'properties.onceForAllElements';
      case RuleGenerationTypes.OnceForEachElement: return 'properties.onceForEachElement';
      default:
        console.error('Missing Rule Generation Type in RuleGenerationTypes.ToString()')
        return 'Undefined';
    }
  }
}

export enum RestrictionTypes {
  Property = 1,
  DataFlowCrosses = 2,
  PhysicalElement = 3,
  SenderInterface = 10,
  ReceiverInterface = 11
}

export class RestrictionTypesUtil {
  public static GetTypes(): RestrictionTypes[] {
    return [RestrictionTypes.Property, RestrictionTypes.DataFlowCrosses, RestrictionTypes.PhysicalElement, RestrictionTypes.SenderInterface, RestrictionTypes.ReceiverInterface];
  }

  public static GetTypeNames(): string[] {
    let res = [];
    OptionTypesUtil.GetTypes().forEach(x => res.push(OptionTypesUtil.ToString(x)));
    return res;
  }

  public static ToString(rt: RestrictionTypes): string {
    switch (rt) {
      case RestrictionTypes.Property: return 'general.Property';
      case RestrictionTypes.DataFlowCrosses: return 'pages.config.threatrule.trustLevelChange';
      case RestrictionTypes.PhysicalElement: return 'properties.PhysicalElement';
      case RestrictionTypes.SenderInterface: return 'properties.SenderInterface';
      case RestrictionTypes.ReceiverInterface: return 'properties.ReceiverInterface';
      default:
        console.error('Missing Restriction Type in RestrictionTypes.ToString()')
        return 'Undefined';
    }
  }
}

export enum PropertyComparisonTypes {
  Equals = '==',
  EqualsNot = '!=',
  GreaterThan = '>',
  LessThan = '<',
  GreaterThanOrEquals = '>=',
  LessThanOrEquals = '<='
}

export interface IPropertyRestriction {
  ID: string;
  ComparisonType: PropertyComparisonTypes;
  Value: any;
}

export interface IDataFlowRestriction {
  TrustAreaIDs: string[];
}

export interface IPhyElementRestriction {
  Property: IPropertyRestriction;
}

export interface IInterfaceRestriction {
  Property: IPropertyRestriction;
}

export interface ITypeIDs { // bug fix for UI
  TypeIDs: string[];
}

export interface IDetailRestriction {
  NodeNumber?: number; // DFD only
  IsOR: boolean;
  Layer: number;
  RestType: RestrictionTypes;
  PropertyRest?: IPropertyRestriction;
  DataflowRest?: IDataFlowRestriction;
  PhyElementRest?: IPhyElementRestriction;
  SenderInterfaceRestriction?: IInterfaceRestriction;
  ReceiverInterfaceRestriction?: IInterfaceRestriction;
}

export interface IDFDRestriction {
  AppliesReverse: boolean;
  Target: number;
  NodeTypes: ITypeIDs[];
  NodeRestrictions: IDetailRestriction[];
}

export class RestrictionUtil {

  public static ToString(rule: ThreatRule, dataService: DataService, translate: TranslateService): string {
    if (rule.RuleType == RuleTypes.DFD) return RestrictionUtil.DFDToString(rule.DFDRestriction, dataService, translate);
    else if (rule.RuleType == RuleTypes.Stencil) return RestrictionUtil.StencilToString(rule.StencilRestriction, dataService, translate);
    else if (rule.RuleType == RuleTypes.Component) return RestrictionUtil.ComponentToString(rule.ComponentRestriction, dataService, translate);
    else if (rule.RuleType == RuleTypes.Protocol) return RestrictionUtil.ProtocolToString(rule.ProtocolRestriction, dataService, translate);
  }

  public static StencilToString(rest: IStencilRestriction, dataService: DataService, translate: TranslateService): string {
    let res = '';

    let wrap = (val: string) => { return '{' + val + '}'; };
    let spaces = (val: string) => { return ' ' + val + ' '; }
    let stencil = dataService.Config.GetStencilType(rest.stencilTypeID);

    let currLayer = 0;
    for (let i = 0; i < rest.DetailRestrictions.length; i++) {
      let r = rest.DetailRestrictions[i];
      let conjBefore = r.Layer > currLayer;
      if (conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }
      while (r.Layer > currLayer) {
        res += '(';
        currLayer++;
      }
      while (r.Layer < currLayer) {
        res += ')';
        currLayer--;
      }
      if (!conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }

      res += wrap(stencil.Name);
      if (r.RestType == RestrictionTypes.Property) {
        let prop = dataService.Config.GetAllStencilProperties(stencil).find(x => x.ID == r.PropertyRest.ID);
        res += '.' + wrap((prop && prop.DisplayName) ? prop.DisplayName : r.PropertyRest.ID); 
        res += spaces(r.PropertyRest.ComparisonType);
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PropertyRest.Value)));
        else res += wrap(String(r.PropertyRest.Value));
      }
      else if (r.RestType == RestrictionTypes.DataFlowCrosses) res += ' crosses ' + wrap(r.DataflowRest.TrustAreaIDs.map(x => dataService.Config.GetStencilType(x)).map(x => x.Name).join(' ' + translate.instant('general.or') + ' '));
      else if (r.RestType == RestrictionTypes.PhysicalElement) {
        let phyID = ElementTypeUtil.GetPhyiscalID(stencil.ElementTypeID);
        let phyElement = dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == phyID);
        let prop = phyElement.Properties.find(x => x.ID == r.PhyElementRest.Property.ID);
        res += '.' + wrap(translate.instant('properties.PhysicalElement')) + '.' + wrap((prop && prop.DisplayName) ? prop.DisplayName : r.PhyElementRest.Property.ID);
        res += spaces(r.PhyElementRest.Property.ComparisonType.toString());
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PhyElementRest.Property.Value)));
        else res += wrap(String(r.PhyElementRest.Property.Value));
      }
    }

    while (currLayer > 0) {
      res += ')';
      currLayer--;
    }

    return res;
  }

  public static ComponentToString(rest: IComponentRestriction, dataService: DataService, translate: TranslateService): string {
    let res = '';

    let wrap = (val: string) => { return '{' + val + '}'; };
    let spaces = (val: string) => { return ' ' + val + ' '; }
    let componentType = dataService.Config.GetMyComponentType(rest.componentTypeID);

    let currLayer = 0;
    for (let i = 0; i < rest.DetailRestrictions.length; i++) {
      let r = rest.DetailRestrictions[i];
      let conjBefore = r.Layer > currLayer;
      if (conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }
      while (r.Layer > currLayer) {
        res += '(';
        currLayer++;
      }
      while (r.Layer < currLayer) {
        res += ')';
        currLayer--;
      }
      if (!conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }

      res += wrap(componentType.Name);
      if (r.RestType == RestrictionTypes.Property) {
        let prop = componentType.Properties.find(x => x.ID == r.PropertyRest.ID);
        res += '.' + wrap((prop && prop.DisplayName) ? prop.DisplayName : r.PropertyRest.ID); 
        res += spaces(r.PropertyRest.ComparisonType);
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PropertyRest.Value)));
        else res += wrap(String(r.PropertyRest.Value));
      }
    }

    while (currLayer > 0) {
      res += ')';
      currLayer--;
    }

    return res;
  }
  public static ProtocolToString(rest: IProtocolRestriction, dataService: DataService, translate: TranslateService): string {
    let res = '';

    let wrap = (val: string) => { return '{' + val + '}'; };
    let spaces = (val: string) => { return ' ' + val + ' '; }
    let protocol = dataService.Config.GetProtocol(rest.protocolID);

    let currLayer = 0;
    for (let i = 0; i < rest.DetailRestrictions.length; i++) {
      let r = rest.DetailRestrictions[i];
      let conjBefore = r.Layer > currLayer;
      if (conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }
      while (r.Layer > currLayer) {
        res += '(';
        currLayer++;
      }
      while (r.Layer < currLayer) {
        res += ')';
        currLayer--;
      }
      if (!conjBefore) { if (i != 0) { res += rest.DetailRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }

      res += wrap(protocol.Name);
      if (r.RestType == RestrictionTypes.Property) {
        let prop = protocol.Properties.find(x => x.ID == r.PropertyRest.ID);
        res += '.' + wrap((prop && prop.DisplayName) ? prop.DisplayName : r.PropertyRest.ID); 
        res += spaces(r.PropertyRest.ComparisonType);
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PropertyRest.Value)));
        else res += wrap(String(r.PropertyRest.Value));
      }
    }

    while (currLayer > 0) {
      res += ')';
      currLayer--;
    }

    return res;
  }

  public static DFDToString(rest: IDFDRestriction, dataService: DataService, translate: TranslateService): string {
    let res = '';

    let wrap = (val: string) => { return '{' + val + '}'; }
    let spaces = (val: string) => { return ' ' + val + ' '; }
    let getNodeName = (index: number, nodeCount: number) => {
      if (index == -1) return 'Data Flow';
      if (index == 0) return translate.instant('properties.Sender');
      if (index == nodeCount - 1) return translate.instant('properties.Receiver');
      return 'Node' + (index - 1).toString();
    }

    let currLayer = 0;
    for (let i = 0; i < rest.NodeRestrictions.length; i++) {
      let r = rest.NodeRestrictions[i];
      let conjBefore = r.Layer > currLayer;
      if (conjBefore) { if (i != 0) { res += rest.NodeRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }
      while (r.Layer > currLayer) {
        res += '(';
        currLayer++;
      }
      while (r.Layer < currLayer) {
        res += ')';
        currLayer--;
      }
      if (!conjBefore) { if (i != 0) { res += rest.NodeRestrictions[i - 1].IsOR ? ' OR ' : ' AND '; } }

      res += wrap(getNodeName(r.NodeNumber, rest.NodeTypes.length));
      if (r.RestType == RestrictionTypes.Property) {
        let prop = null;
        if (r.NodeNumber == -1) {
          prop = dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == ElementTypeIDs.DataFlow).Properties.find(x => x.ID == r.PropertyRest.ID);
        }
        else {
          rest.NodeTypes[r.NodeNumber]?.TypeIDs.forEach(x => {
            if (!prop) prop = dataService.Config.GetStencilType(x).Properties.find(y => y.ID == r.PropertyRest.ID);
          });
        }
        
        res += '.' + wrap((prop && prop.DisplayName) ? prop.DisplayName : r.PropertyRest.ID);
        res += spaces(r.PropertyRest.ComparisonType);
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PropertyRest.Value)));
        else res += wrap(String(r.PropertyRest.Value));
      }
      else if (r.RestType == RestrictionTypes.DataFlowCrosses) res += ' crosses ' + wrap(r.DataflowRest.TrustAreaIDs.map(x => dataService.Config.GetStencilType(x)).map(x => x.Name).join(' ' + translate.instant('general.or') + ' '));
      else if (r.RestType == RestrictionTypes.PhysicalElement) {
        let prop = null;
        rest.NodeTypes[r.NodeNumber]?.TypeIDs.forEach(x => {
          if (!prop) {
            let phyID = ElementTypeUtil.GetPhyiscalID(dataService.Config.GetStencilType(x).ElementTypeID);
            if (phyID) {
              let phyElement = dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == phyID);
              prop = phyElement.Properties.find(x => x.ID == r.PhyElementRest.Property.ID);
            }
          }
        });

        res += '.' + wrap(translate.instant('properties.PhysicalElement')) + '.' + wrap(r.PhyElementRest.Property.ID);
        if (prop && prop.Type == PropertyEditTypes.LowMediumHighSelect) res += wrap(translate.instant(LowMediumHighNumberUtil.ToString(r.PhyElementRest.Property.Value)));
        else res += wrap(String(r.PhyElementRest.Property.Value));
      }
    }

    while (currLayer > 0) {
      res += ')';
      currLayer--;
    }

    return res;
  }
}

export interface IStencilRestriction {
  stencilTypeID: string;
  DetailRestrictions: IDetailRestriction[];
}

export interface IComponentRestriction {
  componentTypeID: string;
  DetailRestrictions: IDetailRestriction[];
}

export interface IProtocolRestriction {
  protocolID: string;
  DetailRestrictions: IDetailRestriction[];
}

export class ThreatRule extends DatabaseBase {
  private config: ConfigFile;

  public get IsActive(): boolean { return this.Data['IsActive']; }
  public set IsActive(val: boolean) { this.Data['IsActive'] = val; }
  public get RuleType(): RuleTypes { return this.Data['RuleType']; }
  public set RuleType(val: RuleTypes) {
    this.Data['RuleType'] = val;
    if (val == RuleTypes.Stencil) { 
      if (!this.StencilRestriction) {
        let rest: IStencilRestriction = {
          stencilTypeID: '',
          DetailRestrictions: []
        }
        this.StencilRestriction = rest;
      }
    }
    else if (val == RuleTypes.Component) {
      if (!this.ComponentRestriction) {
        let rest: IComponentRestriction = {
          componentTypeID: '',
          DetailRestrictions: []
        }
        this.ComponentRestriction = rest;
      }
    }
    else if (val == RuleTypes.DFD) {
      if (!this.Data['DFDRestriction']) {
        let rest: IDFDRestriction = {
          AppliesReverse: false,
          Target: -1,
          NodeTypes: [
            { TypeIDs: [] },
            { TypeIDs: [] }
          ],
          NodeRestrictions: []
        };
        this.Data['DFDRestriction'] = rest;
      }
    }
    else if (val == RuleTypes.Protocol) {
      if (!this.ProtocolRestriction) {
        let rest: IProtocolRestriction = {
          protocolID: '',
          DetailRestrictions: []
        }
        this.ProtocolRestriction = rest;
      }
    }
  }

  public get RuleGenerationType(): RuleGenerationTypes { return this.Data['RuleGenerationType']; }
  public set RuleGenerationType(val: RuleGenerationTypes) { this.Data['RuleGenerationType'] = val; }

  public get Mapping(): IThreatOriginCategoryMapping { return this.Data['Mapping']; }
  public set Mapping(val: IThreatOriginCategoryMapping) { this.Data['Mapping'] = val; }
  public get ThreatOrigin(): ThreatOrigin { return this.config.GetThreatOrigin(this.Mapping.ThreatOriginID); }
  public set ThreatOrigin(val: ThreatOrigin) { 
    this.Mapping.ThreatOriginID = val?.ID; 
    if (val) this.Severity = val.Severity;
  }
  public get ThreatCategories(): ThreatCategory[] { return this.config.GetThreatCategories().filter(x => this.Mapping.ThreatCategoryIDs?.includes(x.ID)); }
  public set ThreatCategories(val: ThreatCategory[]) { this.Mapping.ThreatCategoryIDs = val?.map(x => x.ID); }
  public get Severity(): ThreatSeverities { return this.Data['Severity']; }
  public set Severity(val: ThreatSeverities) { this.Data['Severity'] = val; }

  public get StencilRestriction(): IStencilRestriction { return this.Data['StencilRestriction']; }
  public set StencilRestriction(val: IStencilRestriction) { this.Data['StencilRestriction'] = val; }
  public get DFDRestriction(): IDFDRestriction { return this.Data['DFDRestriction']; }
  public set DFDRestriction(val: IDFDRestriction) { this.Data['DFDRestriction'] = val; }
  public get ComponentRestriction(): IComponentRestriction { return this.Data['ComponentRestriction']; }
  public set ComponentRestriction(val: IComponentRestriction) { this.Data['ComponentRestriction'] = val; }
  public get ProtocolRestriction(): IProtocolRestriction { return this.Data['ProtocolRestriction']; }
  public set ProtocolRestriction(val: IProtocolRestriction) { this.Data['ProtocolRestriction'] = val; }

  public get OverridenRules(): ThreatRule[] {
    let res = [];
    this.Data['overridenRuleIDs'].forEach(x => res.push(this.config.GetThreatRule(x)));
    return res;
  }
  public set OverridenRules(val: ThreatRule[]) { this.Data['overridenRuleIDs'] = val?.map(x => x.ID); }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (this.Data['IsActive'] == null) this.Data['IsActive'] = true;
    if (this.Data['RuleGenerationType'] == null) this.Data['RuleGenerationType'] = RuleGenerationTypes.EachElement;
    if (!this.Data['Mapping']) this.Data['Mapping'] = {} as IThreatOriginCategoryMapping;
    if (!this.Data['overridenRuleIDs']) this.Data['overridenRuleIDs'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];
    
    // attack scenarios
    pf?.GetAttackScenarios().filter(x => x.ThreatRule?.ID == this.ID).forEach(x => {
      res.push({ Type: DataReferenceTypes.DeleteAttackScenario, Param: x });
    });

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfThreatRule(this);
    if (group) group.RemoveThreatRule(this);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteAttackScenario) {
        pf.DeleteAttackScenario(ref.Param as AttackScenario);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatRule {
    return new ThreatRule(data, cf);
  }
}

export class ThreatRuleGroup extends DatabaseBase {
  private config: ConfigFile;

  public get SubGroups(): ThreatRuleGroup[] { 
    let res = [];
    this.Data['threatRuleGroupIDs'].forEach(id => res.push(this.config.GetThreatRuleGroup(id)));
    return res;
  }
  public get ThreatRules(): ThreatRule[] { 
    let res = [];
    this.Data['threatRuleIDs'].forEach(id => res.push(this.config.GetThreatRule(id)));
    return res;
  }

  public get RuleType(): RuleTypes { return this.Data['RuleType']; }
  public set RuleType(val: RuleTypes) { this.Data['RuleType']; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['threatRuleGroupIDs']) { this.Data['threatRuleGroupIDs'] = []; }
    if (!this.Data['threatRuleIDs']) { this.Data['threatRuleIDs'] = []; }
  }

  public AddThreatRuleGroup(group: ThreatRuleGroup) {
    if (!this.SubGroups.includes(group)) this.Data['threatRuleGroupIDs'].push(group.ID);
  }

  public RemoveThreatRuleGroup(group: ThreatRuleGroup) {
    if (this.SubGroups.includes(group)) {
      this.Data['threatRuleGroupIDs'].splice(this.Data['threatRuleGroupIDs'].indexOf(group.ID), 1);
    }
  }

  public AddThreatRule(rule: ThreatRule) {
    if (!this.ThreatRules.includes(rule)) this.Data['threatRuleIDs'].push(rule.ID);
  }

  public RemoveThreatRule(rule: ThreatRule) {
    if (this.ThreatRules.includes(rule)) {
      this.Data['threatRuleIDs'].splice(this.Data['threatRuleIDs'].indexOf(rule.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.SubGroups.forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatRuleGroup, Param: x }));
    this.ThreatRules.forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatRule, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfThreatRuleGroup(this);
    if (group) group.RemoveThreatRuleGroup(this);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteThreatRule) {
        cf.DeleteThreatRule(ref.Param as ThreatRule);
      }
      else if (ref.Type == DataReferenceTypes.DeleteThreatRuleGroup) {
        cf.DeleteThreatRuleGroup(ref.Param as ThreatRuleGroup);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ThreatRuleGroup {
    return new ThreatRuleGroup(data, cf);
  }
}

export interface IAttackScenario {
  Threat: IThreatOriginCategoryMapping;
  RuleID: string; //ThreatRule
  QuestionID: string; //ThreatQuestion
}

export enum MappingStates {
  New = 1,
  Stable = 2,
  Removed = 3
}

export enum ThreatStates {
  NotSet = 1,
  NotApplicable = 2,
  NeedsInvestigation = 3,
  Verified = 4,
  Proven = 5
}

export class ThreatStateUtil {
  public static GetThreatStates(): ThreatStates[] {
    return [ThreatStates.NotSet, ThreatStates.NotApplicable, ThreatStates.NeedsInvestigation, ThreatStates.Verified, ThreatStates.Proven];
  }

  public static ToString(state: ThreatStates): string {
    switch (state) {
      case ThreatStates.NotSet: return 'properties.threatstate.NotSet';
      case ThreatStates.NotApplicable: return 'properties.threatstate.NotApplicable';
      case ThreatStates.NeedsInvestigation: return 'properties.threatstate.NeedsInvestigation';
      case ThreatStates.Verified: return 'properties.threatstate.Verified';
      case ThreatStates.Proven: return 'properties.threatstate.Proven';
      default:
        console.error('Missing State in ThreatStateUtil.ToString()', state)
        return 'Undefined';
    }
  }
}

export enum RiskStrategies {
  Avoid = 1,
  Mitigate = 2,
  Transfer = 3,
  Accept = 4,
}

export class RiskStrategyUtil {
  public static GetKeys(): RiskStrategies[] {
    return [RiskStrategies.Avoid, RiskStrategies.Mitigate, RiskStrategies.Transfer, RiskStrategies.Accept];
  }

  public static ToString(state: RiskStrategies): string {
    switch (state) {
      case RiskStrategies.Avoid: return 'properties.riskstrategy.Avoid';
      case RiskStrategies.Mitigate: return 'properties.riskstrategy.Mitigate';
      case RiskStrategies.Transfer: return 'properties.riskstrategy.Transfer';
      case RiskStrategies.Accept: return 'properties.riskstrategy.Accept';
      default:
        console.error('Missing State in RiskStrategyUtil.ToString()', state);
        return 'Undefined';
    }
  }
}

/**
 * Class for threats in project
 */
export class AttackScenario extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Name(): string { 
    if (this.Data['Name'] != null) return this.Data['Name']; 

    let res = '';
    if (this.ThreatRule) res += this.ThreatRule.Name + ' on ';
    else if (this.ThreatOrigin) res += this.ThreatOrigin.GetProperty('Name') + ' on ';
    if (this.Target) res += this.Target.GetProperty('Name');
    else if (this.Targets) res += this.Targets.map(x => x.GetProperty('Name')).join(', ');
    return res;
  }
  public set Name(val: string) { 
    this.Data['Name'] = val;
    this.NameChanged.emit(this.Name); 
  }

  public get Number(): string { return this.Data['Number']; }
  public set Number(val: string) { this.Data['Number'] = val; }
  public get ViewID(): string { return this.Data['ViewID']; } // ID of Diagram, ComponentStack
  public set ViewID(val: string) { this.Data['ViewID'] = val; }
  public get MappingState(): MappingStates { return this.Data['MappingState']; }
  public set MappingState(val: MappingStates) { this.Data['MappingState'] = val; }
  public get ThreatState(): ThreatStates { return this.Data['ThreatState']; }
  public set ThreatState(val: ThreatStates) { this.Data['ThreatState'] = Number(val); }
  public get IsGenerated(): boolean { return this.Data['IsGenerated']; }
  public set IsGenerated(val: boolean) { this.Data['IsGenerated'] = val; }
  public get ScoreCVSS(): ICVSSEntry { return this.Data['ScoreCVSS']; }
  public set ScoreCVSS(val: ICVSSEntry) { this.Data['ScoreCVSS'] = val; }
  public get ScoreOwaspRR(): IOwaspRREntry { return this.Data['ScoreOwaspRR']; }
  public set ScoreOwaspRR(val: IOwaspRREntry) { this.Data['ScoreOwaspRR'] = val; }
  public get Severity(): ThreatSeverities { return this.Data['Severity']; }
  public set Severity(val: ThreatSeverities) { this.Data['Severity'] = val; }
  public get Likelihood(): LowMediumHighNumber { return this.Data['Likelihood']; }
  public set Likelihood(val: LowMediumHighNumber) { this.Data['Likelihood'] = val; }
  public get Risk(): LowMediumHighNumber { return this.Data['Risk']; }
  public set Risk(val: LowMediumHighNumber) { this.Data['Risk'] = val; }
  public get RiskStrategy(): RiskStrategies { return this.Data['RiskStrategy']; }
  public set RiskStrategy(val: RiskStrategies) { this.Data['RiskStrategy'] = val; }
  public get RiskStrategyReason(): string { return this.Data['RiskStrategyReason']; }
  public set RiskStrategyReason(val: string) { this.Data['RiskStrategyReason'] = val; }
  public get Target(): ViewElementBase {
    let target: any = this.project.GetDFDElement(this.Data['targetID']);
    if (!target) target = this.project.GetComponent(this.Data['targetID']);
    if (!target) target = this.project.GetContextElement(this.Data['targetID']);
    return target;
  }
  public set Target(val: ViewElementBase) { this.Data['targetID'] = val?.ID; }
  public get Targets(): ViewElementBase[] {
    let res = [];
    this.Data['targetIDs'].forEach(x => {
      let stencil = this.project.GetDFDElement(x);
      if (stencil) res.push(stencil);
      else {
        let comp = this.project.GetComponent(x);
        if (comp) res.push(comp);
        else {
          let context = this.project.GetContextElement(x);
          if (context) res.push(context);
          //console.error('Unknown target');
        }
      }
    });
    return res;
  }
  public set Targets(val: ViewElementBase[]) { this.Data['targetIDs'] = val.map(x => x.ID); }
  public get Mapping(): IAttackScenario { return this.Data['Mapping']; }
  public set Mapping(val: IAttackScenario) { this.Data['Mapping'] = val; }
  public get ThreatOrigin(): ThreatOrigin { return this.config.GetThreatOrigin(this.Mapping.Threat?.ThreatOriginID); }
  public set ThreatOrigin(val: ThreatOrigin) { 
    this.Mapping.Threat.ThreatOriginID = val.ID;
    if (val) this.ThreatCategories = val.ThreatCategories;
  }
  public get ThreatCategories(): ThreatCategory[] { return this.config.GetThreatCategories().filter(x => this.Mapping.Threat.ThreatCategoryIDs?.includes(x.ID)); }
  public set ThreatCategories(val: ThreatCategory[]) { this.Mapping.Threat.ThreatCategoryIDs = val.map(x => x.ID); }
  public get ThreatQuestion(): ThreatQuestion { return this.config.GetThreatQuestion(this.Mapping.QuestionID); }
  public set ThreatQuestion(val: ThreatQuestion) { this.Mapping.QuestionID = val.ID; }
  public get ThreatRule(): ThreatRule { return this.config.GetThreatRule(this.Mapping.RuleID); }
  public set ThreatRule(val: ThreatRule) { this.Mapping.RuleID = val.ID; }
  public get RuleStillApplies(): boolean { return this.Data['RuleStillApplies']; }
  public set RuleStillApplies(val: boolean) { this.Data['RuleStillApplies'] = val; }
  public get SystemThreats(): SystemThreat[] { 
    let res: SystemThreat[] = [];
    this.Data['systemThreatIDs'].forEach(x => res.push(this.project.GetSystemThreat(x)));
    return res;
  } 
  public set SystemThreats(val: SystemThreat[]) { this.Data['systemThreatIDs'] = val?.map(x => x.ID); }

  public get LinkedScenarios(): AttackScenario[] {
    let res = [];
    this.Data['linkedScenarioIDs'].forEach(id => res.push(this.project.GetAttackScenario(id)));
    return res;
  }
  public set LinkedScenarios(val: AttackScenario[]) { this.Data['linkedScenarioIDs'] = val?.map(x => x.ID); }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Data['Mapping']) this.Data['Mapping'] = {} as IAttackScenario;
    if (!this.Data['targetIDs']) this.Data['targetIDs'] = [];
    if (!this.Data['ThreatState']) this.ThreatState = ThreatStates.NotSet;
    if (!this.Data['systemThreatIDs']) this.Data['systemThreatIDs'] = [];
    if (!this.Data['linkedScenarioIDs']) this.Data['linkedScenarioIDs'] = [];
  }

  public SetMapping(threatOriginID: string, categorieIDs: string[], target: ViewElementBase, elements: ViewElementBase[], rule: ThreatRule, question: ThreatQuestion) {
    this.MappingState = MappingStates.New;
    this.Mapping.Threat = { ThreatOriginID: threatOriginID, ThreatCategoryIDs: categorieIDs };
    if (rule) {
      this.ThreatRule = rule;
      if (rule.Severity) this.Severity = rule.Severity;
      else if (this.ThreatOrigin) this.Severity = this.ThreatOrigin.Severity;
      if (rule.ThreatOrigin?.AttackTechnique?.CVSS) this.ScoreCVSS = JSON.parse(JSON.stringify(rule.ThreatOrigin.AttackTechnique.CVSS));
    }
    if (question) this.ThreatQuestion = question;
    this.Name = null;
    this.Target = target;
    this.Targets = elements;
    this.RuleStillApplies = true;
  }

  public AddLinkedAttackScenario(map: AttackScenario) {
    if (!this.LinkedScenarios.includes(map)) {
      this.Data['linkedScenarioIDs'].push(map.ID);
    }
  }

  public RemoveLinkedAttackScenario(id: string) {
    const index = this.Data['linkedScenarioIDs'].indexOf(id); 
    if (index >= 0) {
      this.Data['linkedScenarioIDs'].splice(index, 1);
    }
  }

  public GetCountermeasures() {
    return this.project.GetCountermeasures().filter(x => x.AttackScenarios.includes(this));
  }

  public GetDiagram() {
    return this.project.GetView(this.ViewID);
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    pf?.GetCountermeasures().filter(x => x.AttackScenarios.includes(this)).forEach(x => res.push({ Type: DataReferenceTypes.RemoveAttackScenarioFromAttackScenario, Param: x }));
    pf?.GetAttackScenarios().filter(x => x.LinkedScenarios.includes(this)).forEach(x => res.push({ Type: DataReferenceTypes.DeleteAssetGroup, Param: x }));
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    this.MappingState = MappingStates.Removed;

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.RemoveAttackScenarioFromCountermeasure) {
        (ref.Param as Countermeasure).RemoveAttackScenario(this.ID);
      }
      else if (ref.Type == DataReferenceTypes.RemoveAttackScenarioFromAttackScenario) {
        (ref.Param as AttackScenario).RemoveLinkedAttackScenario(this.ID);
      }
    });
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): AttackScenario {
    return new AttackScenario(data, pf, cf);
  }
}