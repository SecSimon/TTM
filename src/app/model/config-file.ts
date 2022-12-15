import { StringExtension } from "../util/string-extension";
import { MyComponentType, MyComponentTypeGroup, MyComponentTypeIDs } from "./component";
import { DatabaseBase, IDatabaseBase, IDataReferences, IProperty } from "./database";
import { ElementTypeIDs, ElementTypeUtil, Protocol, StencilThreatMnemonic, StencilType, StencilTypeTemplate } from "./dfd-model";
import { ThreatCategory, ThreatCategoryGroup, ThreatQuestion, AttackVector, AttackVectorGroup, ThreatRule, ThreatRuleGroup, RuleTypes as ThreatRuleTypes } from "./threat-model";

import defaultConfig from "../../assets/default-config-file.json";
import { AssetGroup, LowMediumHighNumber, MyData } from "./assets";
import { ProjectFile } from "./project-file";
import { Control, ControlGroup } from "./mitigations";
import { ChecklistType, RequirementType } from "./checklist";
import { FileUpdateService } from "../util/file-update.service";
import { ThreatActor } from "./threat-source";

export interface IConfigFile extends IDatabaseBase {
  assetGroups: {}[];
  myData: {}[];

  stencilTypes: {}[];
  stencilTypeTemplates: {}[];
  stencilThreatMnemonics: {}[];
  protocols: {}[];
  myComponentSWTypes: {}[];
  myComponentSWTypeGroups: {}[];
  myComponentPTypes: {}[];
  myComponentPTypeGroups: {}[];
  threatActors: {}[];
  threatCategoryGroups: {}[];
  threatCategories: {}[];
  attackVectorGroups: {}[];
  attackVectors: {}[];
  threatQuestions: {}[];
  threatRuleGroups: {}[];
  threatRules: {}[];

  controlGroups: {}[];
  controls: {}[];

  requirementTypes: {}[];
  checklistTypes: {}[];
}

export class ConfigFile extends DatabaseBase {

  private assetGroups: AssetGroup[] = [];
  private myData: MyData[] = [];

  private stencilTypeMap = new Map<string, StencilType>(); 
  private stencilTypeTemplates: StencilTypeTemplate[] = [];
  private stencilThreatMnemonics: StencilThreatMnemonic[] = [];
  private protocolMap = new Map<string, Protocol>();
  private myComponentSWTypeMap = new Map<string, MyComponentType>();
  private myComponentSWTypeGroups: MyComponentTypeGroup[] = [];
  private myComponentPTypeMap = new Map<string, MyComponentType>();
  private myComponentPTypeGroups: MyComponentTypeGroup[] = [];
  private threatActors: ThreatActor[] = [];
  private threatCategoryGroups: ThreatCategoryGroup[] = [];
  private threatCategoryMap = new Map<string, ThreatCategory>();
  private attackVectorGroups: AttackVectorGroup[] = [];
  private attackVectorMap = new Map<string, AttackVector>();
  private threatQuestionMap = new Map<string, ThreatQuestion>();
  private threatRuleGroups: ThreatRuleGroup[] = [];
  private threatRuleMap = new Map<string, ThreatRule>();

  private controlGroups: ControlGroup[] = [];
  private controlMap = new Map<string, Control>();

  private requirementTypes: RequirementType[] = [];
  private checklistTypes: ChecklistType[] = [];

  public get Version(): number { return this.Data['Version']; }
  public FileChanged = false;

  public ProjectFile: ProjectFile;

  public get AssetGroups(): AssetGroup { return this.GetAssetGroup(this.Data['assetGroupID']); }
  public get ThreatLibrary(): AttackVectorGroup { return this.GetAttackVectorGroup(this.Data['threatLibraryID']); }
  public get DFDThreatRuleGroups(): ThreatRuleGroup { return this.GetThreatRuleGroup(this.Data['DFDthreatRuleGroupsID']); }
  public get StencilThreatRuleGroups(): ThreatRuleGroup { return this.GetThreatRuleGroup(this.Data['stencilThreatRuleGroupsID']); }
  public get ComponentThreatRuleGroups(): ThreatRuleGroup { return this.GetThreatRuleGroup(this.Data['componentThreatRuleGroupsID']); }
  public get ControlLibrary(): ControlGroup { return this.GetControlGroup(this.Data['controlLibraryID']); }

