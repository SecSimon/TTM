import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { TranslateService } from '@ngx-translate/core';
import { MyComponentType, MyComponentTypeGroup, MyComponentTypeIDs } from '../../model/component';
import { IProperty, PropertyEditTypes, PropertyEditTypesUtil } from '../../model/database';
import { OptionTypes, OptionTypesUtil, PropertyComparisonTypes, RestrictionTypes, RuleTypes, ThreatQuestion, ThreatRule } from '../../model/threat-model';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';
import { v4 as uuidv4 } from 'uuid';
import { LowMediumHighNumberUtil } from '../../model/assets';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface INewThreat {
  name: string;
  property: string;
  question: string;
  threatGen: boolean;
  yesResult: boolean;
}

@Component({
  selector: 'app-components',
  templateUrl: './components.component.html',
  styleUrls: ['./components.component.scss']
})
export class ComponentsComponent extends NavTreeBase implements OnInit {
  private _selectedQuestion;

  public newThreat: INewThreat = { name: '', question: '', property: '', threatGen: false, yesResult: true };

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input()
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.selectedQuestion = null;
    this.selectedProperty = null;
    this.selectedThreatRule = null;
  }

  @Input()
  public componentType: MyComponentTypeIDs;

  public get selectedComponentType(): MyComponentType { return this.selectedNode?.data; }

  public selectedProperty: IProperty;

  public get typeThreats(): ThreatRule[] {
    if (!this.selectedComponentType) return [];
    return this.dataService.Config.GetThreatRules().filter(x => x.ComponentRestriction?.componentTypeID == this.selectedComponentType.ID);
  }
  public selectedThreatRule: ThreatRule;

  public get selectedQuestion(): ThreatQuestion { return this._selectedQuestion; }
  public set selectedQuestion(val: ThreatQuestion) {
    this._selectedQuestion = val;
  }

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild('ctxMenu') public matMenuTrigger: MatMenuTrigger; 

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService, 
    private translate: TranslateService, private locStorage: LocalStorageService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes();
    }, 100);
  }

  public OpenContextMenu(event, node) {
    event.preventDefault();
    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 
    this.matMenuTrigger.menuData = { item: node }; 
    this.matMenuTrigger.openMenu(); 
  }

  public IsProperty(item: any): item is IProperty {
    return 'DisplayName' in item && 'ID' in item;
  }

  public IsThreatRule(item: any): item is ThreatRule {
    return item instanceof ThreatRule;
  }

  public IsThreatQuestion(item: any): item is ThreatQuestion {
    return item instanceof ThreatQuestion;
  }

  public OnMoveUpProperty(item: IProperty) {
    let arr = this.selectedComponentType.Properties;
    if (arr.findIndex(x => x.ID == item.ID) != 0) {
      let idx = arr.findIndex(x => x.ID == item.ID);
      arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
    }
  }

  public OnMoveDownProperty(item: IProperty) {
    let arr = this.selectedComponentType.Properties;
    if (arr.findIndex(x => x.ID == item.ID) != arr.length-1) {
      let idx = arr.findIndex(x => x.ID == item.ID);
      arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
    }
  }

  public OnMoveUpThreatRule(rule: ThreatRule) {
    let arr = this.dataService.Config.GetThreatRules();
    let arrType = this.typeThreats;
    let idxType = arrType.findIndex(x => x.ID == rule.ID);
    if (idxType != 0) {
      const prev = arr.findIndex(x => x.ID == rule.ID);
      const curr = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
      this.dataService.Config.MoveItemInThreatRules(prev, curr);
    } 
  }

  public OnMoveDownThreatRule(rule: ThreatRule) {
    let arr = this.dataService.Config.GetThreatRules();
    let arrType = this.typeThreats;
    let idxType = arrType.findIndex(x => x.ID == rule.ID);
    if (idxType != arrType.length-1) {
      const prev = arr.findIndex(x => x.ID == rule.ID);
      const curr = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
      this.dataService.Config.MoveItemInThreatRules(prev, curr);
    }
  }

  public OnMoveUpQuestion(quest: ThreatQuestion) {
    let arr = this.dataService.Config.GetThreatQuestions();
    let arrType = this.GetQuestions();
    let idxType = arrType.findIndex(x => x.ID == quest.ID);
    if (idxType != 0) {
      const prev = arr.findIndex(x => x.ID == quest.ID);
      const curr = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
      this.dataService.Config.MoveItemInThreatQuestions(prev, curr);
    } 
  }

  public OnMoveDownQuestion(quest: ThreatQuestion) {
    let arr = this.dataService.Config.GetThreatQuestions();
    let arrType = this.GetQuestions();
    let idxType = arrType.findIndex(x => x.ID == quest.ID);
    if (idxType != arrType.length-1) {
      const prev = arr.findIndex(x => x.ID == quest.ID);
      const curr = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
      this.dataService.Config.MoveItemInThreatQuestions(prev, curr);
    }
  }

  public AddProperty() {
    let existingProps = [];
    existingProps.push(...this.selectedComponentType.Properties.map(x => x.DisplayName));
    let propName = StringExtension.FindUniqueName('New Property', existingProps);
    this.selectedComponentType.Properties.push({ DisplayName: propName, ID: uuidv4(), Tooltip: '', HasGetter: false, Editable: true, Type: PropertyEditTypes.CheckBox });
    this.selectedProperty = this.selectedComponentType.Properties[this.selectedComponentType.Properties.length-1];
  }

  public DeleteProperty(prop: IProperty) {
    let index = this.selectedComponentType.Properties.indexOf(prop);
    if (index >= 0) this.selectedComponentType.Properties.splice(index, 1);
  }

  public GetElementPropertyValue(prop: IProperty) {
    let val = prop.DefaultValue;

    if (prop.Type == PropertyEditTypes.ProtocolSelect) {
      return '[ ]';
    }
    if (prop.Type == PropertyEditTypes.LowMediumHighSelect) {
      return LowMediumHighNumberUtil.ToString(val);
    }

    return val;
  }

  public GetPropertyTypes(): string[] {
    return PropertyEditTypesUtil.GetMappableTypeNames();
  }

  public AddThreat() {
    let map = this.dataService.Config.CreateThreatRule(this.dataService.Config.ComponentThreatRuleGroups, RuleTypes.Component);
    map.ComponentRestriction.componentTypeID = this.selectedComponentType.ID;
    map.Name = StringExtension.FindUniqueName(this.selectedComponentType.Name, this.dataService.Config.GetThreatRules().map(x => x.Name));
    this.selectedThreatRule = map;
  }

  public DeleteThreat(threat: ThreatRule) {
    this.dataService.Config.DeleteThreatRule(threat);
    if (threat == this.selectedThreatRule) this.selectedThreatRule = null;
  }

  public GetComponentRestrictionsCount(threat: ThreatRule): number {
    let res = 0;
    if (threat.ComponentRestriction?.DetailRestrictions) {
      threat.ComponentRestriction.DetailRestrictions.forEach(x => {
        if (x.RestType == RestrictionTypes.Property && x.PropertyRest) res += 1;
        else if (x.RestType == RestrictionTypes.PhysicalElement && x.PhyElementRest) res += 1;
      });
    }
    return res;
  }

  public AddQuestion(): ThreatQuestion {
    let question = this.dataService.Config.CreateThreatQuestion();
    question.ComponentType = this.selectedComponentType;
    this.selectedQuestion = question;
    return question;
  }

  public DuplicateQuestion(quest: ThreatQuestion) {
    let copy = this.AddQuestion();
    copy.CopyFrom(quest.Data);
    copy.Name += '-Copy';
  }

  public DeleteQuestion(quest: ThreatQuestion) {
    this.dialog.OpenDeleteObjectDialog(quest).subscribe(res => {
      if (res) {
        this.dataService.Config.DeleteThreatQuestion(quest);
        this.selectedQuestion = null;
      }
    });
  }

  public AddNewThreat() {
    this.AddThreat();
    this.selectedThreatRule.Name = this.newThreat.name;
    this.AddQuestion();
    this.selectedQuestion.Name = this.newThreat.name;
    this.selectedQuestion.Question = this.newThreat.question;
    if (this.newThreat.property?.length > 0) {
      this.AddProperty();
      this.selectedProperty.DisplayName = this.newThreat.property;
      this.selectedProperty.Tooltip = this.newThreat.question;
      this.selectedThreatRule.ComponentRestriction.DetailRestrictions.push({ IsOR: true, Layer: 0, RestType: RestrictionTypes.Property, PropertyRest: { ID: this.selectedProperty.ID, ComparisonType: PropertyComparisonTypes.Equals, Value: this.newThreat.threatGen }});
      this.selectedQuestion.Property = this.selectedProperty;
      if (!this.newThreat.yesResult) {
        this.selectedQuestion.ChangesPerOption['general.Yes']['Value'] = false;
        this.selectedQuestion.ChangesPerOption['general.No']['Value'] = true;
      }
    }

    this.newThreat = { name: '', property: '', question: '', threatGen: false, yesResult: true };
  }

  public GetQuestions(): ThreatQuestion[] {
    return this.dataService.Config.GetThreatQuestions().filter(x => x.ComponentType == this.selectedComponentType);
  }  
  
  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public dropThreat(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetThreatRules().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetThreatRules().indexOf(selectedArray[event.currentIndex]);
    this.dataService.Config.MoveItemInThreatRules(prev, curr);
  }

  public dropQuestion(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetThreatQuestions().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetThreatQuestions().indexOf(selectedArray[event.currentIndex]);
    this.dataService.Config.MoveItemInThreatQuestions(prev, curr);
  }

  public GetOptionTypeName(opt: OptionTypes) {
    return OptionTypesUtil.ToString(opt);
  }

  public GetSelectedTabIndex() {
    let index = this.locStorage.Get(LocStorageKeys.PAGE_CONFIG_COMPONENTS_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.locStorage.Set(LocStorageKeys.PAGE_CONFIG_COMPONENTS_TAB_INDEX, event);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];

    let createType = (type: MyComponentType, group: MyComponentTypeGroup, groupNode: INavigationNode, root: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => type.Name, 
        canSelect: true,
        data: type,
        canRename: true,
        onRename: (val: string) => { type.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(type).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteMyComponentType(type);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = group.Data['myComponentTypeIDs'];
          if (arr.findIndex(x => x == type.ID) != 0) {
            let idx = arr.findIndex(x => x == type.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = group.Data['myComponentTypeIDs'];
          if (arr.findIndex(x => x == type.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x == type.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        },
        canMoveToGroup: true,
        onMoveToGroups: () => {
          return root.children.filter(x => x != groupNode);
        },
        onMoveToGroup: (newGroup: INavigationNode) => {
          let arrName = 'myComponentTypeIDs';
          group.Data[arrName].splice(group.Data[arrName].indexOf(type.ID), 1);
          newGroup.data.Data[arrName].push(type.ID);
          this.createNodes();
        }
      };

      return node;
    };

    let createGroup = (group: MyComponentTypeGroup, root: INavigationNode): INavigationNode => {
      let node: INavigationNode = {
        name: () => group.Name,
        canSelect: false,
        data: group,
        canAdd: true,
        onAdd: () => {
          let type = this.dataService.Config.CreateMyComponentType(group);
          type.ComponentTypeID = this.componentType;
          type.IsActive = true;
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(type);
          this.selectedNode.isRenaming = true;
        },
        canRename: true,
        onRename: (val: string) => { group.Name = val; },
        canDelete: true,
        onDelete: () => { 
          this.dialog.OpenDeleteObjectDialog(group).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteMyComponentTypeGroup(group);
              if (this.selectedNode == node) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        children: [],
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetMyComponentTypeGroups(group.ComponentTypeID);
          if (arr.findIndex(x => x.ID == group.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == group.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetMyComponentTypeGroups(group.ComponentTypeID);
          if (arr.findIndex(x => x.ID == group.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == group.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            root.children.splice(idx, 0, root.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return node;
    };
    
    let root: INavigationNode = {
      name: () => this.translate.instant('pages.config.' + (this.componentType == MyComponentTypeIDs.Software ? 'Software' : 'Process') + 'Components'),
      canSelect: false,
      icon: this.componentType == MyComponentTypeIDs.Software ? 'code' : 'policy',
      canAdd: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateMyComponentTypeGroup(this.componentType);
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(newObj);
        this.selectedNode.isRenaming = true;
      },
      children: [],
    };

    this.dataService.Config.GetMyComponentTypeGroups(this.componentType).forEach(x => {
      let g = createGroup(x, root);
      x.Types.forEach(y => g.children.push(createType(y, x, g, root)));
      root.children.push(g);
    });

    this.Nodes.push(root);
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
