import { LowMediumHighNumberUtil } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";
import { ImpactCategoryUtil, RiskStrategyUtil, ThreatSeverityUtil, ThreatStateUtil } from "./threat-model";
import { MitigationStateUtil } from "./mitigations"; 
import { TranslateService } from "@ngx-translate/core";

export enum ExportTypes {
  AttackScenarios = 1,
  Countermeasure = 2,
  SystemThreats = 3,
  ThreatSources = 4
}

export class ExportTypeUtil {
  public static GetKeys() {
    return [ExportTypes.AttackScenarios, ExportTypes.Countermeasure, ExportTypes.SystemThreats, ExportTypes.ThreatSources];
  }

  public static ToString(et: ExportTypes): string {
    switch (et) {
      case ExportTypes.AttackScenarios: return "exporttype.AttackScenarios";
      case ExportTypes.Countermeasure: return "exporttype.Countermeasures";
      case ExportTypes.SystemThreats: return "exporttype.SystemThreats";
      case ExportTypes.ThreatSources: return "exporttype.ThreatSources";
      default:
        console.error('Missing Export Type in ExportTypeUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportCommonProperties {
  Name = 'Name',
  Description = 'Description'
}

export class ExportCommonPropertyUtil {
  public static GetKeys() {
    return [ExportCommonProperties.Name, ExportCommonProperties.Description];
  }

  public static GetValue(key: string, entry) {
    if (!entry) return '';
    let val = entry[key];
    if (!val) val = entry['Data'][key];
    return val;
  }

  public static ToString(ecp: ExportCommonProperties): string {
    switch (ecp) {
      case ExportCommonProperties.Name: return "general.Name";
      case ExportCommonProperties.Description: return "properties.Description";
      default:
        console.error('Missing Prop in ExportCommonPropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportAttackScenarioProperties {
  Number = 'Number',
  ThreatState = 'ThreatState',
  Threat = 'AttackVector',
  Targets = 'Targets',
  ThreatCategories = 'ThreatCategories',
  SystemThreats = 'SystemThreats',
  Diagram = 'Diagram',
  ScoreCVSS = 'ScoreCVSS',
  ScoreOwaspRR = 'ScoreOwaspRR',
  Severity = 'Severity',
  Likelihood = 'Likelihood',
  Risk = 'Risk',
  RiskStrategy = 'RiskStrategy',
  RiskStrategyReason = 'RiskStrategyReason',
  Countermeasures = 'Countermeasures'
}

export class ExportAttackScenarioPropertyUtil {
  public static GetKeys() {
    return [ExportAttackScenarioProperties.Number, ExportAttackScenarioProperties.ThreatState, ExportAttackScenarioProperties.Threat, ExportAttackScenarioProperties.Targets, 
      ExportAttackScenarioProperties.Diagram, ExportAttackScenarioProperties.ThreatCategories,
      ExportAttackScenarioProperties.SystemThreats, ExportAttackScenarioProperties.ScoreCVSS, ExportAttackScenarioProperties.ScoreOwaspRR, ExportAttackScenarioProperties.Severity,
      ExportAttackScenarioProperties.Likelihood, ExportAttackScenarioProperties.Risk, ExportAttackScenarioProperties.RiskStrategy, ExportAttackScenarioProperties.RiskStrategyReason,
      ExportAttackScenarioProperties.Countermeasures];
  }

  public static GetValue(key: string, entry) {
    const wrap = (val: string) => {
      if (!val) return '';
      return val;
    }
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return wrap(method(val));
      return '';
    };
    if (this.GetKeys().includes(key as ExportAttackScenarioProperties)) {
      if ([ExportAttackScenarioProperties.Targets, ExportAttackScenarioProperties.ThreatCategories, ExportAttackScenarioProperties.SystemThreats].includes(key as ExportAttackScenarioProperties)) {
        return wrap(entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportAttackScenarioProperties.Threat].includes(key as ExportAttackScenarioProperties)) {
        return wrap(ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if (key == ExportAttackScenarioProperties.ThreatState) return myToString(ThreatStateUtil.ToString);
      else if (key == ExportAttackScenarioProperties.ScoreCVSS) {
        let val = ExportCommonPropertyUtil.GetValue(key, entry);
        if (val) val = val.Score;
        return wrap(val);
      }
      else if (key == ExportAttackScenarioProperties.ScoreOwaspRR) {
        let val = ExportCommonPropertyUtil.GetValue(key, entry);
        if (val) return ThreatSeverityUtil.ToString(val.Score);
        return wrap(val);
      }
      else if (key == ExportAttackScenarioProperties.Severity) return myToString(ThreatSeverityUtil.ToString);
      else if ([ExportAttackScenarioProperties.Likelihood, ExportAttackScenarioProperties.Risk].includes(key as ExportAttackScenarioProperties)) return myToString(LowMediumHighNumberUtil.ToString);
      else if (key == ExportAttackScenarioProperties.RiskStrategy) return myToString(RiskStrategyUtil.ToString);
      else if (key == ExportAttackScenarioProperties.Diagram) return wrap(entry.GetDiagram()['Name']);
      else if (key == ExportAttackScenarioProperties.Countermeasures) {
        return wrap(entry.GetCountermeasures()?.map(x => x.Name).join('; '));
      }
    }
    return wrap(ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportAttackScenarioProperties): string {
    switch (easp) {
      case ExportAttackScenarioProperties.Number: return "general.Number";
      case ExportAttackScenarioProperties.ThreatState: return "properties.Status";
      case ExportAttackScenarioProperties.Threat: return "general.Threat";
      case ExportAttackScenarioProperties.Targets: return "general.Targets";
      case ExportAttackScenarioProperties.ThreatCategories: return "general.ThreatCategories";
      case ExportAttackScenarioProperties.SystemThreats: return "general.SystemThreats";
      case ExportAttackScenarioProperties.Diagram: return "general.Diagram";
      case ExportAttackScenarioProperties.ScoreCVSS: return "CVSS Score";
      case ExportAttackScenarioProperties.ScoreOwaspRR: return "OWASP RR Score";
      case ExportAttackScenarioProperties.Severity: return "properties.Severity";
      case ExportAttackScenarioProperties.Likelihood: return "general.Likelihood";
      case ExportAttackScenarioProperties.Risk: return "properties.Risk";
      case ExportAttackScenarioProperties.RiskStrategy: return "properties.RiskStrategy";
      case ExportAttackScenarioProperties.RiskStrategyReason: return "properties.RiskStrategyReason";
      case ExportAttackScenarioProperties.Countermeasures: return "general.Countermeasures";
      default:
        console.error('Missing Prop in ExportAttackScenarioPropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportCountermeasureProperties {
  Number = 'Number',
  MappingState = 'MappingState',
  Control = 'Control',
  Targets = 'Targets',
  Diagram = 'Diagram',
  AttackScenarios = 'AttackScenarios',
  Threats = 'AttackVectors',
  MitigationProcess = 'MitigationProcess'
}

export class ExportCountermeasurePropertyUtil {
  public static GetKeys() {
    return [ExportCountermeasureProperties.Number, ExportCountermeasureProperties.MitigationProcess, ExportCountermeasureProperties.Control, ExportCountermeasureProperties.Targets, 
      ExportCountermeasureProperties.Diagram, ExportCountermeasureProperties.AttackScenarios, ExportCountermeasureProperties.Threats, ExportCountermeasureProperties.MitigationProcess];
  }

  public static GetValue(key: string, entry) {
    const wrap = (val: string) => {
      if (!val) return '';
      return val;
    }
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return wrap(method(val));
      return '';
    };
    if (this.GetKeys().includes(key as ExportCountermeasureProperties)) {
      if ([ExportCountermeasureProperties.Targets, ExportCountermeasureProperties.AttackScenarios, ExportCountermeasureProperties.Threats].includes(key as ExportCountermeasureProperties)) {
        return wrap(entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportCountermeasureProperties.Control, ExportCountermeasureProperties.MitigationProcess].includes(key as ExportCountermeasureProperties)) {
        return wrap(ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if (key == ExportCountermeasureProperties.MitigationProcess) return myToString(MitigationStateUtil.ToString);
      else if (key == ExportCountermeasureProperties.Diagram) return wrap(entry.GetDiagram()['Name']);
    }
    return wrap(ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportCountermeasureProperties): string {
    switch (easp) {
      case ExportCountermeasureProperties.Number: return "general.Number";
      case ExportCountermeasureProperties.MappingState: return "properties.Status";
      case ExportCountermeasureProperties.Control: return "general.Control";
      case ExportCountermeasureProperties.Targets: return "general.Targets";
      case ExportCountermeasureProperties.Diagram: return "general.Diagram";
      case ExportCountermeasureProperties.AttackScenarios: return "general.AttackScenarios";
      case ExportCountermeasureProperties.Threats: return "general.Threats";
      case ExportCountermeasureProperties.MitigationProcess: return "general.MitigationProcess";
      default:
        console.error('Missing Prop in ExportCountermeasurePropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportSystemThreatProperties {
  Impact = 'Impact',
  ImpactCats = 'ImpactCats',
  ThreatCategory = 'ThreatCategory',
  AffectedAssetObjects = 'AffectedAssetObjects'
}

export class ExportSystemThreatPropertyUtil {
  public static GetKeys() {
    return [ExportSystemThreatProperties.Impact, ExportSystemThreatProperties.ImpactCats, ExportSystemThreatProperties.ThreatCategory, ExportSystemThreatProperties.AffectedAssetObjects];
  }

  public static GetValue(key: string, entry, translate: TranslateService) {
    const wrap = (val: string) => {
      if (!val) return '';
      return val;
    }
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return wrap(method(val));
      return '';
    };
    if (this.GetKeys().includes(key as ExportSystemThreatProperties)) {
      if ([ExportSystemThreatProperties.AffectedAssetObjects].includes(key as ExportSystemThreatProperties)) {
        return wrap(entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportSystemThreatProperties.ThreatCategory].includes(key as ExportSystemThreatProperties)) {
        return wrap(ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if ([ExportSystemThreatProperties.Impact].includes(key as ExportSystemThreatProperties)) return myToString(LowMediumHighNumberUtil.ToString);
      else if (key == ExportSystemThreatProperties.ImpactCats) {
        return wrap(entry[key]?.map(x => translate.instant(ImpactCategoryUtil.ToString(x))).join('; '));
      }
    }
    return wrap(ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportSystemThreatProperties): string {
    switch (easp) {
      case ExportSystemThreatProperties.Impact: return "properties.Impact";
      case ExportSystemThreatProperties.ImpactCats: return "properties.ImpactCategories";
      case ExportSystemThreatProperties.ThreatCategory: return "general.ThreatCategory";
      case ExportSystemThreatProperties.AffectedAssetObjects: return "report.AffectedAssets";
      default:
        console.error('Missing Prop in ExportSystemThreatPropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportThreatSourceProperties {
  Motive = 'Motive',
  Likelihood = 'Likelihood',
}

export class ExportThreatSourcePropertyUtil {
  public static GetKeys() {
    return [ExportThreatSourceProperties.Motive, ExportThreatSourceProperties.Likelihood];
  }

  public static GetValue(key: string, entry) {
    const wrap = (val: string) => {
      if (!val) return '';
      return val;
    }
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return wrap(method(val));
      return '';
    };
    if (this.GetKeys().includes(key as ExportThreatSourceProperties)) {
      if ([ExportThreatSourceProperties.Motive].includes(key as ExportThreatSourceProperties)) {
        return wrap(entry[key]?.join('; '));
      }
      else if ([ExportThreatSourceProperties.Likelihood].includes(key as ExportThreatSourceProperties)) return myToString(LowMediumHighNumberUtil.ToString);
    }
    return wrap(ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportThreatSourceProperties): string {
    switch (easp) {
      case ExportThreatSourceProperties.Motive: return "properties.Motive";
      case ExportThreatSourceProperties.Likelihood: return "properties.Likelihood";
      default:
        console.error('Missing Prop in ExportThreatSourcePropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportClasses {
  AttackScenario = 'AttackScenario',
  Countermeasure = 'Countermeasure',
  SystemThreat = 'SystemThreat',
  ThreatSources = 'ThreatSources'
}

export class ExportClassUtil {
  public static GetKeys(type: ExportTypes = null) {
    if (!type) return [ExportClasses.AttackScenario, ExportClasses.Countermeasure, ExportClasses.SystemThreat];
    if (type == ExportTypes.AttackScenarios) return [ExportClasses.AttackScenario];
    if (type == ExportTypes.Countermeasure) return [ExportClasses.Countermeasure];
    if (type == ExportTypes.SystemThreats) return [ExportClasses.SystemThreat];
    if (type == ExportTypes.ThreatSources) return [ExportClasses.ThreatSources];
  }

  public static GetProperties(cl: ExportClasses) {
    if (cl == ExportClasses.AttackScenario) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportAttackScenarioPropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.Countermeasure) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportCountermeasurePropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.SystemThreat) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportSystemThreatPropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.ThreatSources) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportThreatSourcePropertyUtil.GetKeys()] as string[];
    return [] as string[];
  }

  public static GetValue(prop: string, entry, translate: TranslateService) {
    const path = prop.split('.');
    switch(path[0]) {
      case ExportClasses.AttackScenario:
        return ExportAttackScenarioPropertyUtil.GetValue(path[1], entry);
      case ExportClasses.Countermeasure:
        return ExportCountermeasurePropertyUtil.GetValue(path[1], entry);
      case ExportClasses.SystemThreat:
        return ExportSystemThreatPropertyUtil.GetValue(path[1], entry, translate);
      case ExportClasses.ThreatSources:
        return ExportThreatSourcePropertyUtil.GetValue(path[1], entry);
      default: return '';
    }
  }

  public static ToString(et: ExportClasses): string {
    switch (et) {
      case ExportClasses.AttackScenario: return "exportclasses.AttackScenario";
      case ExportClasses.Countermeasure: return "exportclasses.Countermeasure";
      case ExportClasses.SystemThreat: return "exportclasses.SystemThreat";
      case ExportClasses.ThreatSources: return "exportclasses.ThreatSource";
      default:
        console.error('Missing Export Class in ExportClassUtil.ToString()')
        return 'Undefined';
    }
  }
}

export interface IExportCell {
  name: string;
  value: string|null;
}

export class ExportTemplate extends DatabaseBase {
  private config: ConfigFile;
  private project: ProjectFile;

  public get ExportType(): ExportTypes { return this.Data['ExportType']; }
  public set ExportType(val: ExportTypes) { this.Data['ExportType'] = val; }

  public get Template(): IExportCell[] { return this.Data['Template']; }
  public set Template(val: IExportCell[]) { this.Data['Template'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.ExportType) this.ExportType = ExportTypes.AttackScenarios;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): ExportTemplate {
    return new ExportTemplate(data, pf, cf);
  }
}