  public GetAssetGroups(): AssetGroup[] { return this.assetGroups; }
  public GetMyDatas(): MyData[] { return this.myData; }

  public GetStencilTypes(): StencilType[] { return Array.from(this.stencilTypeMap, ([k, v]) => v); }
  public GetStencilTypeTemplates(): StencilTypeTemplate[] { return this.stencilTypeTemplates; }
  public GetStencilThreatMnemonics(): StencilThreatMnemonic[] { return this.stencilThreatMnemonics; }
  public GetProtocols(): Protocol[] { return Array.from(this.protocolMap, ([k, v]) => v); }
  public GetMyComponentTypes(type: MyComponentTypeIDs) {
    return type == MyComponentTypeIDs.Software ? this.GetMyComponentSWTypes() : this.GetMyComponentPTypes();
  }
  public GetMyComponentSWTypes(): MyComponentType[] { return Array.from(this.myComponentSWTypeMap, ([k, v]) => v); }
  public GetMyComponentSWTypeGroups(): MyComponentTypeGroup[] { return this.myComponentSWTypeGroups; }
  public GetMyComponentTypeGroups(type: MyComponentTypeIDs): MyComponentTypeGroup[] { 
    return type == MyComponentTypeIDs.Software ? this.myComponentSWTypeGroups : this.myComponentPTypeGroups; 
  }
  public GetMyComponentPTypes(): MyComponentType[] { return Array.from(this.myComponentPTypeMap, ([k, v]) => v); }
  public GetMyComponentPTypeGroups(): MyComponentTypeGroup[] { return this.myComponentPTypeGroups; }
  public GetThreatActors(): ThreatActor[] { return this.threatActors; }
  public GetThreatCategoryGroups(): ThreatCategoryGroup[] { return this.threatCategoryGroups; }
  public GetThreatCategories(): ThreatCategory[] { return Array.from(this.threatCategoryMap, ([k, v]) => v); }
  public GetAttackVectorGroups(): AttackVectorGroup[] { return this.attackVectorGroups; }
  public GetAttackVectors(): AttackVector[] { return Array.from(this.attackVectorMap, ([k, v]) => v); }
  public GetThreatQuestions(): ThreatQuestion[] { return Array.from(this.threatQuestionMap, ([k, v]) => v); }
  public GetThreatRuleGroups(): ThreatRuleGroup[] { return this.threatRuleGroups; }
  public GetThreatRules(): ThreatRule[] { return Array.from(this.threatRuleMap, ([k, v]) => v); }

  public GetControlGroups(): ControlGroup[] { return this.controlGroups; }
  public GetControls(): Control[] { return Array.from(this.controlMap, ([k, v]) => v); }
  public GetRequirementTypes(): RequirementType[] { return this.requirementTypes; }
  public GetChecklistTypes(): ChecklistType[] { return this.checklistTypes; }

