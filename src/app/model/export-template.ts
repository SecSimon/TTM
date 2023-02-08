import { LowMediumHighNumberUtil } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";
import { ImpactCategoryUtil, RiskStrategyUtil, ThreatSeverityUtil, ThreatStateUtil } from "./threat-model";
import { MitigationProcessStateUtil, MitigationStateUtil } from "./mitigations"; 
import { TranslateService } from "@ngx-translate/core";

export enum ExportTypes {
  AttackScenarios = 1,
  Countermeasures = 2,
  SystemThreats = 3,
  ThreatSources = 4,
  MitigationProcesses = 5
}

class ExportUtil {
  public static wrap = (translate: TranslateService, val) => {
    if (!val) return [''];
    if (typeof val === 'string') return [val.replace(/\n/g, '; ').replace(/"/g, '""')];
    if (typeof val === 'number') {
      if (translate.currentLang == 'de') return [val.toString().replace('.', ',')];
    }
    return [val];
  }
}

export class ExportTypeUtil {
  public static GetKeys() {
    return [ExportTypes.AttackScenarios, ExportTypes.Countermeasures, ExportTypes.MitigationProcesses, ExportTypes.SystemThreats, ExportTypes.ThreatSources];
  }

  public static ToString(et: ExportTypes): string {
    switch (et) {
      case ExportTypes.AttackScenarios: return "exporttype.AttackScenarios";
      case ExportTypes.Countermeasures: return "exporttype.Countermeasures";
      case ExportTypes.MitigationProcesses: return "exporttype.MitigationProcesses";
      case ExportTypes.SystemThreats: return "exporttype.SystemThreats";
      case ExportTypes.ThreatSources: return "exporttype.ThreatSources";
      default:
        console.error('Missing Export Type in ExportTypeUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportFilters {
  All = 0,
  Applicable = 1,
  NotApplicable = 2
}

export class ExportFilterUtil {
  public static GetKeys(): ExportFilters[] {
    return [ExportFilters.All, ExportFilters.Applicable, ExportFilters.NotApplicable];
  }

  public static ToString(filter: ExportFilters): string {
    switch (filter) {
      case ExportFilters.All: return 'exportfilters.All';
      case ExportFilters.Applicable: return 'exportfilters.Applicable';
      case ExportFilters.NotApplicable: return 'exportfilters.NotApplicable';
      default:
        console.error('Missing Filter in ExportFilterUtil.ToString()')
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
  AttackVector = 'AttackVector',
  Targets = 'Targets',
  ThreatCategories = 'ThreatCategories',
  SystemThreats = 'SystemThreats',
  Diagram = 'Diagram',
  ScoreCVSS = 'ScoreCVSS',
  ScoreOwaspRR = 'ScoreOwaspRR',
  Severity = 'Severity',
  SeverityReason = 'SeverityReason',
  Likelihood = 'Likelihood',
  LikelihoodReason = 'LikelihoodReason',
  Risk = 'Risk',
  RiskReason = 'RiskReason',
  RiskStrategy = 'RiskStrategy',
  RiskStrategyReason = 'RiskStrategyReason',
  Countermeasures = 'Countermeasures',
  MyTags = 'MyTags'
}

export class ExportAttackScenarioPropertyUtil {
  public static GetKeys() {
    return [ExportAttackScenarioProperties.Number, ExportAttackScenarioProperties.ThreatState, ExportAttackScenarioProperties.AttackVector, ExportAttackScenarioProperties.Targets, 
      ExportAttackScenarioProperties.Diagram, ExportAttackScenarioProperties.ThreatCategories,
      ExportAttackScenarioProperties.SystemThreats, ExportAttackScenarioProperties.ScoreCVSS, ExportAttackScenarioProperties.ScoreOwaspRR, ExportAttackScenarioProperties.Severity,
      ExportAttackScenarioProperties.SeverityReason, ExportAttackScenarioProperties.Likelihood, ExportAttackScenarioProperties.LikelihoodReason, ExportAttackScenarioProperties.Risk, 
      ExportAttackScenarioProperties.RiskReason, ExportAttackScenarioProperties.RiskStrategy, ExportAttackScenarioProperties.RiskStrategyReason, ExportAttackScenarioProperties.Countermeasures,
      ExportAttackScenarioProperties.MyTags];
  }

  public static GetValues(key: string, entry, translate: TranslateService): string[] {
    if (entry == null) return [''];
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return ExportUtil.wrap(translate, method(val));
      return [''];
    };
    if (this.GetKeys().includes(key as ExportAttackScenarioProperties)) {
      if ([ExportAttackScenarioProperties.Targets, ExportAttackScenarioProperties.ThreatCategories, ExportAttackScenarioProperties.SystemThreats, ExportAttackScenarioProperties.MyTags].includes(key as ExportAttackScenarioProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportAttackScenarioProperties.AttackVector].includes(key as ExportAttackScenarioProperties)) {
        return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if (key == ExportAttackScenarioProperties.ThreatState) return myToString(ThreatStateUtil.ToString);
      else if (key == ExportAttackScenarioProperties.ScoreCVSS) {
        let val = ExportCommonPropertyUtil.GetValue(key, entry);
        if (val) val = val.Score;
        return ExportUtil.wrap(translate, val);
      }
      else if (key == ExportAttackScenarioProperties.ScoreOwaspRR) {
        let val = ExportCommonPropertyUtil.GetValue(key, entry);
        if (val) return ExportUtil.wrap(translate, ThreatSeverityUtil.ToString(val.Score));
        return ExportUtil.wrap(translate, val);
      }
      else if ([ExportAttackScenarioProperties.Severity, ExportAttackScenarioProperties.Risk].includes(key as ExportAttackScenarioProperties)) return myToString(ThreatSeverityUtil.ToString);
      else if ([ExportAttackScenarioProperties.Likelihood].includes(key as ExportAttackScenarioProperties)) return myToString(LowMediumHighNumberUtil.ToString);
      else if (key == ExportAttackScenarioProperties.RiskStrategy) return myToString(RiskStrategyUtil.ToString);
      else if (key == ExportAttackScenarioProperties.Diagram) return ExportUtil.wrap(translate, entry.GetDiagram()['Name']);
      else if (key == ExportAttackScenarioProperties.Countermeasures) {
        return ExportUtil.wrap(translate, entry.GetCountermeasures()?.map(x => x.GetLongName()).join('; '));
      }
    }
    return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportAttackScenarioProperties): string {
    switch (easp) {
      case ExportAttackScenarioProperties.Number: return "general.Number";
      case ExportAttackScenarioProperties.ThreatState: return "properties.Status";
      case ExportAttackScenarioProperties.AttackVector: return "general.AttackVector";
      case ExportAttackScenarioProperties.Targets: return "general.Targets";
      case ExportAttackScenarioProperties.ThreatCategories: return "general.ThreatCategories";
      case ExportAttackScenarioProperties.SystemThreats: return "general.SystemThreats";
      case ExportAttackScenarioProperties.Diagram: return "general.Diagram";
      case ExportAttackScenarioProperties.ScoreCVSS: return "CVSS Score";
      case ExportAttackScenarioProperties.ScoreOwaspRR: return "OWASP RR Score";
      case ExportAttackScenarioProperties.Severity: return "properties.Severity";
      case ExportAttackScenarioProperties.SeverityReason: return "properties.SeverityReason";
      case ExportAttackScenarioProperties.Likelihood: return "general.Likelihood";
      case ExportAttackScenarioProperties.LikelihoodReason: return "properties.LikelihoodReason";
      case ExportAttackScenarioProperties.Risk: return "properties.Risk";
      case ExportAttackScenarioProperties.RiskReason: return "properties.RiskReason";
      case ExportAttackScenarioProperties.RiskStrategy: return "properties.RiskStrategy";
      case ExportAttackScenarioProperties.RiskStrategyReason: return "properties.RiskStrategyReason";
      case ExportAttackScenarioProperties.Countermeasures: return "general.Countermeasures";
      case ExportAttackScenarioProperties.MyTags: return "general.Tags";
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
  MaxSeverity = 'MaxSeverity',
  MaxRisk = 'MaxRisk',
  AttackVectors = 'AttackVectors',
  MitigationProcess = 'MitigationProcess',
  MyTags = 'MyTags'
}

export class ExportCountermeasurePropertyUtil {
  public static GetKeys() {
    return [ExportCountermeasureProperties.Number, ExportCountermeasureProperties.MitigationProcess, ExportCountermeasureProperties.Control, ExportCountermeasureProperties.Targets, 
      ExportCountermeasureProperties.Diagram, ExportCountermeasureProperties.AttackScenarios, ExportCountermeasureProperties.MaxSeverity, ExportCountermeasureProperties.MaxRisk,
      ExportCountermeasureProperties.AttackVectors, ExportCountermeasureProperties.MitigationProcess, ExportCountermeasureProperties.MyTags];
  }

  public static GetValues(key: string, entry, translate: TranslateService): string[] {
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return ExportUtil.wrap(translate, method(val));
      return [''];
    };
    if (this.GetKeys().includes(key as ExportCountermeasureProperties)) {
      if ([ExportCountermeasureProperties.Targets, ExportCountermeasureProperties.AttackVectors, ExportCountermeasureProperties.MyTags].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportCountermeasureProperties.AttackScenarios].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => x.GetLongName()).join('; '));
      }
      else if ([ExportCountermeasureProperties.Control].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if ([ExportCountermeasureProperties.MitigationProcess].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.GetLongName());
      }
      else if (key == ExportCountermeasureProperties.MitigationProcess) return myToString(MitigationStateUtil.ToString);
      else if (key == ExportCountermeasureProperties.Diagram) return ExportUtil.wrap(translate, entry.GetDiagram()['Name']);
      else if ([ExportCountermeasureProperties.MaxSeverity].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, ThreatSeverityUtil.ToString(Math.max(...entry['AttackScenarios']?.map(x => x.Severity).filter(x => x && x > 0))));
      } 
      else if ([ExportCountermeasureProperties.MaxRisk].includes(key as ExportCountermeasureProperties)) {
        return ExportUtil.wrap(translate, ThreatSeverityUtil.ToString(Math.max(...entry['AttackScenarios']?.map(x => x.Risk).filter(x => x && x > 0))));
      } 
    }
    return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(easp: ExportCountermeasureProperties): string {
    switch (easp) {
      case ExportCountermeasureProperties.Number: return "general.Number";
      case ExportCountermeasureProperties.MappingState: return "properties.Status";
      case ExportCountermeasureProperties.Control: return "general.Control";
      case ExportCountermeasureProperties.Targets: return "general.Targets";
      case ExportCountermeasureProperties.Diagram: return "general.Diagram";
      case ExportCountermeasureProperties.AttackScenarios: return "general.AttackScenarios";
      case ExportCountermeasureProperties.MaxSeverity: return "exportprops.MaxSeverity";
      case ExportCountermeasureProperties.MaxRisk: return "exportprops.MaxRisk";
      case ExportCountermeasureProperties.AttackVectors: return "general.AttackVectors";
      case ExportCountermeasureProperties.MitigationProcess: return "general.MitigationProcess";
      case ExportCountermeasureProperties.MyTags: return "general.Tags";
      default:
        console.error('Missing Prop in ExportCountermeasurePropertyUtil.ToString()')
        return 'Undefined';
    }
  }
}

export enum ExportMitigationProcessProperties {
  Number = 'Number',
  ProcessState = 'MitigationProcessState',
  Progress = 'Progress',
  Countermeasures = 'Countermeasures',
  AttackScenarios = 'AttackScenarios',
  MaxSeverity = 'MaxSeverity',
  MaxRisk = 'MaxRisk',
  Tasks = 'Tasks',
  Notes = 'Notes'
}

export class ExportMitigationProcessPropertyUtil {
  public static GetKeys() {
    return [ExportMitigationProcessProperties.Number, ExportMitigationProcessProperties.ProcessState, ExportMitigationProcessProperties.Progress,ExportMitigationProcessProperties.Countermeasures, 
      ExportMitigationProcessProperties.AttackScenarios, ExportMitigationProcessProperties.MaxSeverity, ExportMitigationProcessProperties.MaxRisk, ExportMitigationProcessProperties.Tasks, ExportMitigationProcessProperties.Notes];
  }

  public static GetValues(key: string, entry, translate: TranslateService): string[] {
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return ExportUtil.wrap(translate, method(val));
      return [''];
    };
    if (this.GetKeys().includes(key as ExportMitigationProcessProperties)) {
      if ([ExportMitigationProcessProperties.Countermeasures].includes(key as ExportMitigationProcessProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => x.GetLongName()).join('; '));
      }
      else if ([ExportMitigationProcessProperties.AttackScenarios].includes(key as ExportMitigationProcessProperties)) {
        return ExportUtil.wrap(translate, entry['Countermeasures']?.map(x => x.AttackScenarios).flat().map(x => x.GetLongName()).join('; '));
      }
      else if ([ExportMitigationProcessProperties.MaxSeverity].includes(key as ExportMitigationProcessProperties)) {
        return ExportUtil.wrap(translate, ThreatSeverityUtil.ToString(Math.max(...entry['Countermeasures']?.map(x => x.AttackScenarios).flat().map(x => x.Severity).filter(x => x && x > 0))));
      } 
      else if ([ExportMitigationProcessProperties.MaxRisk].includes(key as ExportMitigationProcessProperties)) {
        return ExportUtil.wrap(translate, ThreatSeverityUtil.ToString(Math.max(...entry['Countermeasures']?.map(x => x.AttackScenarios).flat().map(x => x.Risk).filter(x => x && x > 0))));
      } 
      else if (key == ExportMitigationProcessProperties.ProcessState) return myToString(MitigationProcessStateUtil.ToString);
      else if (key == ExportMitigationProcessProperties.Progress) return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry) + '%');
      else if ([ExportMitigationProcessProperties.Tasks, ExportMitigationProcessProperties.Notes].includes(key as ExportMitigationProcessProperties)) {
        return entry[key]?.map(x => x.Note);
      }
    }
    return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry));
  }

  public static ToString(empp: ExportMitigationProcessProperties): string {
    switch (empp) {
      case ExportMitigationProcessProperties.Number: return "general.Number";
      case ExportMitigationProcessProperties.ProcessState: return "properties.Status";
      case ExportMitigationProcessProperties.Progress: return "general.Progress";
      case ExportMitigationProcessProperties.Countermeasures: return "general.Countermeasures";
      case ExportMitigationProcessProperties.AttackScenarios: return "general.AttackScenarios";
      case ExportMitigationProcessProperties.MaxSeverity: return "exportprops.MaxSeverity";
      case ExportMitigationProcessProperties.MaxRisk: return "exportprops.MaxRisk";
      case ExportMitigationProcessProperties.Tasks: return "general.Tasks";
      case ExportMitigationProcessProperties.Notes: return "general.Notes";
      default:
        console.error('Missing Prop in ExportMitigationProcessProperties.ToString()')
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

  public static GetValues(key: string, entry, translate: TranslateService): string[] {
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return ExportUtil.wrap(translate, method(val));
      return [''];
    };
    if (this.GetKeys().includes(key as ExportSystemThreatProperties)) {
      if ([ExportSystemThreatProperties.AffectedAssetObjects].includes(key as ExportSystemThreatProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => ExportCommonPropertyUtil.GetValue('Name', x)).join('; '));
      }
      else if ([ExportSystemThreatProperties.ThreatCategory].includes(key as ExportSystemThreatProperties)) {
        return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue('Name', entry[key]));
      }
      else if ([ExportSystemThreatProperties.Impact].includes(key as ExportSystemThreatProperties)) return myToString(LowMediumHighNumberUtil.ToString);
      else if (key == ExportSystemThreatProperties.ImpactCats) {
        return ExportUtil.wrap(translate, entry[key]?.map(x => translate.instant(ImpactCategoryUtil.ToString(x))).join('; '));
      }
    }
    return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry));
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

  public static GetValues(key: string, entry, translate: TranslateService): string[] {
    const myToString = (method) => {
      const val = ExportCommonPropertyUtil.GetValue(key, entry);
      if (val) return ExportUtil.wrap(translate, method(val));
      return [''];
    };
    if (this.GetKeys().includes(key as ExportThreatSourceProperties)) {
      if ([ExportThreatSourceProperties.Motive].includes(key as ExportThreatSourceProperties)) {
        return ExportUtil.wrap(translate, entry[key]?.join('; '));
      }
      else if ([ExportThreatSourceProperties.Likelihood].includes(key as ExportThreatSourceProperties)) return myToString(LowMediumHighNumberUtil.ToString);
    }
    return ExportUtil.wrap(translate, ExportCommonPropertyUtil.GetValue(key, entry));
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
  MitigationProcess = 'MitigationProcess',
  SystemThreat = 'SystemThreat',
  ThreatSources = 'ThreatSources'
}

