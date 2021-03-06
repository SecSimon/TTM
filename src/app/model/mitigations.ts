import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IDataReferences, ViewElementBase } from "./database";
import { ProjectFile } from "./project-file";
import { LifeCycle, MappingStates, ThreatMapping, ThreatOrigin, ThreatRule } from "./threat-model";

export interface IMitigationTip {
  Name: string;
  Description: string;
  LifeCycles: LifeCycle[];
}

export class Mitigation extends DatabaseBase {
  private config: ConfigFile;

  public get MitigatedThreatOrigins(): ThreatOrigin[] { 
    let res: ThreatOrigin[] = [];
    this.Data['mitigatedThreatOriginIDs'].forEach(x => res.push(this.config.GetThreatOrigin(x)));
    return res;
  }
  public set MitigatedThreatOrigins(val: ThreatOrigin[]) {
    this.Data['mitigatedThreatOriginIDs'] = val?.map(x => x.ID);
  }

  public get MitigatedThreatRules(): ThreatRule[] { 
    let res: ThreatRule[] = [];
    this.Data['mitigatedThreatRuleIDs'].forEach(x => res.push(this.config.GetThreatRule(x)));
    return res;
  }
  public set MitigatedThreatRules(val: ThreatRule[]) {
    this.Data['mitigatedThreatRuleIDs'] = val?.map(x => x.ID);
  }

  public get MitigationTips(): IMitigationTip[] { return this.Data['MitigationTips']; }
  public set MitigationTips(val: IMitigationTip[]) { this.Data['MitigationTips'] = val; }

  constructor(data: {}, cf: ConfigFile) {
    super(data);

    this.config = cf;

    if (!this.Data['mitigatedThreatOriginIDs']) this.Data['mitigatedThreatOriginIDs'] = [];
    if (!this.Data['mitigatedThreatRuleIDs']) this.Data['mitigatedThreatRuleIDs'] = [];
    if (!this.Data['MitigationTips']) this.Data['MitigationTips'] = [];
  }

  public AddMitigatedThreatOrigin(threat: ThreatOrigin) {
    if (!this.MitigatedThreatOrigins.includes(threat)) {
      this.Data['mitigatedThreatOriginIDs'].push(threat.ID);
    }
  }

  public RemoveMitigatedThreatOrigin(threat: ThreatOrigin) {
    const index = this.MitigatedThreatOrigins.indexOf(threat);
    if (index >= 0) {
      this.Data['mitigatedThreatOriginIDs'].splice(index, 1);
    }
  }

  public AddMitigatedThreatRule(threat: ThreatRule) {
    if (!this.MitigatedThreatRules.includes(threat)) {
      this.Data['mitigatedThreatRuleIDs'].push(threat.ID);
    }
  }