  constructor(data) {
    super(data);

    if (!this.Data['Name']) this.Data['Name'] = 'New Configuration';
    if (!this.Data['Version']) this.Data['Version'] = FileUpdateService.ConfigVersion;

    if (!this.Data['threatLibraryID']) {
      let lib = this.CreateAttackVectorGroup(null);
      lib.Name = 'Threat Library';
      this.Data['threatLibraryID'] = lib.ID; 
    }

    if (!this.Data['DFDthreatRuleGroupsID']) {
      let lib = this.CreateThreatRuleGroup(null);
      lib.Name = 'CPDFD Rules';
      lib.RuleType = ThreatRuleTypes.DFD;
      this.Data['DFDthreatRuleGroupsID'] = lib.ID; 
    }
    
    if (!this.Data['stencilThreatRuleGroupsID']) {
      let lib = this.CreateThreatRuleGroup(null);
      lib.Name = 'Stencil Rules';
      lib.RuleType = ThreatRuleTypes.Stencil;
      this.Data['stencilThreatRuleGroupsID'] = lib.ID; 
    }
    if (!this.Data['componentThreatRuleGroupsID']) {
      let lib = this.CreateThreatRuleGroup(null);
      lib.Name = 'Component Rules';
      lib.RuleType = ThreatRuleTypes.Component;
      this.Data['componentThreatRuleGroupsID'] = lib.ID; 
    }

    if (!this.Data['assetGroupID']) {
      let ag = this.CreateAssetGroup(null);
      ag.Name = 'Asset Groups';
      this.Data['assetGroupID'] = ag.ID; 
    }

    if (!this.Data['controlLibraryID']) {
      let lib = this.CreateControlGroup(null);
      lib.Name = 'Controls';
      this.Data['controlLibraryID'] = lib.ID;
    }
  }

  public GetAssetGroup(ID: string) {
    return this.assetGroups.find(x => x.ID == ID);
  }

  public CreateAssetGroup(parentGroup: AssetGroup): AssetGroup {
    let res = new AssetGroup({}, null, this);
    this.assetGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Asset Group', this.assetGroups.map(x => x.Name));
    if (parentGroup != null) parentGroup.AddAssetGroup(res);
    return res;
  }

  public DeleteAssetGroup(group: AssetGroup) {
    const index = this.assetGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      this.assetGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public GetMyData(ID: string) {
    return this.myData.find(x => x.ID == ID);
  }

  public CreateMyData(asset: AssetGroup): MyData {
    let res = new MyData({}, null, this);
    if (asset) asset.AddMyData(res);
    this.myData.push(res);
    res.Name = StringExtension.FindUniqueName('Data', this.GetMyDatas().map(x => x.Name));
    return res;
  }

  public DeleteMyData(data: MyData): boolean {
    const index = this.myData.indexOf(data);
    if (index >= 0) {
      data.OnDelete(this.ProjectFile, this);
      this.myData.splice(index, 1);
    }
    return index >= 0;
  }

  public GetStencilType(ID: string) {
    return this.stencilTypeMap.get(ID);
  }

  public CreateStencilType(typeID: ElementTypeIDs): StencilType {
    let res = new StencilType({}, this);
    res.ElementTypeID = typeID;
    res.Name = ElementTypeUtil.Constructor(typeID).GetDefaultType(this).Name; 
    this.stencilTypeMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName(res.Name, this.GetStencilTypes().map(x => x.Name));
    return res;
  }

  public DeleteStencilType(st: StencilType) {
    if (this.stencilTypeMap.has(st.ID)) {
      st.OnDelete(this.ProjectFile, this);
      this.stencilTypeMap.delete(st.ID);
      return true;
    }
    return false;
  }

  public GetStencilElementType(stencil: StencilType) {
    if (!stencil) return null;
    return this.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == stencil.ElementTypeID);
  }

  // todo is this function still necessary after converting stenciltype to class?
  public GetAllStencilProperties(stencil: StencilType): IProperty[] {
    if (!stencil) return null;
    let res = [];
    if (stencil.Properties) res.push(...stencil.Properties);
    if (!stencil.IsDefault && this.GetStencilElementType(stencil).Properties) res.push(...this.GetStencilElementType(stencil).Properties);
    if (stencil.ElementTypeID == ElementTypeIDs.DataFlow) res.push(...Protocol.GetDefaultType(this).Properties);
    return res;
  }

  public MoveItemInStencilTypes(prevIndex: number, currIndex: number) {
    this.moveItemInMap<StencilType>('stencilTypeMap', prevIndex, currIndex);
  }

  public GetStencilTypeTemplate(ID: string) {
    return this.stencilTypeTemplates.find(x => x.ID == ID);
  }

  public CreateStencilTypeTemplate(): StencilTypeTemplate {
    let res = new StencilTypeTemplate({}, this);
    this.stencilTypeTemplates.push(res);
    res.Name = StringExtension.FindUniqueName('Template', this.GetStencilTypeTemplates().map(x => x.Name));
    return res;
  }

