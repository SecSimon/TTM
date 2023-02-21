import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MyComponentStack, MyComponentType, MyComponentTypeIDs } from '../../model/component';
import { DataChangedTypes } from '../../model/database';
import { ElementTypeIDs, StencilType, DFDElementRef, DFDContainerRef } from '../../model/dfd-model';
import { ContextElementRef, ContextElementTypes, SystemContextContainerRef } from '../../model/system-context';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';
import { NodeTypes } from '../modeling.component';

export interface IDragDropData {
  stencilRef?: IStencilRef;
  useCase?: string;
  contextRef?: IContextRef;
  componentTypeID?: string;
}

export interface IStencilRef {
  stencilID?: string;
  elementID?: string;
  templateID?: string;
  name: string;
}

export interface IContextRef {
  type?: string;
  elementType?: ContextElementTypes;
  elementID?: string;
  name: string;
}

@Component({
  selector: 'app-stencil-palette',
  templateUrl: './stencil-palette.component.html',
  styleUrls: ['./stencil-palette.component.scss']
})
export class StencilPaletteComponent implements OnInit {

  private dragDiv;
  private stencilBuffer = {};
  private _selectedNode;

  public get ProcessStencils(): IStencilRef[] { return this.stencilBuffer['P'][this.NodeType]; }
  public get DataStoreStencils(): IStencilRef[] { return this.stencilBuffer['DS'][this.NodeType]; }
  public get ExternalEntityStencils(): IStencilRef[] { return this.stencilBuffer['EE'][this.NodeType]; }
  public get DataFlowStencils(): IStencilRef[] { return this.stencilBuffer['DF'][this.NodeType]; }
  public get TrustAreaStencils(): IStencilRef[] { return this.stencilBuffer['TA'][this.NodeType]; }
  public get PhysicalLinkStencils(): IStencilRef[] { return this.stencilBuffer['PL'][this.NodeType]; }
  public get InterfaceStencils(): IStencilRef[] { return this.stencilBuffer['IF'][this.NodeType]; }
  public get StencilTemplates(): IStencilRef[] { return this.stencilBuffer['ST'][this.NodeType]; }

  public get DeviceStencils(): IContextRef[] { return this.stencilBuffer['DEV'][this.NodeType]; }
  public get AppStencils(): IContextRef[] { return this.stencilBuffer['APP'][this.NodeType]; }
  public get InteractorStencils(): IContextRef[] { return this.stencilBuffer['ACT'][this.NodeType]; }

  public get ComponentTypes(): MyComponentType[] {
    let res: MyComponentType[] = [];

    const stack = this.selectedNode.data as MyComponentStack;
    const comps = this.dataService.Config.GetMyComponentTypes(this.NodeType == NodeTypes.Software ? MyComponentTypeIDs.Software : MyComponentTypeIDs.Process);
    comps.filter(x => !stack.GetChildren().map(y => y.Type).includes(x)).forEach(x => res.push(x));

    return res;
  }

  public StrokeColor: string = 'black';
  public get NodeType(): NodeTypes { return this.selectedNode?.dataType; }

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  @Input('selectedNode') public set selectedNode(val: INavigationNode) { 
    this._selectedNode = val;
    this.initalizeStencils(); 
  }

  constructor(public dataService: DataService, public theme: ThemeService, private translate: TranslateService) { 
    this.initalizeStencils();

    this.dataService.Project.DFDElementsChanged.subscribe(val => {
      if (val.Type == DataChangedTypes.Removed) this.initalizeStencils(); 
    });

    this.dataService.Project.DevicesChanged.subscribe(val => {
      this.initalizeStencils(); 
    });
    this.dataService.Project.MobileAppsChanged.subscribe(val => {
      this.initalizeStencils(); 
    });
  }

  ngOnInit(): void {
    this.setColors(this.theme.IsDarkMode);
    this.theme.ThemeChanged.subscribe((isDark) => {
      this.setColors(isDark);
    });
  }