  public RemoveMitigatedThreatRule(threat: ThreatRule) {
    const index = this.MitigatedThreatRules.indexOf(threat);
    if (index >= 0) {
      this.Data['mitigatedThreatRuleIDs'].splice(index, 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    pf?.GetMitigationMappings().filter(x => x.Mitigation == this).forEach(x => res.push({ Type: DataReferenceTypes.DeleteMitigationMapping, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let group = cf.FindGroupOfMitigation(this);
    if (group) group.RemoveMitigation(this);

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteMitigationMapping) {
        pf.DeleteMitigationMapping(ref.Param as MitigationMapping);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): Mitigation {
    return new Mitigation(data, cf);
  }
}

export class MitigationGroup extends DatabaseBase {
  private config: ConfigFile;

  public get SubGroups(): MitigationGroup[] { 
    let res = [];
    this.Data['mitigationGroupIDs'].forEach(id => res.push(this.config.GetMitigationGroup(id)));
    return res;
  }
  public get Mitigations(): Mitigation[] { 
    let res = [];
    this.Data['mitigationIDs'].forEach(id => res.push(this.config.GetMitigation(id)));
    return res;
  }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['mitigationGroupIDs']) { this.Data['mitigationGroupIDs'] = []; }
    if (!this.Data['mitigationIDs']) { this.Data['mitigationIDs'] = []; }
  }

  public AddMitigationGroup(group: MitigationGroup) {
    if (!this.SubGroups.includes(group)) this.Data['mitigationGroupIDs'].push(group.ID);
  }

  public RemoveMitigationGroup(mit: MitigationGroup) {
    if (this.SubGroups.includes(mit)) {
      this.Data['mitigationGroupIDs'].splice(this.Data['mitigationGroupIDs'].indexOf(mit.ID), 1);
    }
  }

  public AddMitigation(mit: Mitigation) {
    if (!this.Mitigations.includes(mit)) this.Data['mitigationIDs'].push(mit.ID);
  }

  public RemoveMitigation(mit: Mitigation) {
    if (this.Mitigations.includes(mit)) {
      this.Data['mitigationIDs'].splice(this.Data['mitigationIDs'].indexOf(mit.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.SubGroups.forEach(x => res.push({ Type: DataReferenceTypes.DeleteMitigationGroup, Param: x }));
    this.Mitigations.forEach(x => res.push({ Type: DataReferenceTypes.DeleteMitigation, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteMitigation) {
        cf.DeleteMitigation(ref.Param as Mitigation);
      }
      else if (ref.Type == DataReferenceTypes.DeleteMitigationGroup) {
        cf.DeleteMitigationGroup(ref.Param as MitigationGroup);
      }
    });

    cf.FindGroupOfMitigationGroup(this).RemoveMitigationGroup(this);
  }

  public static FromJSON(data, cf: ConfigFile): MitigationGroup {
    return new MitigationGroup(data, cf);
  }
}

export enum MitigationStates {
  NotSet = 1,
  NotApplicable = 2,
  Rejected = 3,
  NeedsInvestigation = 4,
  MitigationStarted = 5,
  Mitigated = 6
}

export class MitigationStateUtil {
  public static GetMitigationStates(): MitigationStates[] {
    return [MitigationStates.NotSet, MitigationStates.NotApplicable, MitigationStates.Rejected, MitigationStates.NeedsInvestigation, MitigationStates.MitigationStarted, MitigationStates.Mitigated];
  }

  public static ToString(state: MitigationStates): string {
    switch (state) {
      case MitigationStates.NotSet: return 'properties.mitigationstate.NotSet';
      case MitigationStates.NotApplicable: return 'properties.mitigationstate.NotApplicable';
      case MitigationStates.Rejected: return 'properties.mitigationstate.Rejected';
      case MitigationStates.NeedsInvestigation: return 'properties.mitigationstate.NeedsInvestigation';
      case MitigationStates.MitigationStarted: return 'properties.mitigationstate.MitigationStarted';
      case MitigationStates.Mitigated: return 'properties.mitigationstate.Mitigated';
      default:
        console.error('Missing State in MitigationStateUtil.ToString()', state)
        return 'Undefined';
    }
  }
}

/**
 * Class for mitigations in project
 */
export class MitigationMapping extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Name(): string { 
    if (this.Data['Name'] != null) return this.Data['Name']; 

    let res = '';
    if (this.Mitigation) res += this.Mitigation.Name + ' for ';
    if (this.Targets) res += this.Targets.filter(x => x).map(x => x.GetProperty('Name')).join(', ');
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
  public get MitigationState(): MitigationStates { return this.Data['MitigationState']; }
  public set MitigationState(val: MitigationStates) { this.Data['MitigationState'] = Number(val); }
  public get IsGenerated(): boolean { return this.Data['IsGenerated']; }
  public set IsGenerated(val: boolean) { this.Data['IsGenerated'] = val; }
  public get RuleStillApplies(): boolean { return this.Data['RuleStillApplies']; }
  public set RuleStillApplies(val: boolean) { this.Data['RuleStillApplies'] = val; }

  public get Mitigation(): Mitigation { return this.config.GetMitigation(this.Data['mitigationID']); }
  public set Mitigation(val: Mitigation) { this.Data['mitigationID'] = val?.ID; }
  // public get Target(): ViewElementBase {
  //   let target: any = this.project.GetDFDElement(this.Data['targetID']);
  //   if (!target) target = this.project.GetComponent(this.Data['targetID']);
  //   if (!target) target = this.project.GetContextElement(this.Data['targetID']);
  //   return target;
  // }
  // public set Target(val: ViewElementBase) { this.Data['targetID'] = val?.ID; }
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
          else res.push(null);
          //console.error('Unknown target');
        }
      }
    });
    return res;
  }
  public set Targets(val: ViewElementBase[]) { this.Data['targetIDs'] = val.map(x => x.ID); }
  public get ThreatMappings(): ThreatMapping[] {
    let res: ThreatMapping[] = [];
    this.Data['threatMappingIDs'].forEach(x => res.push(this.project.GetThreatMapping(x)));
    return res;
  }
  public set ThreatMappings(val: ThreatMapping[]) { this.Data['threatMappingIDs'] = val?.map(x => x.ID); }

  public get MitigationProcess(): MitigationProcess { return this.project.GetMitigationProcess(this.Data['mitigationProcessID']); }
  public set MitigationProcess(val: MitigationProcess) { this.Data['mitigationProcessID'] = val?.ID; }

  public get ThreatOrigins(): ThreatOrigin[] {
    return this.ThreatMappings?.map(x => x?.ThreatOrigin).filter(x => x).filter((value, index, self) => self.indexOf(value) === index);
  }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Data['threatMappingIDs']) this.Data['threatMappingIDs'] = [];
    if (!this.Data['MitigationState']) this.MitigationState = MitigationStates.NotSet;
  }

  public SetMapping(mitigation: Mitigation, targets: ViewElementBase[], mappings: ThreatMapping[]) {
    this.MappingState = MappingStates.New;
    this.Mitigation = mitigation;
    this.Targets = targets;
    this.ThreatMappings = mappings;
    this.Name = null;
    this.IsGenerated = true;
    this.RuleStillApplies = true;
  }

  public AddThreatMapping(map: ThreatMapping) {
    if (!this.ThreatMappings.includes(map)) {
      this.Data['threatMappingIDs'].push(map.ID);
    }
  }

  public RemoveThreatMapping(mapID: string) {
    const index = this.Data['threatMappingIDs'].indexOf(mapID); 
    if (index >= 0) {
      this.Data['threatMappingIDs'].splice(index, 1);
    }
  }

  public AddTarget(target: ViewElementBase) {
    if (!this.Targets.includes(target)) {
      this.Data['targetIDs'].push(target.ID);
    }
  }

  public RemoveTarget(targetID: string) {
    const index = this.Data['targetIDs'].indexOf(targetID); 
    if (index >= 0) {
      this.Data['targetIDs'].splice(index, 1);
    }
  }

  public CleanUpReferences() {
    let mappings = this.ThreatMappings;
    for (let i = mappings.length-1; i >= 0; i--) {
      if (mappings[i] == null) {
        this.Data['threatMappingIDs'].splice(i, 1);
      }
    }
    let targets = this.Targets;
    for (let i = targets.length-1; i >= 0; i--) {
      if (targets[i] == null) {
        this.Data['targetIDs'].splice(i, 1);
      }
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = [];
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    this.MappingState = MappingStates.Removed;
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MitigationMapping {
    return new MitigationMapping(data, pf, cf);
  }
}

export interface ITask {
  Task: string;
  IsDone: boolean;
}

export interface INote {
  Author: string;
  Date: string;
  Note: string;
}

export enum MitigationProcessStates {
  NotStarted = 1,
  WorkInProgress = 2,
  Completed = 3
}

export class MitigationProcessStateUtil {
  public static GetMitigationStates(): MitigationProcessStates[] {
    return [MitigationProcessStates.NotStarted, MitigationProcessStates.WorkInProgress, MitigationProcessStates.Completed];
  }

  public static ToString(state: MitigationProcessStates): string {
    switch (state) {
      case MitigationProcessStates.NotStarted: return 'properties.mitigationprocessstate.NotStarted';
      case MitigationProcessStates.WorkInProgress: return 'properties.mitigationprocessstate.WorkInProgress';
      case MitigationProcessStates.Completed: return 'properties.mitigationprocessstate.Completed';
      default:
        console.error('Missing State in MitigationProcessStateUtil.ToString()', state)
        return 'Undefined';
    }
  }
}

/**
 * Class for tracking mitigations in project
 */
export class MitigationProcess extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Number(): string { return this.Data['Number']; }
  public set Number(val: string) { this.Data['Number'] = val; }
  public get Progress(): number { return this.Data['Progress']; }
  public set Progress(val: number) { this.Data['Progress'] = val; }  
  public get Tasks(): ITask[] { return this.Data['Tasks']; }
  public set Tasks(val: ITask[]) { this.Data['Tasks'] = val; }
  public get Notes(): INote[] { return this.Data['Notes']; }
  public set Notes(val: INote[]) { this.Data['Notes'] = val; }
  public get MitigationProcessState(): MitigationProcessStates { return this.Data['MitigationProcessState']; }
  public set MitigationProcessState(val: MitigationProcessStates) { this.Data['MitigationProcessState'] = val; }
  public get MitigationMappings(): MitigationMapping[] { 
    return this.project.GetMitigationMappings().filter(x => x.MitigationProcess == this);
  }
  public set MitigationMappings(val: MitigationMapping[]) { 
    this.MitigationMappings.filter(x => !val.includes(x)).forEach(x => x.MitigationProcess = null);
    val.forEach(x => x.MitigationProcess = this);
  }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.MitigationProcessState) this.MitigationProcessState = MitigationProcessStates.NotStarted;
    if (this.Progress == null) this.Progress = 0;
    if (!this.Data['Tasks']) this.Data['Tasks'] = [];
    if (!this.Data['Notes']) this.Data['Notes'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = [];
    this.MitigationMappings.forEach(x => refs.push({ Type: DataReferenceTypes.RemoveMitigationProcessFromMitigationMapping, Param: x }));
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.RemoveMitigationProcessFromMitigationMapping) {
        (ref.Param as MitigationMapping).MitigationProcess = null;
      }
    })
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MitigationProcess {
    return new MitigationProcess(data, pf, cf);
  }
}