  public DeleteStencilTypeTemplate(stt: StencilTypeTemplate) {
    const index = this.stencilTypeTemplates.indexOf(stt);
    if (index >= 0) {
      stt.OnDelete(this.ProjectFile, this);
      this.stencilTypeTemplates.splice(index, 1);
    }
    return index >= 0;
  }

  public GetStencilThreatMnemonic(ID: string) {
    return this.stencilThreatMnemonics.find(x => x.ID == ID);
  }

  public CreateStencilThreatMnemonic(): StencilThreatMnemonic {
    let res = new StencilThreatMnemonic({}, this);
    this.stencilThreatMnemonics.push(res);
    res.Name = StringExtension.FindUniqueName('Mnemonic', this.GetStencilThreatMnemonics().map(x => x.Name));
    return res;
  }

  public DeleteStencilThreatMnemonic(stm: StencilThreatMnemonic) {
    const index = this.stencilThreatMnemonics.indexOf(stm);
    if (index >= 0) {
      stm.OnDelete(this.ProjectFile, this);
      this.stencilThreatMnemonics.splice(index, 1);
    }
    return index >= 0;
  }

  public GetProtocol(ID: string) {
    return this.protocolMap.get(ID);
  }

  public CreateProtocol(): Protocol {
    let res = new Protocol({}, this);
    this.protocolMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Protocol', this.GetProtocols().map(x => x.Name));
    return res;
  }

  public DeleteProtocol(p: Protocol) {
    if (this.protocolMap.has(p.ID)) {
      p.OnDelete(this.ProjectFile, this);
      this.protocolMap.delete(p.ID);
      return true;
    }
    return false;
  }

  public MoveItemInProtocols(prevIndex: number, currIndex: number) {
    this.moveItemInMap<Protocol>('protocolMap', prevIndex, currIndex);
  }

  public GetMyComponentTypeGroup(ID: string) {
    let res = this.myComponentSWTypeGroups.find(x => x.ID == ID);
    if (!res) res = this.myComponentPTypeGroups.find(x => x.ID == ID);
    return res;
  }

  public CreateMyComponentTypeGroup(type: MyComponentTypeIDs): MyComponentTypeGroup {
    let res = new MyComponentTypeGroup({}, this);
    res.ComponentTypeID = type;
    let arr = type == MyComponentTypeIDs.Software ? this.myComponentSWTypeGroups : this.myComponentPTypeGroups;
    res.Name = StringExtension.FindUniqueName('Component Type Group', arr.map(x => x.Name));
    arr.push(res);
    return res;
  }

