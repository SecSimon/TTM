import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LowMediumHighNumberUtil, LowMediumHighNumber } from '../../model/assets';
import { MyComponentType } from '../../model/component';
import { IProperty, PropertyEditTypes } from '../../model/database';
import { ElementTypeIDs, ElementTypeUtil, Protocol, StencilType } from '../../model/dfd-model';
import { Control } from '../../model/mitigations';
import { RestrictionUtil, IDetailRestriction, IPropertyRestriction, RestrictionTypes, RestrictionTypesUtil, RuleTypes, ThreatCategoryGroup, AttackVectorGroup, ThreatRule, RuleGenerationTypsUtil as RuleGenerationTypesUtil, RuleGenerationTypes, AttackVector, PropertyComparisonTypes, ThreatRuleGroup, ThreatSeverities, ThreatSeverityUtil } from '../../model/threat-model';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

export interface IPropertyGroup {
  GroupName: string;
  Properties: IProperty[];
}

@Component({
  selector: 'app-threat-rule',
  templateUrl: './threat-rule.component.html',
  styleUrls: ['./threat-rule.component.scss']
})
export class ThreatRuleComponent implements OnInit {
  private _threatRule: ThreatRule;

  @Input() public node: INavigationNode;
  public get threatRule(): ThreatRule { return this._threatRule; }
  @Input() public set threatRule(val: ThreatRule) { 
    this._threatRule = val;
    this.selectedRestriction = null; 
    this.propertyGroups = {};
    this.phyPropertyGroups = {};
    this.interfacePropertyGroups = null;
    this.threatRuleGroups = {};
    this.selectedControl = null;
  }
  @Input() public canEdit: boolean = true;
  @Input() public canEditName: boolean = false;
  @Input() public showAttackVector = true;
  
  public get selectedStencilType(): StencilType { 
    if (this.threatRule?.StencilRestriction?.stencilTypeID) { return this.dataService.Config.GetStencilType(this.threatRule.StencilRestriction.stencilTypeID); }
  }
  public get selectedStencilElementType(): StencilType { return this.selectedStencilType?.ElementTypeID ? this.dataService.Config.GetStencilElementType(this.selectedStencilType) : null; }
  public get selectedComponentType(): MyComponentType { 
    if (this.threatRule?.ComponentRestriction?.componentTypeID) { return this.dataService.Config.GetMyComponentType(this.threatRule.ComponentRestriction.componentTypeID); }
  }
  public get selectedProtocol(): Protocol { 
    if (this.threatRule?.ProtocolRestriction?.protocolID) { return this.dataService.Config.GetProtocol(this.threatRule.ProtocolRestriction.protocolID); }
  }
  
  public selectedRestriction: IPropertyRestriction;

  public selectedControl: Control;

  constructor(@Optional() rule: ThreatRule, public theme: ThemeService, public dataService: DataService, private dialog: DialogService, private translate: TranslateService) { 
    if (rule) {
      this.threatRule = rule;
      this.canEdit = false;
    }
  }

  ngOnInit(): void {
  }

  public OnAttackVectorChanged(Vector: AttackVector) {
    this.threatRule.ThreatCategories = Vector?.ThreatCategories;
  }

  public GetAttackVectorGroups(): AttackVectorGroup[] {
    return this.dataService.Config.GetAttackVectorGroups().filter(x => x.AttackVectors.length > 0);
  }
  public GetThreatCategoryGroups(): ThreatCategoryGroup[] {
    return this.dataService.Config.GetThreatCategoryGroups().filter(x => x.ThreatCategories.length > 0);
  }