export class ExportClassUtil {
  public static GetKeys(type: ExportTypes = null) {
    if (!type) return [ExportClasses.AttackScenario, ExportClasses.Countermeasure, ExportClasses.SystemThreat];
    if (type == ExportTypes.AttackScenarios) return [ExportClasses.AttackScenario];
    if (type == ExportTypes.Countermeasures) return [ExportClasses.Countermeasure];
    if (type == ExportTypes.MitigationProcesses) return [ExportClasses.MitigationProcess];
    if (type == ExportTypes.SystemThreats) return [ExportClasses.SystemThreat];
    if (type == ExportTypes.ThreatSources) return [ExportClasses.ThreatSources];
  }

  public static GetProperties(cl: ExportClasses) {
    if (cl == ExportClasses.AttackScenario) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportAttackScenarioPropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.Countermeasure) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportCountermeasurePropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.MitigationProcess) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportMitigationProcessPropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.SystemThreat) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportSystemThreatPropertyUtil.GetKeys()] as string[];
    if (cl == ExportClasses.ThreatSources) return [...ExportCommonPropertyUtil.GetKeys(), ...ExportThreatSourcePropertyUtil.GetKeys()] as string[];
    return [] as string[];
  }

  public static GetValues(prop: string, entry, translate: TranslateService): string[] {
    const path = prop.split('.');
    switch(path[0]) {
      case ExportClasses.AttackScenario:
        return ExportAttackScenarioPropertyUtil.GetValues(path[1], entry, translate);
      case ExportClasses.Countermeasure:
        return ExportCountermeasurePropertyUtil.GetValues(path[1], entry, translate);
        case ExportClasses.MitigationProcess:
          return ExportMitigationProcessPropertyUtil.GetValues(path[1], entry, translate);
      case ExportClasses.SystemThreat:
        return ExportSystemThreatPropertyUtil.GetValues(path[1], entry, translate);
      case ExportClasses.ThreatSources:
        return ExportThreatSourcePropertyUtil.GetValues(path[1], entry, translate);
      default: return [''];
    }
  }

  public static ToString(et: ExportClasses): string {
    switch (et) {
      case ExportClasses.AttackScenario: return "exportclasses.AttackScenario";
      case ExportClasses.Countermeasure: return "exportclasses.Countermeasure";
      case ExportClasses.MitigationProcess: return "exportclasses.MitigationProcess";
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

  public get ExportFilter(): ExportFilters { return this.Data['ExportFilter']; }
  public set ExportFilter(val: ExportFilters) { this.Data['ExportFilter'] = val; }

  public get HasExportFilter(): boolean { return [ExportTypes.AttackScenarios, ExportTypes.Countermeasures].includes(this.ExportType); }

  public get Template(): IExportCell[] { return this.Data['Template']; }
  public set Template(val: IExportCell[]) { this.Data['Template'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.ExportType) this.ExportType = ExportTypes.AttackScenarios;
    if (this.ExportFilter == null) this.ExportFilter = ExportFilters.Applicable;
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