  public DeleteMyComponentTypeGroup(group: MyComponentTypeGroup) {
    let arr = group.ComponentTypeID == MyComponentTypeIDs.Software ? this.myComponentSWTypeGroups : this.myComponentPTypeGroups;
    const index = arr.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      arr.splice(index, 1);
    }
    return index >= 0;
  }

  public GetMyComponentType(ID: string): MyComponentType {
    if (this.myComponentSWTypeMap.has(ID)) return this.myComponentSWTypeMap.get(ID);
    if (this.myComponentPTypeMap.has(ID)) return this.myComponentPTypeMap.get(ID);
  }

  public CreateMyComponentType(group: MyComponentTypeGroup): MyComponentType {
    let res = new MyComponentType({}, this);
    group.AddMyComponentType(res);
    res.ComponentTypeID = group.ComponentTypeID;
    if (group.ComponentTypeID == MyComponentTypeIDs.Software) this.myComponentSWTypeMap.set(res.ID, res);
    else this.myComponentPTypeMap.set(res.ID, res);

    res.Name = StringExtension.FindUniqueName('Component Type', this.GetMyComponentTypes(group.ComponentTypeID).map(x => x.Name));
    return res;
  }

  public DeleteMyComponentType(t: MyComponentType): boolean {
    let arr = t.ComponentTypeID == MyComponentTypeIDs.Software ? this.myComponentSWTypeMap : this.myComponentPTypeMap;
    if (arr.has(t.ID)) {
      t.OnDelete(this.ProjectFile, this);
      arr.delete(t.ID);
      return true;
    }
    return false;
  }

  public FindGroupOfMyComponent(c: MyComponentType): MyComponentTypeGroup {
    if (c.ComponentTypeID == MyComponentTypeIDs.Software) return this.myComponentSWTypeGroups.find(x => x.Types.some(y => y.ID == c.ID));
    else return this.myComponentPTypeGroups.find(x => x.Types.some(y => y.ID == c.ID));
  }

  // public MoveItemInMyComponentSWTypes(prevIndex: number, currIndex: number) {
  //   this.moveItemInMap<MyComponentType>('myComponentSWTypeMap', prevIndex, currIndex);
  // }

  // public MoveItemInMyComponentPTypes(prevIndex: number, currIndex: number) {
  //   this.moveItemInMap<MyComponentType>('myComponentPTypeMap', prevIndex, currIndex);
  // }

  public GetThreatActor(ID: string) {
    return this.threatActors.find(x => x.ID == ID);
  }

  public CreateThreatActor() {
    let res = new ThreatActor({}, this);
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

  public GetThreatCategory(ID: string) {
    return this.threatCategoryMap.get(ID);
  }

  public CreateThreatCategory(): ThreatCategory {
    let res = new ThreatCategory({}, this);
    this.threatCategoryMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Threat Category', this.GetThreatCategories().map(x => x.Name));
    return res;
  }

  public DeleteThreatCategory(cat: ThreatCategory) {
    if (this.threatCategoryMap.has(cat.ID)) {
      cat.OnDelete(this.ProjectFile, this);
      this.stencilTypeMap.delete(cat.ID);
      return true;
    }
    return false;
  }

  public FindGroupOfThreatCategory(cat: ThreatCategory): ThreatCategoryGroup {
    return this.threatCategoryGroups.find(x => x.ThreatCategories.some(y => y.ID == cat.ID));
  }

  public GetThreatCategoryGroup(ID: string) {
    return this.threatCategoryGroups.find(x => x.ID == ID);
  }

  public CreateThreatCategoryGroup(): ThreatCategoryGroup {
    let res = new ThreatCategoryGroup({}, this);
    this.threatCategoryGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Group', this.GetThreatCategoryGroups().map(x => x.Name));
    return res;
  }

  public DeleteThreatCategoryGroup(group: ThreatCategoryGroup) {
    const index = this.threatCategoryGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      this.threatCategoryGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public GetAttackVectorGroup(ID: string) {
    return this.attackVectorGroups.find(x => x.ID == ID);
  }

  public CreateAttackVectorGroup(parentGroup: AttackVectorGroup): AttackVectorGroup {
    let res = new AttackVectorGroup({}, this);
    this.attackVectorGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Attack Vector Group', this.attackVectorGroups.map(x => x.Name));
    if (parentGroup != null) parentGroup.AddAttackVectorGroup(res);
    return res;
  }

  public DeleteAttackVectorGroup(group: AttackVectorGroup) {
    const index = this.attackVectorGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      this.attackVectorGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public FindGroupOfAttackVectorGroup(group: AttackVectorGroup): AttackVectorGroup {
    return this.attackVectorGroups.find(x => x.SubGroups.some(y => y.ID == group.ID));
  }

  public GetAttackVector(ID: string) {
    return this.attackVectorMap.get(ID);
  }

  public CreateAttackVector(group: AttackVectorGroup): AttackVector {
    let res = new AttackVector({}, this);
    if (group) group.AddAttackVector(res);
    this.attackVectorMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Attack Vector', this.GetAttackVectors().map(x => x.Name));
    return res;
  }

  public DeleteAttackVector(o: AttackVector): boolean {
    if (this.attackVectorMap.has(o.ID)) {
      o.OnDelete(this.ProjectFile, this);
      this.attackVectorMap.delete(o.ID);
      return true;
    }
    return false;
  }

  public FindGroupOfAttackVector(o: AttackVector): AttackVectorGroup {
    return this.attackVectorGroups.find(x => x.AttackVectors.some(y => y.ID == o.ID));
  }

  public GetThreatQuestion(ID: string) {
    return this.threatQuestionMap.get(ID);
  }

  public CreateThreatQuestion(): ThreatQuestion {
    let res = new ThreatQuestion({}, this);
    this.threatQuestionMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Question', this.GetThreatQuestions().map(x => x.Name));
    return res;
  }

  public DeleteThreatQuestion(q: ThreatQuestion): boolean {
    if (this.threatQuestionMap.has(q.ID)) {
      q.OnDelete(this.ProjectFile, this);
      this.threatQuestionMap.delete(q.ID);
      return true;
    }
    return false;
  }

  public MoveItemInThreatQuestions(prevIndex: number, currIndex: number) {
    this.moveItemInMap<ThreatQuestion>('threatQuestionMap', prevIndex, currIndex);
  }

  public GetThreatRuleGroup(ID: string) {
    return this.threatRuleGroups.find(x => x.ID == ID);
  }

  public CreateThreatRuleGroup(parentGroup: ThreatRuleGroup): ThreatRuleGroup {
    let res = new ThreatRuleGroup({}, this);
    this.threatRuleGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Threat Rule Group', this.threatRuleGroups.map(x => x.Name));
    if (parentGroup != null) parentGroup.AddThreatRuleGroup(res);
    return res;
  }

  public DeleteThreatRuleGroup(group: ThreatRuleGroup) {
    const index = this.threatRuleGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      this.threatRuleGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public FindGroupOfThreatRuleGroup(group: ThreatRuleGroup): ThreatRuleGroup {
    return this.threatRuleGroups.find(x => x.SubGroups.some(y => y.ID == group.ID));
  }

  public GetThreatRule(ID: string) {
    return this.threatRuleMap.get(ID);
  }

  public CreateThreatRule(group: ThreatRuleGroup, type: ThreatRuleTypes): ThreatRule {
    let res = new ThreatRule({}, this);
    res.RuleType = type;
    if (group) group.AddThreatRule(res);
    this.threatRuleMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Threat Rule', this.GetThreatRules().map(x => x.Name));
    return res;
  }

  public DeleteThreatRule(r: ThreatRule): boolean {
    if (this.threatRuleMap.has(r.ID)) {
      r.OnDelete(this.ProjectFile, this);
      this.threatRuleMap.delete(r.ID);
      return true;
    }
    return false;
  }

  public FindGroupOfThreatRule(r: ThreatRule): ThreatRuleGroup {
    return this.threatRuleGroups.find(x => x.ThreatRules.some(y => y.ID == r.ID));
  }

  public MoveItemInThreatRules(prevIndex: number, currIndex: number) {
    this.moveItemInMap<ThreatRule>('threatRuleMap', prevIndex, currIndex);
  }

  public GetControl(ID: string) {
    return this.controlMap.get(ID);
  }

  public CreateControl(group: ControlGroup): Control {
    let res = new Control({}, this);
    if (group) group.AddControl(res);
    this.controlMap.set(res.ID, res);
    res.Name = StringExtension.FindUniqueName('Control', this.GetControls().map(x => x.Name));
    return res;
  }

  public DeleteControl(m: Control): boolean {
    if (this.controlMap.has(m.ID)) {
      m.OnDelete(this.ProjectFile, this);
      this.controlMap.delete(m.ID);
      return true;
    }
    return false;
  }

  public FindGroupOfControl(mit: Control): ControlGroup {
    return this.controlGroups.find(x => x.Controls.some(y => y.ID == mit.ID));
  }

  public GetControlGroup(ID: string) {
    return this.controlGroups.find(x => x.ID == ID);
  }

  public CreateControlGroup(parentGroup: ControlGroup): ControlGroup {
    let res = new ControlGroup({}, this);
    this.controlGroups.push(res);
    res.Name = StringExtension.FindUniqueName('Control Group', this.controlGroups.map(x => x.Name));
    if (parentGroup != null) parentGroup.AddControlGroup(res);
    return res;
  }

  public DeleteControlGroup(group: ControlGroup) {
    const index = this.controlGroups.indexOf(group);
    if (index >= 0) {
      group.OnDelete(this.ProjectFile, this);
      this.controlGroups.splice(index, 1);
    }
    return index >= 0;
  }

  public FindGroupOfControlGroup(mit: ControlGroup): ControlGroup {
    if (this.ControlLibrary.SubGroups.includes(mit)) return this.ControlLibrary;
    return this.controlGroups.find(x => x.SubGroups.some(y => y.ID == mit.ID));
  }

  public GetRequirementType(ID: string) {
    return this.requirementTypes.find(x => x.ID == ID);
  }

  public CreateRequirementType(): RequirementType {
    let res = new RequirementType({}, this);
    this.requirementTypes.push(res);
    res.Name = StringExtension.FindUniqueName('Requirement', this.GetRequirementTypes().map(x => x.Name));
    return res;
  }

  public DeleteRequirementType(type: RequirementType): boolean {
    const index = this.requirementTypes.indexOf(type);
    if (index >= 0) {
      type.OnDelete(this.ProjectFile, this);
      this.requirementTypes.splice(index, 1);
    }
    return index >= 0;
  }

  public GetChecklistType(ID: string) {
    return this.checklistTypes.find(x => x.ID == ID);
  }

  public CreateChecklistType(): ChecklistType {
    let res = new ChecklistType({}, this);
    this.checklistTypes.push(res);
    res.Name = StringExtension.FindUniqueName('Checklist', this.GetChecklistTypes().map(x => x.Name));
    return res;
  }

  public DeleteChecklistType(type: ChecklistType): boolean {
    const index = this.checklistTypes.indexOf(type);
    if (index >= 0) {
      type.OnDelete(this.ProjectFile, this);
      this.checklistTypes.splice(index, 1);
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

  public ToJSON(): IConfigFile {
    let res: IConfigFile = {
      Data: this.Data,
      assetGroups: [],
      myData: [],

      stencilTypes: [],
      stencilTypeTemplates: [],
      stencilThreatMnemonics: [],
      protocols: [],
      myComponentSWTypes: [],
      myComponentSWTypeGroups: [],
      myComponentPTypes: [],
      myComponentPTypeGroups: [],

      threatActors: [],
      threatCategoryGroups: [],
      threatCategories: [],
      attackVectorGroups: [],
      attackVectors: [],
      threatQuestions: [],
      threatRuleGroups: [],
      threatRules: [],

      controls: [],
      controlGroups: [],

      requirementTypes: [],
      checklistTypes: []
    };

    this.assetGroups.forEach(x => res.assetGroups.push(x.ToJSON()));
    this.myData.forEach(x => res.myData.push(x.ToJSON()));
    this.stencilTypeMap.forEach(x => res.stencilTypes.push(x.ToJSON()));
    this.stencilTypeTemplates.forEach(x => res.stencilTypeTemplates.push(x.ToJSON()));
    this.stencilThreatMnemonics.forEach(x => res.stencilThreatMnemonics.push(x.ToJSON()));
    this.protocolMap.forEach(x => res.protocols.push(x.ToJSON()));
    this.myComponentSWTypeMap.forEach(x => res.myComponentSWTypes.push(x.ToJSON()));
    this.myComponentSWTypeGroups.forEach(x => res.myComponentSWTypeGroups.push(x.ToJSON()));
    this.myComponentPTypeMap.forEach(x => res.myComponentPTypes.push(x.ToJSON()));
    this.myComponentPTypeGroups.forEach(x => res.myComponentPTypeGroups.push(x.ToJSON()));
    this.threatActors.forEach(x => res.threatActors.push(x.ToJSON()));
    this.threatCategoryGroups.forEach(x => res.threatCategoryGroups.push(x.ToJSON()));
    this.threatCategoryMap.forEach(x => res.threatCategories.push(x.ToJSON()));
    this.attackVectorGroups.forEach(x => res.attackVectorGroups.push(x.ToJSON()));
    this.attackVectorMap.forEach(x => res.attackVectors.push(x.ToJSON()));
    this.threatQuestionMap.forEach(x => res.threatQuestions.push(x.ToJSON()));
    this.threatRuleGroups.forEach(x => res.threatRuleGroups.push(x.ToJSON()));
    this.threatRuleMap.forEach(x => res.threatRules.push(x.ToJSON()));
    this.controlGroups.forEach(x=> res.controlGroups.push(x.ToJSON()));
    this.controlMap.forEach(x => res.controls.push(x.ToJSON()));
    this.requirementTypes.forEach(x => res.requirementTypes.push(x.ToJSON()));
    this.checklistTypes.forEach(x => res.checklistTypes.push(x.ToJSON()));

    return res;
  }

  public static FromJSON(val): ConfigFile {
    let res = new ConfigFile(val.Data);

    val.assetGroups.forEach(x => res.assetGroups.push(AssetGroup.FromJSON(x, null, res)));
    val.myData.forEach(x => res.myData.push(MyData.FromJSON(x, null, res)));
    val.stencilTypes.forEach(x => res.stencilTypeMap.set(x['ID'], StencilType.FromJSON(x, res)));
    val.stencilTypeTemplates.forEach(x => res.stencilTypeTemplates.push(StencilTypeTemplate.FromJSON(x, res)));
    val.stencilThreatMnemonics?.forEach(x => res.stencilThreatMnemonics.push(StencilThreatMnemonic.FromJSON(x, res)));
    val.protocols.forEach(x => res.protocolMap.set(x['ID'], Protocol.FromJSON(x, res)));
    val.myComponentSWTypes.forEach(x => res.myComponentSWTypeMap.set(x['ID'], MyComponentType.FromJSON(x, res)));
    val.myComponentSWTypeGroups.forEach(x => res.myComponentSWTypeGroups.push(MyComponentTypeGroup.FromJSON(x, res)));
    val.myComponentPTypes.forEach(x => res.myComponentPTypeMap.set(x['ID'], MyComponentType.FromJSON(x, res)));
    val.myComponentPTypeGroups.forEach(x => res.myComponentPTypeGroups.push(MyComponentTypeGroup.FromJSON(x, res)));
    val.threatActors?.forEach(x => res.threatActors.push(ThreatActor.FromJSON(x, res)));
    val.threatCategories.forEach(x => res.threatCategoryMap.set(x['ID'], ThreatCategory.FromJSON(x, res)));
    val.threatCategoryGroups.forEach(x => res.threatCategoryGroups.push(ThreatCategoryGroup.FromJSON(x, res)));
    val.attackVectorGroups.forEach(x => res.attackVectorGroups.push(AttackVectorGroup.FromJSON(x, res)));
    val.attackVectors.forEach(x => res.attackVectorMap.set(x['ID'], AttackVector.FromJSON(x, res)));
    val.threatQuestions.forEach(x => res.threatQuestionMap.set(x['ID'], ThreatQuestion.FromJSON(x, res)));
    val.threatRuleGroups.forEach(x => res.threatRuleGroups.push(ThreatRuleGroup.FromJSON(x, res)));
    val.threatRules.forEach(x => res.threatRuleMap.set(x['ID'], ThreatRule.FromJSON(x, res)));
    val.controlGroups?.forEach(x => res.controlGroups.push(ControlGroup.FromJSON(x, res)));
    val.controls?.forEach(x => res.controlMap.set(x['ID'], Control.FromJSON(x, res)));
    val.requirementTypes?.forEach(x => res.requirementTypes.push(RequirementType.FromJSON(x, res)));
    val.checklistTypes?.forEach(x => res.checklistTypes.push(ChecklistType.FromJSON(x, res)));

    return res;
  }

  public static DefaultFile(): ConfigFile {
    let res = ConfigFile.FromJSON(JSON.parse(JSON.stringify(defaultConfig)));

    return res;
  }
}