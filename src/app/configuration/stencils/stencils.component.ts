import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DatabaseBase, IKeyValue, IProperty, PropertyEditTypes, PropertyEditTypesUtil } from '../../model/database';
import { DataFlow, ElementTypeIDs, ElementTypeUtil, Interface, StencilType, LogDataStore, LogExternalEntity, LogProcessing, LogTrustArea, PhysicalLink, StencilTypeTemplate, Protocol, StencilThreatMnemonic, IElementTypeThreat } from '../../model/dfd-model';
import { RestrictionTypes, RuleTypes, ThreatRule } from '../../model/threat-model';
import { NavTreeBase } from '../../shared/components/nav-tree/nav-tree-base';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { StringExtension } from '../../util/string-extension';
import { ThemeService } from '../../util/theme.service';
import { v4 as uuidv4 } from 'uuid';
import { LowMediumHighNumberUtil } from '../../model/assets';
import { MatMenuTrigger } from '@angular/material/menu';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-stencils',
  templateUrl: './stencils.component.html',
  styleUrls: ['./stencils.component.scss']
})
export class StencilsComponent extends NavTreeBase implements OnInit {

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input()
  public set selectedNode(val: INavigationNode) { 
    this._selectedNode = val; 
    this.selectedProperty = this.selectedThreatRule = null;
  }

  public get isStencilType(): boolean { return this.selectedNode?.data instanceof StencilType; }
  public get selectedType(): StencilType { return this.selectedNode?.data; }
  public get selectedElementType(): StencilType { return this.selectedType?.ElementTypeID ? this.dataService.Config.GetStencilElementType(this.selectedType) : null; }
  public selectedProperty: IProperty;
  public get currentPropertyOverwriting(): IKeyValue {
    return this.selectedType.PropertyOverwrites?.find(x => x.Key == this.selectedProperty.ID);
  }

  public get typeThreats(): ThreatRule[] {
    if (!this.selectedType) return null;
    return this.dataService.Config.GetThreatRules().filter(x => x.StencilRestriction?.stencilTypeID == this.selectedType.ID);
  }
  public get elementTypeThreats(): ThreatRule[] {
    if (!this.selectedElementType) return null;
    return this.dataService.Config.GetThreatRules().filter(x => x.StencilRestriction?.stencilTypeID == this.selectedElementType.ID);
  }
  public selectedThreatRule: ThreatRule;
  public get isTypeThreat(): boolean { 
    if (!this.selectedThreatRule || !this.selectedType) return false;
    return this.selectedThreatRule.StencilRestriction.stencilTypeID == this.selectedType.ID;
  }

  public get isStencilTypeTemplate(): boolean { return this.selectedNode?.data instanceof StencilTypeTemplate; }
  public get selectedTypeTemplate(): StencilTypeTemplate { return this.selectedNode?.data; }

  public get isProtocol(): boolean { return this.selectedNode?.data instanceof Protocol; }
  public get selectedProtocol(): Protocol { return this.selectedNode?.data; }
  public get defaultProtocol(): Protocol { return Protocol.GetDefaultType(this.dataService.Config); }

  public get isStencilThreatMnemonic(): boolean { return this.selectedNode?.data instanceof StencilThreatMnemonic; }
  public get selectedThreatMnemonic(): StencilThreatMnemonic { return this.selectedNode?.data; }
  public selectedMnemonicLetter: IElementTypeThreat;

  public menuTopLeftPosition =  {x: '0', y: '0'};
  @ViewChild('ctxMenu') public matMenuTrigger: MatMenuTrigger; 