  private threatRuleGroups = {};
  public GetAvailableThreatRuleGroups() {
    if (!this.threatRuleGroups[this.threatRule.RuleType]) {
      let groups = [];
      if (this.threatRule.RuleType == RuleTypes.Stencil) {
        let g = {
          Name: this.translate.instant('properties.StencilRules'),
          ThreatRules: this.dataService.Config.GetThreatRules().filter(x => x.RuleType == RuleTypes.Stencil && x.ID != this.threatRule.ID)
        };
        groups.push(g);
      }
      else if (this.threatRule.RuleType == RuleTypes.Component) {
        let g = {
          Name: this.translate.instant('properties.ComponentRules'),
          ThreatRules: this.dataService.Config.GetThreatRules().filter(x => x.RuleType == RuleTypes.Component && x.ID != this.threatRule.ID)
        };
        groups.push(g);
      }
      else {
        let pushSubGroups = (group: ThreatRuleGroup) => {
          if (group.ThreatRules?.length > 0) {
            groups.push({ Name: group.Name, ThreatRules: group.ThreatRules.filter(x => x.RuleType == RuleTypes.DFD && x.ID != this.threatRule.ID) });
          }
          if (group.SubGroups?.length > 0) {
            group.SubGroups.forEach(x => pushSubGroups(x));
          }
        };
        pushSubGroups(this.dataService.Config.DFDThreatRuleGroups);
      }
      
      this.threatRuleGroups[this.threatRule.RuleType] = groups;
    }

    return this.threatRuleGroups[this.threatRule.RuleType];
  }

  public AddStencilRestriction() {
    this.threatRule.StencilRestriction.DetailRestrictions.push({ IsOR: true, Layer: 0, RestType: RestrictionTypes.Property, PropertyRest: { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: null }});
  }

  public RemoveStencilRestriction(index: number) {
    this.threatRule.StencilRestriction.DetailRestrictions.splice(index, 1);
  }

  public AddComponentRestriction() {
    this.threatRule.ComponentRestriction.DetailRestrictions.push({ IsOR: true, Layer: 0, RestType: RestrictionTypes.Property, PropertyRest: { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: false }});
  }

  public RemoveComponentRestriction(index: number) {
    this.threatRule.ComponentRestriction.DetailRestrictions.splice(index, 1);
  }

  public AddProtocolRestriction() {
    this.threatRule.ProtocolRestriction.DetailRestrictions.push({ IsOR: true, Layer: 0, RestType: RestrictionTypes.Property, PropertyRest: { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: false }});
  }

  public RemoveProtocolRestriction(index: number) {
    this.threatRule.ProtocolRestriction.DetailRestrictions.splice(index, 1);
  }

  public HasPhysicalElement(): boolean {
    if (!this.selectedStencilType) return null;
    return !ElementTypeUtil.IsPhysical(this.selectedStencilType.ElementTypeID);
  }

  public EditAttackVector() {
    this.dialog.OpenViewAttackVectorDialog(this.threatRule.AttackVector, true);
  }

  public AddAttackVector() {
    let vector = this.dataService.Config.CreateAttackVector(null);
    this.dialog.OpenAddAttackVectorDialog(vector).subscribe(res => {
      if (res) {
        this.threatRule.AttackVector = vector;
        this.threatRule.ThreatCategories = vector.ThreatCategories;
      }
      else {
        this.dataService.Config.DeleteAttackVector(vector);
      }
    });
  }

  public AddDFDNode(index: number) {
    this.threatRule.DFDRestriction.NodeTypes.splice(index, 0, { TypeIDs: [] });
    this.propertyGroups = {};
  }

  public RemoveDFDNode(index: number, typeSelect) {
    setTimeout(() => {
      typeSelect.close();
    }, 10);
    
    this.threatRule.DFDRestriction.NodeTypes.splice(index, 1);
    this.propertyGroups = {};
  }

  public AddDFDNodeRestriction() {
    this.threatRule.DFDRestriction.NodeRestrictions.push({Layer: 0, NodeNumber: -1, IsOR: false, RestType: RestrictionTypes.Property, PropertyRest: { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: null } });
  }

  public RemoveDFDNodeRestriction(index: number) {
    this.threatRule.DFDRestriction.NodeRestrictions.splice(index, 1);
  }

  public GetLayerPadding(rest: IDetailRestriction) {
    return (rest.Layer * 20).toString() + 'px';
  }

  public GetRuleElements() {
    let res = ['Data Flow', 'Sender'];
    for (let i = 0; i < this.threatRule.DFDRestriction.NodeTypes.length - 2; i++) {
      res.push('Node' + (i+1).toString());
    }
    res.push('Receiver');
    return res;
  }

