import { ThreatEngineService } from "../util/threat-engine.service";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";
import { Device } from "./system-context";
import { IPropertyRestriction } from "./threat-model";



export interface IReqFulfillSWRule {
  ComponentTypeID: string;
  PropertyRest: IPropertyRestriction;
} 

export enum ReqFulfillRuleTypes {
  SWComponent = 1
}

export interface IReqFulfillRule {
  RuleType: ReqFulfillRuleTypes;
  SWRule?: IReqFulfillSWRule;
  NeedsReview: boolean;
}

export class ReqFulfillRuleTypesUtil {
  public static GetTypes(): ReqFulfillRuleTypes[] {
    return [ReqFulfillRuleTypes.SWComponent];
  }

  public static ToString(rt: ReqFulfillRuleTypes): string {
    switch (rt) {
      case ReqFulfillRuleTypes.SWComponent: return 'general.SWComponent';
      default:
        console.error('Missing ReqFulfillRuleTypesUtil.ToString()')
        return 'Undefined';
    }
  }
}

export class RequirementType extends DatabaseBase {
  private config: ConfigFile;

  public get SubReqTypes(): RequirementType[] { 
    let res = [];
    this.Data['subReqTypeIDs'].forEach(id => res.push(this.config.GetRequirementType(id)));
    return res;
  }

  public get RequiredPerLevel(): boolean[] { return this.Data['RequiredPerLevel']; }
  public set RequiredPerLevel(val: boolean[]) {
    this.Data['RequiredPerLevel'] = val;
  }

  public get ReqFulfillRule(): IReqFulfillRule { return this.Data['ReqFulfillRule']; }
  public set ReqFulfillRule(val: IReqFulfillRule) { this.Data['ReqFulfillRule'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['subReqTypeIDs']) this.Data['subReqTypeIDs'] = [];
    if (!this.Data['RequiredPerLevel']) this.Data['RequiredPerLevel'] = [];
    if (!this.Data['ReqFulfillRule']) this.Data['ReqFulfillRule'] = {};
  }

  public EvalRequirement(device: Device): boolean[] {
    if (this.ReqFulfillRule.RuleType == ReqFulfillRuleTypes.SWComponent) {
      if (this.ReqFulfillRule.SWRule.ComponentTypeID && this.ReqFulfillRule.SWRule.PropertyRest.ID) {
        let comp = device.SoftwareStack.GetChildrenFlat().find(x => x.Type.ID == this.ReqFulfillRule.SWRule.ComponentTypeID);
        if (comp) {
          let res = ThreatEngineService.EvalProp(this.ReqFulfillRule.SWRule.PropertyRest, comp);
          if (res) return this.RequiredPerLevel;
          else return new Array(this.RequiredPerLevel.length).fill(false);
        }
      }
    }

    return null;
  }

  public AddSubRequirementType(type: RequirementType) {
    if (!this.SubReqTypes.includes(type)) this.Data['subReqTypeIDs'].push(type.ID);
  }

  public RemoveSubRequirementType(type: RequirementType) {
    if (this.SubReqTypes.includes(type)) {
      this.Data['subReqTypeIDs'].splice(this.Data['subReqTypeIDs'].indexOf(type.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.SubReqTypes.forEach(x => res.push({ Type: DataReferenceTypes.DeleteRequirementType, Param: x }));
    cf.GetChecklistTypes().filter(x => x.RequirementTypes.find(y => y.ID == this.ID)).forEach(x => res.push({ Type: DataReferenceTypes.RemoveRequirementTypeFromChecklistType, Param: x }));
    pf?.GetChecklists().filter(x => x.Type.GetRequirementTypesFlat().find(y => y.ID == this.ID)).forEach(x => res.push({ Type: DataReferenceTypes.RemoveRequirementTypeFromChecklist, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let parentGroup = cf.GetRequirementTypes().find(x => x.SubReqTypes.some(y => y.ID == this.ID));
    if (parentGroup) parentGroup.RemoveSubRequirementType(this);

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteRequirementType) {
        cf.DeleteRequirementType(ref.Param as RequirementType);
      }
      else if (ref.Type == DataReferenceTypes.RemoveRequirementTypeFromChecklistType) {
        (ref.Param as ChecklistType).RemoveRequirementType(this);
      }
      else if (ref.Type == DataReferenceTypes.RemoveRequirementTypeFromChecklist) {
        const index = (ref.Param as Checklist).RequirementValues.findIndex(x => x.RequirementTypeID == this.ID);
        if (index >= 0) {
          (ref.Param as Checklist).RequirementValues.splice(index, 1);
        }
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): RequirementType {
    return new RequirementType(data, cf);
  }
}

export interface IChecklistLevel {
  Name: string;
  Abbr: string;
  Description: string;
}

export class ChecklistType extends DatabaseBase {
  private config: ConfigFile;

  public get Levels(): IChecklistLevel[] { return this.Data['Levels']; }
  public set Levels(val: IChecklistLevel[]) { this.Data['Levels'] = val; }

  public get RequirementTypes(): RequirementType[] { 
    let res = [];
    this.Data['requirementTypeIDs'].forEach(id => res.push(this.config.GetRequirementType(id)));
    return res;
  }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (this.Data['Levels'] == null) this.Levels = [];
    if (!this.Data['requirementTypeIDs']) { this.Data['requirementTypeIDs'] = []; }
  }

  public AddRequirementType(type: RequirementType) {
    if (!this.RequirementTypes.includes(type)) this.Data['requirementTypeIDs'].push(type.ID);
  }

  public RemoveRequirementType(type: RequirementType) {
    if (this.RequirementTypes.includes(type)) {
      this.Data['requirementTypeIDs'].splice(this.Data['requirementTypeIDs'].indexOf(type.ID), 1);
    }
  }

  public GetRequirementTypesFlat(): RequirementType[] {
    let res: RequirementType[] = [];

    let addReqs = (reqs: RequirementType[]) => {
      reqs.forEach(req => {
        res.push(req);
        addReqs(req.SubReqTypes);
      });
    };

    addReqs(this.RequirementTypes);

    return res;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    pf?.GetChecklists().filter(x => x.Type.ID == this.ID).forEach(x => res.push({ Type: DataReferenceTypes.DeleteChecklist, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    this.RequirementTypes.forEach(x => cf.DeleteRequirementType(x));

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteChecklist) {
        pf.DeleteChecklist(ref.Param as Checklist);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): ChecklistType {
    return new ChecklistType(data, cf);
  }
}

export interface IRequirementValue {
  RequirementTypeID: string;
  Values: boolean[];
  NeedsReview: boolean;
}

export class Checklist extends DatabaseBase {
  private config: ConfigFile;
  private project: ProjectFile;

  public get Type(): ChecklistType { return this.config.GetChecklistType(this.Data['typeID']); }
  public set Type(val: ChecklistType) { this.Data['typeID'] = val?.ID; }

  public get RequirementValues(): IRequirementValue[] { return this.Data['RequirementValues']; }
  public set RequirementValues(val: IRequirementValue[]) { this.Data['RequirementValues'] = val; }

  constructor(data, type: ChecklistType, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.config = cf;
    this.project = pf;
    
    this.Type = type;
    if (!this.Data['RequirementValues']) this.Data['RequirementValues'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let dev = pf.GetDevices().find(x => x.Checklists.includes(this));
    if (dev) dev.RemoveChecklist(this);
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): Checklist {
    return new Checklist(data, cf.GetChecklistType(data['typeID']), pf, cf);
  }
}