  private initalizeStencils() {
    if ([NodeTypes.Software, NodeTypes.Process].includes(this.NodeType)) return;
    let initElements = (abbr: string, nodeType: NodeTypes, typeIDs: ElementTypeIDs[], dfdRefs?: ElementTypeIDs[], ctxRefs?: ContextElementTypes[]) => {
      this.stencilBuffer[abbr][nodeType] = [];
      if (dfdRefs) {
        dfdRefs.forEach(x => this.stencilBuffer[abbr][nodeType].push(...this.addDFDElementReferences(x)));
      }
      if (ctxRefs) {
        const defStencil = this.dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == typeIDs[0]);
        ctxRefs.forEach(x => this.stencilBuffer[abbr][nodeType].push(...this.addContextElementReferences(x).map(y => { 
          return { name: y.name, stencilID: defStencil.ID };
        })));
      }
      typeIDs.sort();
      typeIDs.forEach(typeID => {
        this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == typeID).forEach(x => this.stencilBuffer[abbr][nodeType].push({ stencilID: x.ID, name: x.Name }));
      });
      typeIDs.forEach(typeID => {
        let templates = this.dataService.Config.GetStencilTypeTemplates().filter(x => ((nodeType == NodeTypes.Hardware && x.ListInHWDiagram) || (nodeType == NodeTypes.Dataflow && x.ListInUCDiagram)) && x.StencilTypes.length > 0 && x.ListInElementTypeIDs.includes(typeID));
        templates.forEach(x => this.stencilBuffer[abbr][nodeType].push({ templateID: x.ID, name: x.Name }));
      });
    };

    // Process
    let abbr = 'P';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Hardware, [ElementTypeIDs.PhyProcessing]);
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.LogProcessing], null, [ContextElementTypes.MobileApp]);
  
    // Data Store
    abbr = 'DS';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Hardware, [ElementTypeIDs.PhyDataStore]);
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.LogDataStore]);

    // External Entity
    abbr = 'EE';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity], [ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity]);

    // Data Flow
    abbr = 'DF';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.DataFlow]);

    // Trust Area
    abbr = 'TA';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Hardware, [ElementTypeIDs.PhyTrustArea]);
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.LogTrustArea, ElementTypeIDs.PhyTrustArea], [ElementTypeIDs.PhyTrustArea], [ContextElementTypes.MobileApp]);

    // Physical Link
    abbr = 'PL';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Hardware, [ElementTypeIDs.PhysicalLink]);
    initElements(abbr, NodeTypes.Dataflow, [ElementTypeIDs.PhysicalLink], [ElementTypeIDs.PhysicalLink]);

    // Interface
    abbr = 'IF';
    this.stencilBuffer[abbr] = {};
    initElements(abbr, NodeTypes.Hardware, [ElementTypeIDs.Interface]);
    // templates for DFD
    this.stencilBuffer[abbr][NodeTypes.Dataflow] = [];
    const ifStencils = this.dataService.Config.GetStencilTypes().filter(x => x.ElementTypeID == ElementTypeIDs.Interface && x.TemplateDFD != null);
    this.dataService.Config.GetStencilTypeTemplates().filter(x => x.ListInUCDiagram && x.StencilTypes.length > 0 && ifStencils.some(y => y.TemplateDFD == x)).forEach(x => this.stencilBuffer[abbr][NodeTypes.Dataflow].push({ templateID: x.ID, name: x.Name}));

    // Templates
    abbr = 'ST';
    this.stencilBuffer[abbr] = {};
    this.stencilBuffer[abbr][NodeTypes.Hardware] = [];
    this.dataService.Config.GetStencilTypeTemplates().filter(x => x.ListInHWDiagram && x.StencilTypes.length > 0).forEach(x => this.stencilBuffer[abbr][NodeTypes.Hardware].push({ templateID: x.ID, name: x.Name}));
    this.stencilBuffer[abbr][NodeTypes.Dataflow] = [];
    this.dataService.Config.GetStencilTypeTemplates().filter(x => x.ListInUCDiagram && x.StencilTypes.length > 0).forEach(x => this.stencilBuffer[abbr][NodeTypes.Dataflow].push({ templateID: x.ID, name: x.Name}));
  
    // Devices
    abbr = 'DEV';
    this.stencilBuffer[abbr] = {};
    this.stencilBuffer[abbr][NodeTypes.UseCase] = this.addContextElementReferences(ContextElementTypes.Device);

    // Mobile Apps
    abbr = 'APP';
    this.stencilBuffer[abbr] = {};
    this.stencilBuffer[abbr][NodeTypes.UseCase] = this.addContextElementReferences(ContextElementTypes.MobileApp);

    // Interactors
    abbr = 'ACT';
    this.stencilBuffer[abbr] = {};
    this.stencilBuffer[abbr][NodeTypes.UseCase] = this.addContextElementReferences(ContextElementTypes.Interactor);
  }

  private addContextElementReferences(type: ContextElementTypes): IContextRef[] {
    let res: IContextRef[] = [];
    this.dataService.Project.GetContextElements().filter(x => !(x instanceof ContextElementRef || x instanceof SystemContextContainerRef) && x.Type == type && this.dataService.Project.FindDiagramOfElement(x.ID)?.ID != this.selectedNode?.data?.ID).forEach(ele => {
      res.push({ elementID: ele.ID, elementType: type, name: ele.Name });
    });

    return res;
  }

  private addDFDElementReferences(elementType: ElementTypeIDs): IStencilRef[] {
    let res: IStencilRef[] = [];
    this.dataService.Project.GetDFDElements().filter(x => !(x instanceof DFDElementRef || x instanceof DFDContainerRef) && x.GetProperty('Type')?.ElementTypeID == elementType && this.dataService.Project.FindDiagramOfElement(x.ID)?.ID != this.selectedNode?.data?.ID).forEach(ele => {
      res.push({ elementID: ele.ID, name: ele.Name });
    });

    return res;
  }

  public onDrag(e, stencilRef: IStencilRef) {
    let data: IDragDropData = {
      stencilRef: stencilRef
    };
    e.dataTransfer.setData('dragDropData', JSON.stringify(data));
    var subdiv = document.createElement('div');
    subdiv.textContent = stencilRef.name;

    let stencil: StencilType = null;
    if (stencilRef.stencilID) stencil = this.dataService.Config.GetStencilType(stencilRef.stencilID);
    else if (stencilRef.elementID) stencil = this.dataService.Project.GetDFDElement(stencilRef.elementID).GetProperty('Type');
    else if (stencilRef.templateID) subdiv.classList.add('trust-area');
    
    if (stencil) {
      if (stencil.ElementTypeID == ElementTypeIDs.LogProcessing || stencil.ElementTypeID == ElementTypeIDs.PhyProcessing) {
        subdiv.classList.add('process');
        subdiv.style.borderStyle = 'solid';
        subdiv.style.borderRadius = '10px';
      }
      else if (stencil.ElementTypeID == ElementTypeIDs.LogDataStore || stencil.ElementTypeID == ElementTypeIDs.PhyDataStore) {
        subdiv.style.borderTopStyle = 'solid';
        subdiv.style.borderBottomStyle = 'solid';
      }
      else if (stencil.ElementTypeID == ElementTypeIDs.LogExternalEntity || stencil.ElementTypeID == ElementTypeIDs.PhyExternalEntity) {
        subdiv.style.borderStyle = 'solid';
      }
      else if (stencil.ElementTypeID == ElementTypeIDs.LogTrustArea || stencil.ElementTypeID == ElementTypeIDs.PhyTrustArea) {
        subdiv.style.borderStyle = 'dashed';
      }
      else if (stencil.ElementTypeID == ElementTypeIDs.PhysicalLink) {
        subdiv.classList.add('physical-link');
      }
      else if (stencil.ElementTypeID == ElementTypeIDs.Interface) {
        subdiv.classList.add('interface');
      }
      else console.error('ElementTypeID not implemented', stencil.ElementTypeID);
    }

    subdiv.style.width = '140px';
    subdiv.style.height = '75px';
    if (this.theme.IsDarkMode) subdiv.style.backgroundColor = '#424242';
    subdiv.style.borderColor = this.theme.IsDarkMode ? 'white' : 'black';
    subdiv.style.textAlign = 'center';

    this.dragDiv = document.createElement('div');
    this.dragDiv.appendChild(subdiv);
    this.dragDiv.style.position = 'absolute'; 
    this.dragDiv.style.top = '0px'; 
    this.dragDiv.style.left= '-145px';
    this.dragDiv.style.borderStyle = 'none';
    this.dragDiv.style.backgroundColor = '#424242';
    document.querySelector('body').appendChild(this.dragDiv);
    e.dataTransfer.setDragImage(this.dragDiv, 0, 0);
  }

  public onDragContext(e, ctxRef: IContextRef) {
    let data: IDragDropData = {
      contextRef: ctxRef
    };
    e.dataTransfer.setData('dragDropData', JSON.stringify(data));
    let wid = '200px'; // device width
    let hei = '200px'; // device height
    let left = '-205px'; // device left
    if (ctxRef.elementType == ContextElementTypes.Device) { // use case diagram
      wid = '250px';
      hei = '350px';
      left = '-255px'
    }
    if (ctxRef.elementType == ContextElementTypes.MobileApp) { // use case diagram
      wid = '250px';
      hei = '350px';
      left = '-255px'
    }
    else if (ctxRef.name == 'Interactor' || ctxRef.elementType == ContextElementTypes.Interactor) {
      wid = '40px';
      hei = '50px';
      left = '-45px';
    }
    else if (ctxRef.name.startsWith('Interface')) {
      wid = '25px';
      hei = '25px';
      left = '-25px';
    }
    else if (ctxRef.name == 'Use Case') {
      wid = '140px';
      hei = '50px';
      left = '-145px';
    }
    else if (ctxRef.name == 'External Entity') {
      wid = '140px';
      hei = '75px';
      left = '-145px';
    }
    else if (ctxRef.name == 'Trust Area') {
      wid = '300px';
      hei = '300px';
      left = '-305px';
    }
    var subdiv = document.createElement('div');
    subdiv.textContent = ctxRef.name.replace(/[0-9]/g, '');
    subdiv.style.borderStyle = 'solid';
    subdiv.style.width = wid;
    subdiv.style.height = hei;
    if (this.theme.IsDarkMode) subdiv.style.backgroundColor = '#424242';
    subdiv.style.borderColor = this.theme.IsDarkMode ? 'white' : 'black';
    subdiv.style.textAlign = 'center';

    this.dragDiv = document.createElement('div');
    this.dragDiv.appendChild(subdiv);
    this.dragDiv.style.position = 'absolute'; 
    this.dragDiv.style.top = '0px'; 
    this.dragDiv.style.left = left;
    this.dragDiv.style.borderStyle = 'none';
    this.dragDiv.style.backgroundColor = '#424242';

    document.querySelector('body').appendChild(this.dragDiv);
    e.dataTransfer.setDragImage(this.dragDiv, 0, 0);
  }

  public onDragComponent(e, comp?: MyComponentType) {
    let data: IDragDropData = {
      componentTypeID: comp?.ID
    };
    e.dataTransfer.setData('dragDropData', JSON.stringify(data));

    var subdiv = document.createElement('div');
    subdiv.textContent = 'Component';
    subdiv.classList.add(...['process', 'element-base', 'element-large']);

    // subdiv.style.color = 'white';
    subdiv.style.width = '140px';
    subdiv.style.height = '75px';
    //subdiv.className = subdiv.className + ' element-base element-small';
    if (this.theme.IsDarkMode) subdiv.style.backgroundColor = '#424242';
    subdiv.style.borderColor = this.theme.IsDarkMode ? 'white' : 'black';
    subdiv.style.borderStyle = 'solid';
    subdiv.style.textAlign = 'center';
    subdiv.style.borderRadius = '10px';

    this.dragDiv = document.createElement('div');
    this.dragDiv.appendChild(subdiv);
    //div.appendChild(t);
    this.dragDiv.style.position = 'absolute'; 
    this.dragDiv.style.top = '0px'; 
    this.dragDiv.style.left= '-145px';
    this.dragDiv.style.borderStyle = 'none';
    this.dragDiv.style.backgroundColor = '#424242';
    document.querySelector('body').appendChild(this.dragDiv);
    e.dataTransfer.setDragImage(this.dragDiv, 0, 0);
  }

  public onDragEnd() {
    document.querySelector('body').removeChild(this.dragDiv);
  }

  public GetStencilRefToolTip(stencilRef: IStencilRef) {
    let res = stencilRef.name.replace(/\n/g, ' ');
    if (stencilRef.elementID) res += '\n\n' + this.translate.instant('pages.modeling.stencilpalette.blueColor');
    else if (stencilRef.templateID) res += '\n\n' + this.translate.instant('pages.modeling.stencilpalette.purpleColor');
    return res;
  }

  public GetContextRefToolTip(contextRef: IContextRef) {
    let res = contextRef.name.replace(/\n/g, ' ');
    if (contextRef.elementID) res += '\n\n' + this.translate.instant('pages.modeling.stencilpalette.blueColor');
    return res;
  }

  private wrapBuffer = {};
  public WrapSVGText(text: string, index: number) {
    if (text == null) return [];
    if (this.wrapBuffer[text]) return this.wrapBuffer[text][index];

    let words = text.replace(/\n/g, ' ').split(' ');
    // extend hyphen
    for (let i = 0; i < words.length; i++) {
      const index = words[i].indexOf('-');
      if (index > 0) {
        words.splice(i+1, 0, words[i].substring(index+1));
        words[i] = words[i].substring(0, index+1);
      }
    }
    // compress if possible
    for (let i = 0; i < words.length-1; i++) {
      if (words[i].length + words[i+1].length < 10) {
        words[i] += ' ' + words[i+1];
        words.splice(i+1, 1);
      }
    }
    this.wrapBuffer[text] = [];
    const offset = words.length <= 2 ? 1 : 0;
    for (let i = 0; i < words.length; i++) {
      this.wrapBuffer[text][i+offset] = words[i];
    }

    return this.WrapSVGText(text, index);
  }

  private setColors(isDarkMode: boolean) {
    if (isDarkMode) {
      this.StrokeColor = 'white';
    }
    else {
      this.StrokeColor = 'black';
    }
  }
}