  public OnNextComparisonType(rest: IDetailRestriction, propRest: IPropertyRestriction) {
    let vals = Object.values(PropertyComparisonTypes);
    let max = vals.length;
    if (this.GetPropertyEditType(rest) == PropertyEditTypes.CheckBox) max = 2;
    propRest.ComparisonType = vals[(vals.indexOf(propRest.ComparisonType)+1) % max] as PropertyComparisonTypes;
  }

  public GetPropertyEditType(rest: IDetailRestriction): PropertyEditTypes {
    let findProp = (propsArr: IProperty[][], pName: string) => {
      for (let i = 0; i < propsArr.length ; i++) {
        let prop = propsArr[i]['Properties'].find(x => x.ID == pName);
        if (prop) return prop;
      }
    };

    let prop;
    if (this.threatRule.RuleType == RuleTypes.Stencil) {
      if (rest.RestType == RestrictionTypes.Property) {
        prop = findProp(this.propertyGroups[-2], rest.PropertyRest?.ID);
      }
      else if (rest.RestType == RestrictionTypes.PhysicalElement) {
        prop = findProp(this.phyPropertyGroups[ElementTypeUtil.GetPhyiscalID(this.selectedStencilType.ElementTypeID)], rest.PhyElementRest?.Property?.ID);
      }
    }
    else if (this.threatRule.RuleType == RuleTypes.Component) {
      if (rest.RestType == RestrictionTypes.Property) {
        prop = findProp(this.propertyGroups[-2], rest.PropertyRest?.ID);
      }
    }
    else if (rest.RestType == RestrictionTypes.Property) {
      prop = findProp(this.propertyGroups[rest.NodeNumber], rest.PropertyRest?.ID);
    }
    else if (rest.RestType == RestrictionTypes.PhysicalElement) {
      prop = findProp(this.phyPropertyGroups[rest.NodeNumber], rest.PhyElementRest.Property.ID);
    }
    else if (rest.RestType == RestrictionTypes.SenderInterface) {
      prop = findProp(this.interfacePropertyGroups, rest.SenderInterfaceRestriction.Property.ID);
    }
    else if (rest.RestType == RestrictionTypes.ReceiverInterface) {
      prop = findProp(this.interfacePropertyGroups, rest.ReceiverInterfaceRestriction.Property.ID);
    }
    return prop?.Type;
  }

  public propertyGroups = {};
  public GetAvailablePropertyGroups(rest: IDetailRestriction): IPropertyGroup[] {
    let index = this.threatRule.RuleType == RuleTypes.DFD ? rest.NodeNumber : -2;

    if (this.propertyGroups[index] == null) {
      this.propertyGroups[index] = this.GetPropertyGroups(rest);
    }
    return this.propertyGroups[index];
  }

  public GetPropertyGroups(rest: IDetailRestriction): IPropertyGroup[] {
    if (this.threatRule.RuleType == RuleTypes.Stencil) {
      let type = this.selectedStencilType;
      if (type) {
        let g: IPropertyGroup = {
          GroupName: type.Name + "'s " + this.translate.instant('general.Properties'),
          Properties: this.dataService.Config.GetAllStencilProperties(type)
        };
        return [g];
      }
    }
    else if (this.threatRule.RuleType == RuleTypes.Component) {
      let type = this.selectedComponentType;
      if (type) {
        let g: IPropertyGroup = {
          GroupName: type.Name + "'s " + this.translate.instant('general.Properties'),
          Properties: type.Properties
        };
        return [g];
      }
    }

    if (rest.NodeNumber == -1) { // properties of a data flow
      return [ 
        { 
          GroupName: "Data Flow's " + this.translate.instant('general.Properties'),
          Properties: this.dataService.Config.GetAllStencilProperties(this.dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == ElementTypeIDs.DataFlow))
        }
      ];
    }

    if (this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs.length == 0) return []; // no type specified