  constructor(public theme: ThemeService, private dataService: DataService, private dialog: DialogService, private locStorageService: LocalStorageService) { 
    super();
    dataService.ConfigChanged.subscribe(x => this.createNodes());
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.createNodes(); //this.selectedNode.
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

  public OnMoveUpProperty(item: IProperty) {
    let arr = this.selectedType.Properties;
    if (arr.findIndex(x => x.ID == item.ID) != 0) {
      let idx = arr.findIndex(x => x.ID == item.ID);
      arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
    }
  }

  public OnMoveDownProperty(item: IProperty) {
    let arr = this.selectedType.Properties;
    if (arr.findIndex(x => x.ID == item.ID) != arr.length-1) {
      let idx = arr.findIndex(x => x.ID == item.ID);
      arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
    }
  }

  public GetSelectedTabIndex() {
    let index = this.locStorageService.Get(LocStorageKeys.PAGE_CONFIG_STENCILS_TAB_INDEX);
    if (index != null) return index;
    else return 0;
  }

  public SetSelectedTabIndex(event) {
    this.locStorageService.Set(LocStorageKeys.PAGE_CONFIG_STENCILS_TAB_INDEX, event);
  }

  public AddProperty() {
    let existingProps = [];
    existingProps.push(...this.selectedType.Properties.map(x => x.DisplayName));
    if (!this.selectedType.IsDefault && this.selectedElementType.Properties) existingProps.push(...this.selectedElementType.Properties.map(x => x.DisplayName));
    let propName = StringExtension.FindUniqueName('New Property', existingProps);
    this.selectedType.Properties.push({ DisplayName: propName, ID: uuidv4(), Tooltip: '', HasGetter: false, Editable: true, Type: PropertyEditTypes.CheckBox, DefaultValue: false });
    this.selectedProperty = this.selectedType.Properties[this.selectedType.Properties.length-1];
  }

  public DeleteProperty(prop: IProperty) {
    let index = this.selectedType.Properties.indexOf(prop);
    if (index >= 0) this.selectedType.Properties.splice(index, 1);
  }

  public GetElementPropertyValue(prop: IProperty) {
    let val = prop.DefaultValue;
    let overwriting = this.selectedType.PropertyOverwrites?.find(x => x.Key == prop.ID);
    if (overwriting) val = overwriting.Value;

    if (prop.Type == PropertyEditTypes.ProtocolSelect) {
      if(overwriting && val?.length > 0) {
        return this.dataService.Config.GetProtocols().filter(x => val.includes(x.ID)).map(x => x.Name).join(', ');
      }
      return '[ ]';
    }
    if (prop.Type == PropertyEditTypes.LowMediumHighSelect) {
      return LowMediumHighNumberUtil.ToString(val);
    }

    return val;
  }

  public OverwriteProperty() {
    if (!this.selectedType.PropertyOverwrites) this.selectedType.PropertyOverwrites = [];
    this.selectedType.PropertyOverwrites.push({ Key: this.selectedProperty.ID, Value: this.selectedProperty.DefaultValue });
  }

  public UnOverwriteProperty() {
    this.selectedType.PropertyOverwrites.splice(this.selectedType.PropertyOverwrites.indexOf(this.selectedType.PropertyOverwrites.find(x => x.Key == this.selectedProperty.ID)), 1);
  }

  public IsPropOverwritten(prop: IProperty) {
    return this.selectedType.PropertyOverwrites?.find(x => x.Key == prop.ID)
  }

  public GetPropertyTypes(): string[] {
    return PropertyEditTypesUtil.GetMappableTypeNames();
  }

  public AddThreat() {
    let map = this.dataService.Config.CreateThreatRule(this.dataService.Config.StencilThreatRuleGroups, RuleTypes.Stencil);
    map.StencilRestriction.stencilTypeID = this.selectedType.ID;
    map.Name = StringExtension.FindUniqueName(this.selectedType.Name, this.dataService.Config.GetThreatRules().map(x => x.Name));
    this.selectedThreatRule = map;
  }

  public DeleteThreat(threat: ThreatRule) {
    this.dataService.Config.DeleteThreatRule(threat);
    if (threat == this.selectedThreatRule) this.selectedThreatRule = null;
  }

  public GetStencilRestrictionsCount(threat: ThreatRule): number {
    let res = 0;
    if (threat.StencilRestriction?.DetailRestrictions) {
      threat.StencilRestriction.DetailRestrictions.forEach(x => {
        if (x.RestType == RestrictionTypes.Property && x.PropertyRest) res += 1;
        else if (x.RestType == RestrictionTypes.PhysicalElement && x.PhyElementRest) res += 1;
      });
    }
    return res;
  }

  public AutoCalcLayout() {
    if (this.selectedTypeTemplate && this.selectedTypeTemplate.StencilTypes?.length > 0) {
      let stencils = this.selectedTypeTemplate.StencilTypes;
      let layouts = this.selectedTypeTemplate.Layout;
      let entities = stencils.filter(x => x.ElementTypeID != ElementTypeIDs.PhyTrustArea && x.ElementTypeID != ElementTypeIDs.LogTrustArea);

      let calcCols = (cnt): number => {
        if (cnt <= 4) return 2;
        if (cnt <= 9) return 3;
        return 4;
      };
      let calcRows = (cnt, cols): number => {
        return Math.ceil(cnt/cols);
      };

      const marginX = 20, marginY = 40;
      const offset = 20;
      const wid = 140;
      const hei = 75;
      let cols = calcCols(entities.length);
      let rows = calcRows(entities.length, cols);
      for (let i = 0, row = 0, col = 0; i < stencils.length; i++) {
        if (stencils[i].ElementTypeID != ElementTypeIDs.PhyTrustArea && stencils[i].ElementTypeID != ElementTypeIDs.LogTrustArea) {
          layouts[i].x = marginX + col * (wid+offset);
          layouts[i].y = marginY + row * (hei+offset);
          col++;
          if (col == cols) {
            col = 0;
            row++;
          }
        }
        else {
          // TA
          layouts[i].x = layouts[i].y = 0;
          layouts[i].width = 2 * marginX + cols * wid + (cols-1) * offset;
          layouts[i].height = 2 * marginY + rows * hei + (rows-1) * offset;
        }
      }
    }
  }

  public AddMnemonicLetter() {
    this.selectedThreatMnemonic.Letters.push({ Name: StringExtension.FindUniqueName('Letter', this.selectedThreatMnemonic.Letters.map(x => x.Name)), Letter: '', Description: '', AffectedElementTypes: [] });
  }

  public DeleteMnemonicLetter(letter: IElementTypeThreat) {
    const index = this.selectedThreatMnemonic.Letters.findIndex(x => x.Name == letter.Name && x.Letter == letter.Letter);
    if (index >= 0) {
      this.selectedThreatMnemonic.Letters.splice(index, 1);
    }
  }

  public OnMnemonicElementThreat(event, letter: IElementTypeThreat, element) {
    if (event.checked) letter.AffectedElementTypes.push(element);
    else {
      const index = letter.AffectedElementTypes.indexOf(element);
      if (index >= 0) {
        letter.AffectedElementTypes.splice(index, 1);
      }
    }
  }

  public GetElementTypes() {
    let res: ElementTypeIDs[] = [];
    if (this.selectedTypeTemplate.ListInHWDiagram) res.push(...[ElementTypeIDs.PhyProcessing, ElementTypeIDs.PhyDataStore, ElementTypeIDs.PhyExternalEntity, ElementTypeIDs.PhyTrustArea, ElementTypeIDs.PhysicalLink, ElementTypeIDs.Interface]);
    if (this.selectedTypeTemplate.ListInUCDiagram) res.push(...[ElementTypeIDs.LogProcessing, ElementTypeIDs.LogDataStore, ElementTypeIDs.LogExternalEntity, ElementTypeIDs.LogTrustArea, ElementTypeIDs.PhysicalLink]);
    return res;
  }

  public GetMnemonicElementTypes() {
    return ElementTypeUtil.GetTypes();
  }

  public GetElementTypeName(type: ElementTypeIDs): string {
    return ElementTypeUtil.ToString(type);
  }

  public GetStencilTypes(): StencilType[] {
    let res = this.dataService.Config.GetStencilTypes();
    res.sort((a, b) => {
      const def = b.IsDefault;
      if (def) return 1;
      return a.ElementTypeID - b.ElementTypeID;
    });
    return res;
  }

  public GetProtocols(): Protocol[] {
    return this.dataService.Config.GetProtocols();
  }

  public GetIcon(type) {
    if (type instanceof Protocol) return DataFlow.Icon;
    return ElementTypeUtil.Icon(type.ElementTypeID);
  }

  public GetNamesOfIDs(objs: DatabaseBase[], ids: string[]) {
    return objs.filter(x => ids.includes(x.ID)).map(x => x.GetProperty('Name')).join(', ');
  }

  public drop(event: CdkDragDrop<string[]>, selectedArray) {
    moveItemInArray(selectedArray, event.previousIndex, event.currentIndex);
  }

  public dropThreat(event: CdkDragDrop<string[]>, selectedArray) {
    const prev = this.dataService.Config.GetThreatRules().indexOf(selectedArray[event.previousIndex]);
    const curr = this.dataService.Config.GetThreatRules().indexOf(selectedArray[event.currentIndex]);
    this.dataService.Config.MoveItemInThreatRules(prev, curr);
  }

  private createNodes() {
    const prevNodes = this.Nodes;
    this.Nodes = [];
    let createType = (type: StencilType, groupNode: INavigationNode): INavigationNode => {
      let t: INavigationNode = {
        name: () => type.Name,
        canSelect: true, 
        isBold: type.IsDefault,
        data: type,
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetStencilTypes();
          let arrType = this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == type.ElementTypeID);
          let idxType = arrType.findIndex(x => x.ID == type.ID);
          if (idxType != 0) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType-1].ID);
            this.dataService.Config.MoveItemInStencilTypes(arr.findIndex(x => x.ID == type.ID), newIdx);
            groupNode.children.splice(idxType, 0, groupNode.children.splice(idxType-1, 1)[0]);
          } 
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetStencilTypes();
          let arrType = this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == type.ElementTypeID);
          let idxType = arrType.findIndex(x => x.ID == type.ID);
          if (idxType != arrType.length-1) {
            let newIdx = arr.findIndex(x => x.ID == arrType[idxType+1].ID);
            this.dataService.Config.MoveItemInStencilTypes(arr.findIndex(x => x.ID == type.ID), newIdx);
            groupNode.children.splice(idxType, 0, groupNode.children.splice(idxType+1, 1)[0]);
          }
        }
      };
      t.canDelete = t.canRename = t.canDuplicate = !type.IsDefault;
      if (t.canRename) t.onRename = (val: string) => (t.data as StencilType).Name = val;
      if (t.canDelete) t.onDelete = () => {
        this.dialog.OpenDeleteObjectDialog(type).subscribe(res => {
          if (res) {
            this.dataService.Config.DeleteStencilType(t.data);
            if (t == this.selectedNode) this.selectedNode = null;
            this.createNodes();
          }
        });
      };
      if (t.canDuplicate) t.onDuplicate = () => {
        let copy = JSON.parse(JSON.stringify(t.data)) as StencilType;
        copy.Name = copy.Name + '-Copy';
        this.dataService.Config.GetStencilTypes().push(copy);
        this.createNodes();
      };

      return t;
    };
    let createGroup = (name: string, childs: ElementTypeIDs[], icon?: string): INavigationNode => {
      let g: INavigationNode = {
        name: () => name,
        canSelect: false,
        children: []
      };
      if (icon) g.icon = icon;

      if (childs.length == 1) {
        g.canAdd = true;
        g.onAdd = () => {
          let newObj = this.dataService.Config.CreateStencilType(childs[0]);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(newObj);
          this.selectedNode.isRenaming = true;
        };
        this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == childs[0]).forEach(x => {
          let type = createType(x, g);
          g.children.push(type);
        });
      }
      else {
        childs.forEach(x => {
          let subG = createGroup(ElementTypeUtil.ToString(x), [x]);
          g.children.push(subG);
        });
      }
      return g;
    };

    this.Nodes.push(createGroup('Processing', [ElementTypeIDs.LogProcessing, ElementTypeIDs.PhyProcessing], LogProcessing.Icon));
    this.Nodes.push(createGroup('Data Store', [ElementTypeIDs.LogDataStore, ElementTypeIDs.PhyDataStore], LogDataStore.Icon));
    this.Nodes.push(createGroup('External Entity', [ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity], LogExternalEntity.Icon));
    this.Nodes.push(createGroup('Data Flow', [ElementTypeIDs.DataFlow], DataFlow.Icon));
    this.Nodes.push(createGroup('Physical Link', [ElementTypeIDs.PhysicalLink], PhysicalLink.Icon));
    this.Nodes.push(createGroup('Interface', [ElementTypeIDs.Interface], Interface.Icon));
    this.Nodes.push(createGroup('Trust Area', [ElementTypeIDs.LogTrustArea, ElementTypeIDs.PhyTrustArea], LogTrustArea.Icon));

    let protocol: INavigationNode = {
      name: () => 'Protocol',
      canSelect: false,
      canAdd: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateProtocol();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(newObj);
        this.selectedNode.isRenaming = true;
      },
      children: []
    };

    let createProtocol = (p: Protocol, groupNode: INavigationNode): INavigationNode => {
      let t: INavigationNode = {
        name: () => p.Name,
        canSelect: true, 
        data: p,
        isBold: p.IsDefault,
        canRename: !p.IsDefault,
        onRename: (val: string) => (t.data as Protocol).Name = val,
        canDelete: !p.IsDefault,
        onDelete: () => {
          this.dialog.OpenDeleteObjectDialog(p).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteProtocol(t.data);
              if (t == this.selectedNode) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: !p.IsDefault,
        onDuplicate: () => {
          let copy = JSON.parse(JSON.stringify(t.data)) as Protocol;
          copy.Name = copy.Name + '-Copy';
          this.dataService.Config.GetProtocols().push(copy);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(copy);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetProtocols();
          if (arr.findIndex(x => x.ID == p.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == p.ID);
            this.dataService.Config.MoveItemInProtocols(idx, idx-1);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetProtocols();
          if (arr.findIndex(x => x.ID == p.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == p.ID);
            this.dataService.Config.MoveItemInProtocols(idx, idx+1);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return t;
    };

    this.dataService.Config.GetProtocols().forEach(x => protocol.children.push(createProtocol(x, protocol)));
    this.Nodes.find(x => x.name() == 'Data Flow').children.push(protocol);

    let template: INavigationNode = {
      name: () => 'Template',
      canSelect: false,
      icon: 'view_module',
      canAdd: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateStencilTypeTemplate();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(newObj);
        this.selectedNode.isRenaming = true;
      },
      children: []
    };

    let createTemplate = (template: StencilTypeTemplate, groupNode: INavigationNode): INavigationNode => {
      let t: INavigationNode = {
        name: () => template.Name,
        canSelect: true, 
        data: template,
        canRename: true,
        onRename: (val: string) => (t.data as StencilTypeTemplate).Name = val,
        canDelete: true,
        onDelete: () => {
          this.dialog.OpenDeleteObjectDialog(template).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteStencilTypeTemplate(t.data);
              if (t == this.selectedNode) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let copy = JSON.parse(JSON.stringify(t.data)) as StencilTypeTemplate;
          copy.Name = copy.Name + '-Copy';
          this.dataService.Config.GetStencilTypeTemplates().push(copy);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(copy);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetStencilTypeTemplates();
          if (arr.findIndex(x => x.ID == template.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == template.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetStencilTypeTemplates();
          if (arr.findIndex(x => x.ID == template.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == template.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return t;
    };

    this.dataService.Config.GetStencilTypeTemplates().forEach(x => template.children.push(createTemplate(x, template)));
    this.Nodes.push(template);

    let mnemonic: INavigationNode = {
      name: () => 'Mnemonic',
      canSelect: false,
      icon: 'abc',
      canAdd: true,
      onAdd: () => {
        let newObj = this.dataService.Config.CreateStencilThreatMnemonic();
        this.createNodes();
        this.selectedNode = this.FindNodeOfObject(newObj);
        this.selectedNode.isRenaming = true;
      },
      children: []
    };

    let createMnemonic = (mnemonic: StencilThreatMnemonic, groupNode: INavigationNode): INavigationNode => {
      let t: INavigationNode = {
        name: () => mnemonic.Name,
        canSelect: true, 
        data: mnemonic,
        canRename: true,
        onRename: (val: string) => (t.data as StencilThreatMnemonic).Name = val,
        canDelete: true,
        onDelete: () => {
          this.dialog.OpenDeleteObjectDialog(mnemonic).subscribe(res => {
            if (res) {
              this.dataService.Config.DeleteStencilThreatMnemonic(t.data);
              if (t == this.selectedNode) this.selectedNode = null;
              this.createNodes();
            }
          });
        },
        canDuplicate: true,
        onDuplicate: () => {
          let copy = JSON.parse(JSON.stringify(t.data)) as StencilThreatMnemonic;
          copy.Name = copy.Name + '-Copy';
          this.dataService.Config.GetStencilThreatMnemonics().push(copy);
          this.createNodes();
          this.selectedNode = this.FindNodeOfObject(copy);
          this.selectedNode.isRenaming = true;
        },
        canMoveUpDown: true,
        onMoveUp: () => {
          let arr = this.dataService.Config.GetStencilThreatMnemonics();
          if (arr.findIndex(x => x.ID == mnemonic.ID) != 0) {
            let idx = arr.findIndex(x => x.ID == mnemonic.ID);
            arr.splice(idx, 0, arr.splice(idx-1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx-1, 1)[0]);
          }
        },
        onMoveDown: () => {
          let arr = this.dataService.Config.GetStencilThreatMnemonics();
          if (arr.findIndex(x => x.ID == mnemonic.ID) != arr.length-1) {
            let idx = arr.findIndex(x => x.ID == mnemonic.ID);
            arr.splice(idx, 0, arr.splice(idx+1, 1)[0]);
            groupNode.children.splice(idx, 0, groupNode.children.splice(idx+1, 1)[0]);
          }
        }
      };

      return t;
    };

    this.dataService.Config.GetStencilThreatMnemonics().forEach(x => mnemonic.children.push(createMnemonic(x, mnemonic)));
    this.Nodes.push(mnemonic);
    
    NavTreeBase.TransferExpandedState(prevNodes, this.Nodes);
    this.nodeTreeChanged.emit(this.Nodes);
  }
}