    if (this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs.length > 1) { // more than one type specified
      // find common properties and properties for each type
      let res: IPropertyGroup[] = [];
      let common: IPropertyGroup = {
        GroupName: this.translate.instant('pages.config.commonProperties'),
        Properties: []
      };
      res.push(common);

      let types: StencilType[] = [];
      let typeProperties: IProperty[][] = [];
      this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs.forEach(x => types.push(this.dataService.Config.GetStencilType(x)));
      types.forEach(x => typeProperties.push(this.dataService.Config.GetAllStencilProperties(x)));
      
      let g: IPropertyGroup = {
        GroupName: types[0].Name + "'s " + this.translate.instant('general.Properties'),
        Properties: []
      };
      typeProperties[0].forEach(prop => {
        if (typeProperties.every(x => x.some(y => y.ID == prop.ID))) common.Properties.push(prop);
        else g.Properties.push(prop);
      });
      res.push(g);

      for (let i = 1; i < types.length; i++) {
        let g: IPropertyGroup = {
          GroupName: types[i].Name + "'s " + this.translate.instant('general.Properties'),
          Properties: []
        };
        typeProperties[i].forEach(prop => {
          if (!common.Properties.some(x => x.ID == prop.ID)) g.Properties.push(prop);
        });
        res.push(g);
      }

      res = res.filter(x => x.Properties.length > 0);
      return res;
    }
    else { // one type specified
      let type = this.dataService.Config.GetStencilType(this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs[0]);
      if (type) {
        let g: IPropertyGroup = {
          GroupName: type.Name + "'s " + this.translate.instant('general.Properties'),
          Properties: this.dataService.Config.GetAllStencilProperties(type)
        };
        return [g];
      }
    }

    return [];
  }

  public GetDataFlowEntityTypes(): StencilType[] {
    let res: StencilType[] = [];
    let validTypes = [ElementTypeIDs.LogProcessing, ElementTypeIDs.LogDataStore, ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity, ElementTypeIDs.PhysicalLink];
    validTypes.forEach(typeID => {
      res.push(...this.dataService.Config.GetStencilTypes().filter(x => x.IsDefault && x.ElementTypeID == typeID));
    });
    validTypes.forEach(typeID => {
      res.push(...this.dataService.Config.GetStencilTypes().filter(x => !x.IsDefault && x.ElementTypeID == typeID));
    });
    return res;
  }

  public SetPropertyDefaultValue(propRest: IPropertyRestriction, prop: IProperty) {
    propRest.ID = prop.ID;
    if (prop.DefaultValue != null) propRest.Value = prop.DefaultValue;
  }

  public CreatePropertyRestrictionType(rest: IDetailRestriction, type: RestrictionTypes) {
    let newProp: IPropertyRestriction = { ID: '', ComparisonType: PropertyComparisonTypes.Equals, Value: null };
    if (type == RestrictionTypes.DataFlowCrosses) {
      if (!rest.DataflowRest) rest.DataflowRest = { TrustAreaIDs: [] };
    }
    else if (type == RestrictionTypes.PhysicalElement) {
      if (!rest.PhyElementRest) rest.PhyElementRest = { Property: newProp };
    }
    else if (type == RestrictionTypes.Property) {
      if (!rest.PropertyRest) rest.PropertyRest = newProp;
    }
    else if (type == RestrictionTypes.SenderInterface) {
      if (!rest.SenderInterfaceRestriction) rest.SenderInterfaceRestriction = { Property: newProp };
    }
    else if (type == RestrictionTypes.ReceiverInterface) {
      if (!rest.ReceiverInterfaceRestriction) rest.ReceiverInterfaceRestriction = { Property: newProp };
    }
  }

  public GetAvailableTrustAreas(): StencilType[] {
    return this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == ElementTypeIDs.LogTrustArea || x.ElementTypeID == ElementTypeIDs.PhyTrustArea);
  }

  public phyPropertyGroups = {};
  public GetAvailablePhyElementPropertyGroups(rest: IDetailRestriction): IPropertyGroup[] {
    let phyID = null;
    if (this.threatRule.RuleType == RuleTypes.Stencil) {
      phyID = ElementTypeUtil.GetPhyiscalID(this.selectedStencilType.ElementTypeID);
    }
    else if (this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs.length == 1) {
      phyID = ElementTypeUtil.GetPhyiscalID(this.dataService.Config.GetStencilType(this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs[0]).ElementTypeID);
    }

    if (phyID) {
      if (this.phyPropertyGroups[phyID] == null) {
        let phyElement = this.dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == phyID);
        if (phyElement) {
          let g: IPropertyGroup = {
            GroupName: phyElement.Name + "'s " + this.translate.instant('general.Properties'),
            Properties: phyElement.Properties
          };
          this.phyPropertyGroups[phyID] = [g];
        }
      } 
      return this.phyPropertyGroups[phyID];
    }

    return [];
  }

  public interfacePropertyGroups = null;
  public GetAvailableInterfacePropertyGroups(rest: IDetailRestriction): IPropertyGroup[] {
    if (!this.interfacePropertyGroups) {
      this.interfacePropertyGroups = [ 
        { 
          GroupName: "Interface's " + this.translate.instant('general.Properties'),
          Properties: this.dataService.Config.GetAllStencilProperties(this.dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == ElementTypeIDs.Interface))
        }
      ];
    }
    return this.interfacePropertyGroups; 
  }

  public GetRuleGenerationTypes() {
    return RuleGenerationTypesUtil.GetTypes();
  }

  public GetRuleGenerationTypeName(rgt: RuleGenerationTypes) {
    return RuleGenerationTypesUtil.ToString(rgt);
  }

  public GetRestrictionString() {
    return RestrictionUtil.ToString(this.threatRule, this.dataService, this.translate);
  }

  public GetAvailableRestrictionsTypes(rest: IDetailRestriction): RestrictionTypes[] {
    if (this.threatRule.RuleType == RuleTypes.Stencil) {
      if (this.HasPhysicalElement()) return [RestrictionTypes.Property, RestrictionTypes.PhysicalElement];
      return [RestrictionTypes.Property];
    }
    if (this.threatRule.RuleType == RuleTypes.Component) {
      return [RestrictionTypes.Property];
    }
    // DFD Restriction
    if (rest.NodeNumber == -1) return [RestrictionTypes.Property, RestrictionTypes.DataFlowCrosses, RestrictionTypes.SenderInterface, RestrictionTypes.ReceiverInterface];
    if (this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs.length == 1 &&
      !ElementTypeUtil.IsPhysical(this.dataService.Config.GetStencilType(this.threatRule.DFDRestriction.NodeTypes[rest.NodeNumber].TypeIDs[0]).ElementTypeID)) return [RestrictionTypes.Property, RestrictionTypes.PhysicalElement];
    return [RestrictionTypes.Property];
  }

  public GetRestrictionTypeName(rt: RestrictionTypes): string {
    return RestrictionTypesUtil.ToString(rt);
  }

  public GetControls(): Control[] {
    return this.dataService.Config.GetControls().filter(x => x.MitigatedThreatRules.includes(this.threatRule));
  }

  public GetVectorControls(): Control[] {
    if (this.threatRule.AttackVector) {
      return this.dataService.Config.GetControls().filter(x => x.MitigatedAttackVectors.includes(this.threatRule.AttackVector));
    }
    return null;
  }

  public GetPossibleControls() {
    let res = this.dataService.Config.GetControls().filter(x => !x.MitigatedThreatRules.includes(this.threatRule));
    if (this.threatRule.AttackVector) res = res.filter(x => !x.MitigatedAttackVectors.includes(this.threatRule.AttackVector));
    return res;
  }

  public AddExistingControl(mit: Control) {
    mit.AddMitigatedThreatRule(this.threatRule);
  }

  public AddControl() {
    let mit = this.dataService.Config.CreateControl(this.dataService.Config.ControlLibrary);
    mit.AddMitigatedThreatRule(this.threatRule);
    this.selectedControl = mit;
  }

  public RemoveControl(mit: Control) {
    mit.RemoveMitigatedThreatRule(this.threatRule);
    if (mit == this.selectedControl) this.selectedControl = null;
  }

  public DeleteControl(mit: Control) {
    this.dataService.Config.DeleteControl(mit);
    if (mit == this.selectedControl) this.selectedControl = null;
  }  
  
  public dropControl(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetControls().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetControls().indexOf(selectedArray[event.currentIndex]);
    moveItemInArray(this.dataService.Config.GetControls(), prev, curr);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypes();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }

  public SetLWH(prop: IPropertyRestriction, val) {
    prop.Value = Number(val);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public GetIcon(type: StencilType) {
    return ElementTypeUtil.Icon(type.ElementTypeID);
  }
}
