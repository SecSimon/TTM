import { Component, Input, OnInit, Output, EventEmitter, ViewChild, HostListener } from '@angular/core';
import { ThemeService } from '../../util/theme.service';

import { v4 as uuidv4 } from 'uuid';
import { fabric } from "fabric";
import { DFDElement, ElementTypeIDs, StencilType, DFDContainer, DataFlow, DFDElementRef, DFDContainerRef, DataFlowEntity } from '../../model/dfd-model';
import { DataService } from '../../util/data.service';
import { ResizedEvent } from 'angular-resize-event';

import { CtxDiagram, Diagram, DiagramTypes, HWDFDiagram } from '../../model/diagram';
import { DialogService } from '../../util/dialog.service';
import { DataChangedTypes, IContainer, IElementType, IProperty, PropertyEditTypes, ViewElementBase } from '../../model/database';
import { MatMenuTrigger } from '@angular/material/menu';
import { IDragDropData } from '../stencil-palette/stencil-palette.component';
import { StringExtension } from '../../util/string-extension';
import { ContextElement, ContextElementRef, ContextElementTypes, ContextElementTypeUtil, ContextFlow, Device, DeviceInterfaceNames, FlowArrowPositions, FlowLineTypes, FlowTypes, ICanvasFlow, MobileApp, SystemContextContainer, SystemContextContainerRef } from '../../model/system-context';
import { INavigationNode } from '../../shared/components/nav-tree/nav-tree.component';

import { faArrowsAltH, faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { LocalStorageService, LocStorageKeys } from '../../util/local-storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ThreatRuleGroup } from '../../model/threat-model';
import { NodeTypes } from '../modeling.component';

interface IKeyValuePair {
  key: any;
  value: any;
}

interface IFontSizeConfig {
  Name: number;
  Type: number;
}

export enum MouseModes {
  Mouse = 'mouse',
  Pan = 'pan',
  Move = 'move'
}

enum MouseMovingStates {
  None = 0,
  Selecting = 1,
  Moving = 2
}

enum CProps {
  canvasID = 'canvasID',
  name = 'name',
  ID = 'ID',
  elementTypeID = 'elementTypeID',
  myType = 'myType',
  fa = 'fa', // flow anchor
  dfs = 'dfs', // data flows
  bendFlow = 'bendFlow',

  subTargetCheck = 'subTargetCheck',
  objectCaching = 'objectCaching',
  selectable = 'selectable',
  lockMovementX = 'lockMovementX',
  lockMovementY = 'lockMovementY',
  lockScalingX = 'lockScalingX',
  lockScalingY = 'lockScalingY',
  hasBorders = 'hasBorders',
  hasControls = 'hasControls',
  transparentCorners = 'transparentCorners',
  cornerColor = 'cornerColor',
  cornerSize = 'cornerSize',
  opacity = 'opacity',
  originX = 'originX',
  originY = 'originY',
  _controlsVisibility = '_controlsVisibility',
  path = 'path',
  pathOffset = 'pathOffset',
  strokeDashArray = 'strokeDashArray',
  visible = 'visible',
  perPixelTargetFind = 'perPixelTargetFind',
  targetFindTolerance = 'targetFindTolerance',
  fontSize = 'fontSize',

  p0ID = 'p0ID',
  p1ID = 'p1ID',
  p2ID = 'p2ID',
  arrowEID = 'arrowEID',
  arrowSID = 'arrowSID',
  textID = 'textID',
  textObjID = 'textObjID',
  t0ID = 't0ID',
  flowID = 'flowID',
  fa1 = 'fa1', // flow anchor
  fe1 = 'fe1', // flow endpoint
  fa2 = 'fa2',
  fe2 = 'fe2'
}

enum CTypes {
  Process = 'P',
  DataStore = 'DS',
  DataStoreTop = 'DS-T',
  DataStoreBottom = 'DS-B',
  ExternalEntity = 'EE',
  TrustArea = 'TA',
  PhysicalLink = 'PL',
  Interface = 'I',
  DataFlowLine = 'DF-L',
  DataFlowCircle = 'DF-C',
  DataFlowPoint = 'DF-P',
  DataFlowArrowE = 'DF-AE',
  DataFlowArrowS = 'DF-AS',

  Device = 'DEV',
  DeviceReference = 'DEV-REF',
  DeviceLabel1 = 'DEV-LBL1',
  DeviceLabel1Line = 'DEV-LBL1-L',
  DeviceLabel2 = 'DEV-LBL2',
  DeviceLabel2Line = 'DEV-LBL2-L',
  DeviceLabel3 = 'DEV-LBL3',
  DeviceLabel3Line = 'DEV-LBL3-L',
  DeviceLabel4 = 'DEV-LBL4',
  DeviceLabel4Line = 'DEV-LBL4-L',

  MobileApp = 'APP',
  AppLabel1 = 'APP-LBL1',
  AppLabel1Line = 'APP-LBL1-L',
  AppLabel2 = 'APP-LBL2',
  AppLabel2Line = 'APP-LBL2-L',
  AppLabel3 = 'APP-LBL3',
  AppLabel3Line = 'APP-LBL3-L',
  AppLabel4 = 'APP-LBL4',
  AppLabel4Line = 'APP-LBL4-L',

  Interactor = 'ACT',
  InteractorHead = 'ACT-H',
  InteractorBody = 'ACT-B',
  InteractorArms = 'ACT-A',
  InteractorLeg1 = 'ACT-L1',
  InteractorLeg2 = 'ACT-L2',

  DeviceInterface = 'DEV-IF',

  SystemUseCase = 'SYSUC',
  SystemExternalEntity = 'SYSEE',

  Annotation = 'Annotation',
  ElementBorder = 'ElementBorder',
  ElementName = 'ElementName',
  ElementType = 'ElementType',
  ElementPhyElement = 'ElementPhyElement',
  FlowAnchor = 'FA',
  TextPosPoint = 'TXT-POS-P',

  GridLine = 'GL'
}

export enum AnchorDirections {
  North = 'n',
  East = 'e',
  South = 's',
  West = 'w',
  NorthWest = 'n-w',
  NorthEast = 'n-e',
  SouthEast = 's-e',
  SouthWest = 's-w',
  EasternNorth = 'en',
  EasternSouth = 'es',
  WesternNorth = 'wn',
  WesternSouth = 'ws',
  NorthernWest = 'nw',
  NorthernEast = 'ne',
  SouthernWest = 'sw',
  SouthernEast = 'se'
}

export abstract class CanvasBase {
  public static BackgroundColorDark = '#1E1E1E';
  public static BackgroundColorLight = '#FFFFFF';
  public static GridSize = 20;

  private mouseMode: MouseModes = MouseModes.Mouse;
  private xMax: number = null;
  private yMax: number = null;
  protected copyID: string;
  protected isInitalized = false;
  protected isDarkMode = false;
  protected blockSelectionChangedAfterReceive = false;
  protected blockSelectionChangedAfterSend = false;
  protected tmpFlowLine = null; // flow to create
  protected tmpFlowLineEndpoint = null; // first object to attach the flow
  protected blockCreateLine = false;
  protected fontSizeConfigs: IFontSizeConfig[] = [
    { Name: 11, Type: 8 },
    { Name: 12, Type: 9 },
    { Name: 14, Type: 10 },
    { Name: 16, Type: 12 },
    { Name: 18, Type: 14 },
    { Name: 20, Type: 16 },
  ];
  protected get currentFontSizeConfig(): IFontSizeConfig { return this.fontSizeConfigs[this.FontSizeConfigIndex]; }

  public Canvas: fabric.Canvas;
  public StrokeColor = 'black';
  public StrokeWidth = 2;
  public BackgroundColor = 'black';
  public CanvasScreenWidth: number = 0;
  public CanvasScreenHeight: number = 0;
  public SaveImageWithGrid: boolean = false;

  public get CanCopy(): boolean { return this.copyID != null; }

  public get MouseMode(): MouseModes { return this.mouseMode; }
  public set MouseMode(val: MouseModes) {
    this.mouseMode = val;
    this.Canvas.selection = false;
    if (val == MouseModes.Mouse) { 
      if (this.Canvas.isDragging) {
        this.arrowVisibilityRestore();
        this.Canvas.isDragging = false; 
      }
    }
    else if (val == MouseModes.Pan) { // pan
      this.arrowVisibilityStore();
      this.Canvas.isDragging = true;
    }
    else { // move
      this.SelectedElement = null;
      this.Canvas.selection = true;
      this.mouseMovingState = MouseMovingStates.Selecting;
    }
  }

  public get ShowGrid(): boolean {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_SHOW_GRID);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType] != null) return arr[this.Diagram.DiagramType];
    return true;
  }
  public set ShowGrid(val: boolean) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_SHOW_GRID);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    arr[this.Diagram.DiagramType] = val;

    let setGridLine = (obj: any) => {
      if (obj[CProps.myType] == CTypes.GridLine) obj[CProps.visible] = val;
    };
    let checkObjects = (objs: any[]) => {
      objs.forEach(x => {
        setGridLine(x);
        if (x._objects) checkObjects(x._objects);
      });
    };
    checkObjects(this.Canvas.getObjects());

    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_SHOW_GRID, JSON.stringify(arr));
    this.Canvas.requestRenderAll();
    this.onCanvasModified();
  }

  public get StickToGrid(): boolean {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_STICK_GRID);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType] != null) return arr[this.Diagram.DiagramType];
    return true;
  }
  public set StickToGrid(val: boolean) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_STICK_GRID);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    arr[this.Diagram.DiagramType] = val;
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_STICK_GRID, JSON.stringify(arr));
  }

  private mouseMovingState: MouseMovingStates = MouseMovingStates.None;

  public get FlowArrowPosition(): FlowArrowPositions {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_POS);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType]) return Number(arr[this.Diagram.DiagramType]);
    if (this.Diagram.DiagramType == DiagramTypes.Context) return FlowArrowPositions.Both;
    else if (this.Diagram.DiagramType == DiagramTypes.UseCase) return FlowArrowPositions.End;
    return FlowArrowPositions.Initiator;
  }
  public set FlowArrowPosition(val: FlowArrowPositions) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_POS);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    if ([FlowArrowPositions.Both, FlowArrowPositions.Initiator].includes(val)) {
      if (this instanceof HWDFCanvas) arr[this.Diagram.DiagramType] = FlowArrowPositions.Initiator;
      else arr[this.Diagram.DiagramType] = FlowArrowPositions.Both;
    }
    else arr[this.Diagram.DiagramType] = val;

    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_POS, JSON.stringify(arr));
  }

  public get BendFlow(): boolean {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_BEND);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType] != null) return arr[this.Diagram.DiagramType];
    if (this.Diagram.DiagramType == DiagramTypes.DataFlow) return true;
    return false;
  }
  public set BendFlow(val: boolean) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_BEND);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    arr[this.Diagram.DiagramType] = val;

    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_BEND, JSON.stringify(arr));
  }

  public get AnchorCount(): number {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ANCHOR_COUNT);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType] != null) return arr[this.Diagram.DiagramType];
    return 4;
  }
  public set AnchorCount(val: number) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ANCHOR_COUNT);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    arr[this.Diagram.DiagramType] = val;

    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_ANCHOR_COUNT, JSON.stringify(arr));

    this.Canvas.getObjects().forEach(obj => {
      if (obj['_objects']) {
        const fas = obj['_objects'].filter(x => x[CProps.myType] == CTypes.FlowAnchor);
        fas.forEach(fa => {
          if (val == 8) fa.set(CProps.visible, true);
          else if ([AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].includes(fa[CProps.fa])) {
            fa.set(CProps.visible, false);
          }
        });
      }
    });
  }

  public get CanSetAnchorCount(): boolean {
    return [DiagramTypes.Context, DiagramTypes.DataFlow].includes(this.Diagram.DiagramType);
  }

  public get ShowName(): boolean {
    let arr = null;
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_NAME);
    if (arrStr) arr = JSON.parse(arrStr);
    if (arr && arr[this.Diagram.DiagramType] != null) return arr[this.Diagram.DiagramType];
    if (this.Diagram.DiagramType == DiagramTypes.DataFlow) return true;
    return false;
  }
  public set ShowName(val: boolean) {
    let arrStr = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_NAME);
    let arr = {};
    if (arrStr != null) arr = JSON.parse(arrStr);
    arr[this.Diagram.DiagramType] = val;

    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_ARROW_NAME, JSON.stringify(arr));
  }

  public get FontSizeConfigIndex(): number {
    const res = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_TEXTSIZE_INDEX);
    if (res == null) return 3;
    return Number(res);
  }
  public set FontSizeConfigIndex(val: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_TEXTSIZE_INDEX, String(val));
    this.changeFontSize();
  }

  public get ObjectCountToInit(): string {
    if (!this.Diagram.Elements) return '';
    let res = this.Diagram.Elements.GetChildrenFlat().filter(x => !x.UserCheckedElement).length;
    return res > 0 ? res.toString() : '';
  }

  public get IsCreatingFlow(): boolean { return this.tmpFlowLine != null; }

  public get IsObjectSelected(): boolean { return this.Canvas?.getActiveObjects().length > 0; }

  public Diagram: Diagram;

  public get SelectedElement(): ViewElementBase {
    let objs = this.Canvas?.getActiveObjects();
    if (objs?.length == 1) {
      if (objs[0][CProps.ID]) return this.getViewBaseElement(this.Canvas.getActiveObject()[CProps.ID]);
      if (objs[0][CProps.flowID]) return this.getViewBaseElement(this.getCanvasElementByCanvasID(objs[0][CProps.flowID])[CProps.ID]);
    }

    return null;
  }
  public set SelectedElement(val: ViewElementBase) {
    if (!this.Canvas) return;
    if (this.MouseMode == MouseModes.Move) return;
    if (this.blockSelectionChangedAfterSend) return;

    this.blockSelectionChangedAfterReceive = true;
    setTimeout(() => {
      this.blockSelectionChangedAfterReceive = false;
    }, 250);

    let activeObj = this.Canvas.getActiveObject();
    if (activeObj && activeObj[CProps.ID] == val?.ID) return;

    if (val == null && this.SelectedElement) {
      this.Canvas.discardActiveObject();
      this.onCanvasModified();
      return;
    }

    this.Canvas.discardActiveObject();
    let objs = this.Canvas.getObjects();
    try {
      let obj = objs.find(x => x[CProps.ID] == val.ID);
      this.Canvas.setActiveObject(obj);
      if (obj[CProps.elementTypeID] == ElementTypeIDs.DataFlow) this.setFlowSelected(obj, true);
    } 
    catch (error) {
    }

    this.Canvas.renderAll();
  }

  public SelectionChanged = new EventEmitter<ViewElementBase>();
  public NavTreeChanged = new EventEmitter();

  constructor(dia: Diagram, protected dataService: DataService, protected theme: ThemeService, protected dialog: DialogService, 
    protected locStorage: LocalStorageService, protected translate: TranslateService) {
    this.Diagram = dia;
  }

  public SetMouse() {
    this.MouseMode = MouseModes.Mouse;
  }

  public SetPan() {
    this.MouseMode = MouseModes.Pan;
  }

  public SetMove() {
    this.MouseMode = MouseModes.Move;
  }

  public Save() {
    this.ToJSONString();
  }

  public TextIncrease() {
    const obj = this.getCanvasElementByID(this.SelectedElement.ID);
    let etype = null, etxt = null, ephy = null;
    if (obj._objects) {
      etype = obj._objects.find(x => x[CProps.myType] == CTypes.ElementType);
      ephy = obj._objects.find(x => x[CProps.myType] == CTypes.ElementPhyElement);
      etxt = obj._objects.find(x => x[CProps.myType] == CTypes.ElementName);
    }
    else if (obj[CProps.myType] == CTypes.DataFlowLine) { etxt = this.getCanvasElementByCanvasID(obj[CProps.textID]); }

    let newConfig: IFontSizeConfig = null;
    if (etype) newConfig = this.fontSizeConfigs[this.fontSizeConfigs.findIndex(x => x.Type == etype[CProps.fontSize])+1];
    else if (etxt) newConfig = this.fontSizeConfigs[this.fontSizeConfigs.findIndex(x => x.Name == etxt[CProps.fontSize])+1];

    if (newConfig) {
      if (etxt) etxt.set(CProps.fontSize, obj[CProps.myType] != CTypes.TrustArea ? newConfig.Name : newConfig.Type);
      if (etype) etype.set(CProps.fontSize, newConfig.Type);
      if (ephy) ephy.set(CProps.fontSize, newConfig.Type);
      this.Canvas.requestRenderAll();
      this.onCanvasModified();
    }
  }

  public TextDecrease() {
    const obj = this.getCanvasElementByID(this.SelectedElement.ID);
    let etype = null, etxt = null, ephy = null;
    if (obj._objects) {
      etype = obj._objects.find(x => x[CProps.myType] == CTypes.ElementType);
      ephy = obj._objects.find(x => x[CProps.myType] == CTypes.ElementPhyElement);
      etxt = obj._objects.find(x => x[CProps.myType] == CTypes.ElementName);
    }
    else if (obj[CProps.myType] == CTypes.DataFlowLine) { etxt = this.getCanvasElementByCanvasID(obj[CProps.textID]); }

    let newConfig: IFontSizeConfig = null;
    if (etype) newConfig = this.fontSizeConfigs[this.fontSizeConfigs.findIndex(x => x.Type == etype[CProps.fontSize])-1];
    else if (etxt) newConfig = this.fontSizeConfigs[this.fontSizeConfigs.findIndex(x => x.Name == etxt[CProps.fontSize])-1];

    if (newConfig) {
      if (etxt) etxt.set(CProps.fontSize, obj[CProps.myType] != CTypes.TrustArea ? newConfig.Name : newConfig.Type);
      if (etype) etype.set(CProps.fontSize, newConfig.Type);
      if (ephy) ephy.set(CProps.fontSize, newConfig.Type);
      this.Canvas.requestRenderAll();
      this.onCanvasModified();
    }
  }

  public SendToBack() {
    this.Canvas.getActiveObjects().forEach(x => this.Canvas.sendToBack(x));
    this.SelectedElement = null;
    this.onCanvasModified();
  }

  public SendBackwards() {
    this.Canvas.getActiveObjects().forEach(x => this.Canvas.sendBackwards(x));
    this.SelectedElement = null;
    this.onCanvasModified();
  }

  public BringForward() {
    this.Canvas.getActiveObjects().forEach(x => this.Canvas.bringForward(x));
    this.onCanvasModified();
  }

  public BringToFront() {
    this.Canvas.getActiveObjects().forEach(x => this.Canvas.bringToFront(x));
    this.onCanvasModified();
  }

  public AddAnnotation() {
    let text = new fabric.IText('Text Annotation', {
      left: 100, top: 40, fill: this.StrokeColor, cavnasID: uuidv4(), myType: CTypes.Annotation, fontSize: 16, transparentCorners: true
    });
    this.Canvas.add(text);
    this.onCanvasModified();
  }

  public SelectNextUninitObject() {
    let objs = this.Diagram.Elements.GetChildrenFlat().filter(x => !x.UserCheckedElement);
    let obj = objs[objs.length - 1];
    obj.UserCheckedElement = true;
    this.SelectedElement = obj;
    this.SelectionChanged.emit(obj);
  }

  public AddThreat() {
    if (this.SelectedElement) {
      let map = this.dataService.Project.CreateAttackScenario(this.Diagram.ID, false);
      map.SetMapping('', [], this.SelectedElement, [this.SelectedElement], null, null, null, null);
      map.IsGenerated = false;
      this.dialog.OpenAttackScenarioDialog(map, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteAttackScenario(map);
        }
      });
    }
  }

  public AddTestCase() {
    if (this.SelectedElement) {
      const tc = this.dataService.Project.CreateTestCase();
      tc.AddLinkedElement(this.SelectedElement);
      this.dialog.OpenTestCaseDialog(tc, true).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteTestCase(tc);
        }
      });
    }
  }

  public AddCountermeasure() {
    if (this.SelectedElement) {
      let map = this.dataService.Project.CreateCountermeasure(this.Diagram.ID, false);
      map.SetMapping(null, [this.SelectedElement], []);
      this.dialog.OpenCountermeasureDialog(map, true, this.Diagram.Elements.GetChildrenFlat()).subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteCountermeasure(map);
        }
      });
    }
  }

  public CancelCreateFlow() {
    if (this.tmpFlowLine) {
      this.Canvas.remove(this.tmpFlowLine);
      this.tmpFlowLine = null;
    }
  }

  public abstract CopyElement();

  public abstract PasteElement();

  public SetZoom(zoom: number, x = null, y = null) {
    if (!!x && !!y) {
      this.Canvas.zoomToPoint({ x: x, y: y }, zoom);
    }
    else {
      this.Canvas.setZoom(zoom);
    }
  }

  public OnResized(event: ResizedEvent, container, adjustScrollbar = true) {
    this.initializeCanvas(container);
    if (this.Canvas) {
      const size = this.getCanvasSize();
      this.CanvasScreenWidth = event.newRect.width;
      this.CanvasScreenHeight = event.newRect.height - 5;
      if (adjustScrollbar) {
        const newWid = event.newRect.width > size[2] ? event.newRect.width : size[2];
        const newHei = event.newRect.height > size[3] ? event.newRect.height : size[3];
        this.Canvas.setWidth(newWid);
        this.Canvas.setHeight(newHei-5);
      }
      else {
        this.Canvas.setWidth(event.newRect.width);
        this.Canvas.setHeight(event.newRect.height-5);
      }
      this.Canvas.renderAll();
    }
  }

  public OnOuterCanvasMouseDown(event) {
    if (event.buttons == 4) {
      this.MouseMode = MouseModes.Pan;
      this.Canvas.lastPosX = event.clientX;
      this.Canvas.lastPosY = event.clientY;
    }
  }

  public OnOuterCanvasMouseUp(event) {
    if (this.MouseMode == MouseModes.Pan) {
      this.MouseMode = MouseModes.Mouse;
    }
  }

  public OnDeleteElement(element: ViewElementBase) {
    this.dialog.OpenDeleteObjectDialog(element).subscribe(res => {
      if (res) this.deleteElement(element.ID);
    });
  }

  public ToJSONString(beautify: boolean = false): string {
    let res = JSON.stringify(this.Canvas.toJSON(Object.keys(CProps).filter(x => typeof x === 'string')), null, beautify ? 2 : 0);
    this.Diagram.Canvas = res;
    return res;
  }

  public FromJSONString(val: string) {
    this.Canvas.loadFromJSON(JSON.parse(val), (event) => {
      if (event != null) console.error(event);
      else {
        this.Diagram.Canvas = val;
        this.onFromJSONString();
      }
    });
  }

  public GetImage() {
    return this.Canvas.toDataURL({
      format: 'image/png'
    });
  }

  public SaveImage() {
    // work with copy of diagram
    const diagram = Diagram.FromJSON(JSON.parse(JSON.stringify(this.Diagram.ToJSON())), this.dataService.Project, this.dataService.Project.Config);
    const width = 1500;
    const height = 750;
    const div = document.createElement('div');
    div.style.width = width.toString() + 'px';
    div.style.height = height.toString() + 'px';
    div.style.pointerEvents = 'none';
    let event = new ResizedEvent(new DOMRectReadOnly(0, 0, width, height), null);
    let dia: CanvasBase;
    if (diagram instanceof CtxDiagram) dia = new CtxCanvas(diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate, diagram.IsUseCaseDiagram ? NodeTypes.UseCase : NodeTypes.Context);
    else dia = new HWDFCanvas(diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate);
    dia.OnResized(event, div);
    dia.PrintMode(this.SaveImageWithGrid);
    const size = dia.FitToCanvas(width);
    event = new ResizedEvent(new DOMRectReadOnly(0, 0, width+10, size[1]+10), null);
    div.style.height = size[1].toString() + 'px';
    dia.OnResized(event, div, false);

    const newTab = window.open();
    const img = new Image();
    img.onload = () => {
      newTab.document.body.append(img);
      if (this.theme.IsDarkMode) dia.SetColors(true);
    }
    img.src = dia.GetImage();

    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);

    downloadLink.href = img.src;
    downloadLink.target = '_self';
    downloadLink.download = this.Diagram.Name+'.png';
    downloadLink.click(); 
    document.body.removeChild(downloadLink);
  }

  public SetColors(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
    if (isDarkMode) {
      this.StrokeColor = 'white';
      this.BackgroundColor = CanvasBase.BackgroundColorDark;
    }
    else {
      this.StrokeColor = 'black';
      this.BackgroundColor = CanvasBase.BackgroundColorLight;
    }

    this.setCanvasColor();
  }

  public PrintMode(showGrid: boolean) {
    this.SetColors(false);

    const setColor = (obj: any) => {
      if (obj.stroke && obj.stroke == this.theme.Primary) {
        obj.set('stroke', this.StrokeColor);
      }
      if (obj.fill && obj.fill == this.theme.Primary) {
        let fill = '';
        if (obj.fill == 'white') fill = 'black';
        else if (obj.fill == 'black' || obj.fill == 'rgb(0,0,0)') fill = 'white';
        else if (obj.fill == 'transparent') fill = obj.fill;
        else if (obj.fill == CanvasBase.BackgroundColorDark) fill = CanvasBase.BackgroundColorLight;
        else if (obj.fill == CanvasBase.BackgroundColorLight) fill = CanvasBase.BackgroundColorDark;
        else if (obj.fill == this.theme.Primary) fill = this.theme.Primary;
        obj.set('fill', fill);
      }
      if (obj.cornerColor && obj.cornerColor == this.theme.Primary) {
        let col = '';
        if (obj.cornerColor == 'transparent') col = 'transparent';
        else if (obj.cornerColor == 'white') col = 'black';
        else if (obj.cornerColor == 'black') col = 'white';
        obj.set('cornerColor', col);
      }
    };
    const setGridLine = (obj: any) => {
      if (obj[CProps.myType] == CTypes.GridLine) {
        obj[CProps.visible] = showGrid;
      }
    };
    const checkObjects = (objs: any[]) => {
      objs.forEach(x => {
        setColor(x);
        setGridLine(x);
        if (x._objects) checkObjects(x._objects);
      });
    };
    checkObjects(this.Canvas.getObjects());
  }

  public FitToCanvas(width: number, height: number = 0) {
    const size = this.getCanvasSize();
    let xMin = size[0], yMin = size[1], xMax = size[2], yMax = size[3]; 
    let vpt = this.Canvas.viewportTransform;
    vpt[4] = -xMin;
    vpt[5] = -yMin;

    let zoom = width / (xMax - xMin); // width / actual width
    let newHeight = (yMax - yMin) * zoom;

    if (height > 0 && newHeight > height) {
      const downscale = height / newHeight;
      zoom *= downscale;
      width *= downscale;
      newHeight *= downscale;
    }

    this.Canvas.setZoom(zoom);

    this.Canvas.requestRenderAll();
    return [width, newHeight];
  }

  protected initializeCanvas(cc: HTMLElement): boolean {
    if (this.isInitalized) return false;
    this.isInitalized = true;
    let cElement = document.createElement('canvas');
    cElement.style.marginTop = '1px';
    cc.appendChild(cElement);
    this.Canvas = new fabric.Canvas(cElement);
    this.Canvas.selection = false;
    this.Canvas.selectionFullyContained = true;
    this.Canvas.targetFindTolerance = 2;
    this.Canvas.uniformScaling = false; // scale not proportionally

    this.Canvas.setWidth(cc.clientWidth);
    this.CanvasScreenWidth = cc.clientWidth;
    this.CanvasScreenHeight = cc.clientHeight - 5;
    this.Canvas.setHeight(cc.clientHeight - 5);
    this.SetColors(this.theme.IsDarkMode);
    this.theme.ThemeChanged.subscribe((isDark) => {
      this.SetColors(isDark);
    });

    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = this.StrokeColor; // this.theme.Primary;
    fabric.Object.prototype.cornerStyle = 'circle';
    fabric.Object.prototype.controls.deleteControl = new fabric.Control({
      x: 0.5, y: -0.5, offsetX: 0, offsetY: 0, cursorStyle: 'pointer',
      mouseUpHandler: (e, t) => {
        let element: ViewElementBase = null;
        if (t['target'][CProps.ID] && t['target'][CProps.elementTypeID] != ElementTypeIDs.DataFlow) {
          element = this.getViewBaseElement(t['target'][CProps.ID]);
        }
        else if (t['target'][CProps.elementTypeID] == ElementTypeIDs.DataFlow || t['target'][CProps.flowID]) {
          let flow = t['target'][CProps.elementTypeID] == ElementTypeIDs.DataFlow ? t['target'] : this.getCanvasElementByCanvasID(t['target'][CProps.flowID]);
          element = this.getViewBaseElement(flow[CProps.ID]);
        }

        if (element && element.ID != this.Diagram.Elements['ID']) {
          this.OnDeleteElement(element);
        }
        else {
          this.Canvas.remove(t['target']);
        }

        this.Canvas.requestRenderAll();
      },
      render: this.renderIcon,
    });

    fabric.Canvas.prototype.getAbsoluteCoords = function (object) {
      return {
        left: object.left + this._offset.left,
        top: object.top + this._offset.top
      };
    }

    document.addEventListener('keydown', (e) => {
      if (e.key == 'Escape') {
        this.CancelCreateFlow();
      }
    });

    this.Canvas.on('mouse:wheel', (opt) => this.onCanvasMouseWheel(opt));
    this.Canvas.on('mouse:move', (opt) => this.onCanvasMouseMove(opt));
    this.Canvas.on('mouse:down', (opt) => this.onCanvasMouseDown(opt));
    this.Canvas.on('mouse:up', (opt) => this.onCanvasMouseUp(opt));
    this.Canvas.on('mouse:over', (opt) => this.onCanvasMouseOver(opt));
    this.Canvas.on('mouse:out', (opt) => this.onCanvasMouseOut(opt));
    this.Canvas.on('drop', (opt) => this.onCanvasDrop(opt));

    this.Canvas.on('object:modified', (opt) => this.onCanvasModified());
    //this.canvas.on('object:rotated', (opt) => this.onCanvasModified(opt));
    //this.canvas.on('object:scaled', (opt) => this.onCanvasModified(opt));
    //this.canvas.on('object:moved', (opt) => this.onCanvasModified(opt));
    //this.canvas.on('object:skewed', (opt) => this.onCanvasModified(opt));
    //this.Canvas.on('object:moved', (opt) => this.onCanvasObjectMoved(opt));
    this.Canvas.on('object:moving', (opt) => this.onCanvasObjectMoving(opt));
    this.Canvas.on('object:scaling', (opt) => {
      this.blockCheckingIntersection = true;
    });

    this.Canvas.on('selection:updated', (opt) => this.onCanvasSelectionChanged(opt));
    this.Canvas.on('selection:created', (opt) => this.onCanvasSelectionChanged(opt));
    this.Canvas.on('selection:cleared', (opt) => this.onCanvasSelectionChanged(opt));

    this.Diagram.Elements.GetChildrenFlat().forEach(x => {
      x.NameChanged.subscribe(y => this.changeObjectName(x.ID));
      x.OutOfScopeChanged.subscribe(y => this.changeObjectBorder(x.ID));
      if (x instanceof DFDElement) {
        x.TypeChanged.subscribe(y => this.changeObjectType(x.ID, y.Name));
        x.PhysicalElementChanged.subscribe(y => this.changeObjectPhysicalElement(x.ID, y));
      }
      else if (x instanceof ContextElement) x.TypeChanged.subscribe(y => this.changeObjectType(x.ID, ContextElementTypeUtil.ToString(y)));
    });

    if (this.Diagram.Canvas) { this.FromJSONString(this.Diagram.Canvas); }

    const cSize = 3000;

    for (let i = -cSize; i < cSize; i += CanvasBase.GridSize) {
      this.Canvas.add(new fabric.Line([i, -cSize, i, cSize], { stroke: this.StrokeColor, selectable: false, evented: false, myType: CTypes.GridLine, opacity: 0.07, visible: this.ShowGrid }));
      this.Canvas.add(new fabric.Line([-cSize, i, cSize, i], { stroke: this.StrokeColor, selectable: false, evented: false, myType: CTypes.GridLine, opacity: 0.07, visible: this.ShowGrid }));
    }


    this.Canvas.getObjects().filter(x => x[CProps.myType] == CTypes.GridLine).forEach(x => this.Canvas.sendToBack(x));

    const zoom = this.locStorage.Get(LocStorageKeys.PAGE_MODELING_DIAGRAM_ZOOM);
    if (zoom != null) { this.SetZoom(Number(zoom)); }

    return true;
  }

  private subscriptionsLineType = [];
  private subscriptionsFlowAnchor = [];
  protected onFromJSONString() {
    this.setCanvasColor();

    let dfs = [];
    let arrows = [];

    const createAnchor = (left, top, fa) => {
      const r = 6.5;
      let c = new fabric.Circle({ 
        left: left, top: top, radius: r,
        fill: this.StrokeColor, opacity: 0.15
      });
      const xCenter = left + r;
      const yCenter = top + r;
      const offset = 4.33; // Math.acos(Math.PI/4)*r;
      let l1 = new fabric.Line([xCenter-offset, yCenter-offset, xCenter+offset, yCenter+offset], { stroke: this.theme.Primary, selectable: false });
      let l2 = new fabric.Line([xCenter-offset, yCenter+offset, xCenter+offset, yCenter-offset], { stroke: this.theme.Primary, selectable: false });

      return new fabric.Group([c, l1, l2], {
        left: left, top: top,
        hasControls: false,
        hasBorders: false,
        lockRotation: true,
        opacity: 0,
        fa: fa, myType: CTypes.FlowAnchor, canvasID: uuidv4()
      });
    };
    // update flow anchor tpye
    this.Canvas.getObjects().forEach(x => {
      if (x['_objects']) {
        let fas = x['_objects'].filter(x => x[CProps.fa] != null);
        fas.forEach(fa => {
          if (!fa['_objects']) {
            const newFa = createAnchor(x.left + x.width/2 + fa.left, x.top + x.height/2 + fa.top, fa[CProps.fa]);
            this.Canvas.add(newFa);
            const index = x['_objects'].indexOf(fa);
            x['_objects'].splice(index, 1);
            x.addWithUpdate(newFa);
            this.Canvas.remove(fa);
            console.log('update flow anchor');
          }
          else if (x[CProps.myType] == CTypes.Interactor) {
            // this is a fix, but I don't know what the problem causes (all points at one position)
            let left = -6.5;
            let top = -19.29;
            if (fa[CProps.fa] == AnchorDirections.East) left = 19;
            else if (fa[CProps.fa] == AnchorDirections.West) left = -28.5;
            else if (fa[CProps.fa] == AnchorDirections.North) top = -38.79;
            else if (fa[CProps.fa] == AnchorDirections.South) top = 3.71;
            fa['left'] = left;
            fa['top'] = top;
            fa.setCoords();
          }
        });
      }
    });

    // set background fill
    // this.Canvas.getObjects().forEach(x => {
    //   if (x['_objects']) {
    //     const bg = x['_objects'].find(x => x[CProps.myType] == CTypes.ElementBorder);
    //     if (bg) {
    //       bg.set('fill', this.BackgroundColor);
    //     }
    //   }
    // });

    this.Canvas.getObjects().forEach(x => {
      // check if element still exists
      let element: ViewElementBase = null;
      if (x[CProps.ID]) { element = this.getViewBaseElement(x[CProps.ID]); }
      else if (x[CProps.flowID]) {
        let ce = this.getCanvasElementByCanvasID(x[CProps.flowID]);
        if (ce && ce[CProps.ID]) {
          element = this.getViewBaseElement(ce[CProps.ID]);
          if (element && (element instanceof ContextFlow || element instanceof DataFlow)) {
            if (!this.subscriptionsLineType.includes(element.ID)) {
              (element as ICanvasFlow).LineTypeChanged?.subscribe(x => this.flowChangeLineType(element.ID, x));
              (element as ICanvasFlow).ArrowPosChanged?.subscribe(y => this.flowUpdateFlowArrow(element.ID));
              (element as ICanvasFlow).BendFlowChanged?.subscribe(y => this.flowChangeBending(element.ID, y));
              (element as ICanvasFlow).DirectionChanged?.subscribe(y => this.flowChangeDirection(element.ID));
              (element as ICanvasFlow).AnchorChanged?.subscribe(y => this.flowChangeAnchor(element.ID, y));
              this.subscriptionsLineType.push(element.ID);
            }
          }
        }
      }

      if (x['_objects']) {
        let fas = x['_objects'].filter(x => x[CProps.fa] != null);
        fas.forEach(fa => {
          if (!this.subscriptionsFlowAnchor.includes(fa[CProps.canvasID])) {
            fa.on('mousedown', (e) => this.onFlowAnchorHit(e));
            this.subscriptionsFlowAnchor.push(fa[CProps.canvasID]);
          }
        });
      }

      if (element == null && ![CTypes.Annotation, CTypes.TextPosPoint].includes(x[CProps.myType])) {
        this.Canvas.remove(x);
      }
      else {
        if (element) this.changeObjectName(element.ID);
        // update flow arrow direction
        if (x[CProps.elementTypeID] == ElementTypeIDs.DataFlow) {
          dfs.push(x);
        }
        else if ([CTypes.DataFlowArrowE, CTypes.DataFlowArrowS].includes(x[CProps.myType])) {
          arrows.push(x);
        }

        if (!element || (element && !this.subscriptionsScaling.includes(element.ID))) {
          this.subscribeScaling(x);
          if (element) this.subscriptionsScaling.push(element.ID);
        }
      }
    });

    arrows.forEach(oldArrow => {
      let newPath = '';
      for (let i = 0; i < oldArrow.path.length-1; i++) newPath += oldArrow.path[i].join(' ') + ' ';
      newPath += 'z';
      let newArrow = new fabric.Path(newPath, {
        objectCaching: false,originX: 'center', originY: 'center', selectable: false
      });
      newArrow.setControlsVisibility({ mtr: false, mts: false });

      let copyProps = [
        'fill', 'stroke', 'strokeWidth', CProps.canvasID, CProps.flowID, CProps.visible, CProps.myType
      ];
      copyProps.forEach(prop => {
        newArrow[prop] = oldArrow[prop];
      });

      this.Canvas.remove(oldArrow);
      this.Canvas.add(newArrow);
    });

    dfs.forEach(df => {
      // idk why but I create a new path after reload
      let x = df.path[0][1], y = df.path[0][2], px = df.path[1][1], py = df.path[1][2], dx = df.path[1][3], dy = df.path[1][4];
      let path = ['M', x.toString(), y.toString(), 'Q', (px).toString(), (py).toString(), dx.toString(), dy.toString()].join(' ');
      let flow = new fabric.Path(path, {
        fill: '', stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, objectCaching: false, canvasID: df[CProps.canvasID], selectable: true,
        lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, hasBorders: false, hasControls: false, transparentCorners: true, cornerColor: 'transparent', perPixelTargetFind: true
      });

      let copyProps = [
        CProps.ID, CProps.elementTypeID, CProps.myType,
        CProps.strokeDashArray, CProps.arrowEID, CProps.arrowSID, CProps.textID, CProps.bendFlow,
        CProps.p0ID, CProps.p1ID, CProps.p2ID, CProps.fa1, CProps.fe1, CProps.fa2, CProps.fe2, CProps.fontSize
      ];
      copyProps.forEach(prop => {
        flow.set(prop, df[prop]);
      });

      flow.setControlsVisibility({ mtr: false, mts: false });
      this.Canvas.add(flow);
      this.Canvas.remove(df);
      this.flowUpdateText(flow);
      this.flowUpdateFlowArrow(flow[CProps.ID]);

      this.getCanvasElementByCanvasID(flow[CProps.p0ID])?.set('opacity', 0);
      this.getCanvasElementByCanvasID(flow[CProps.p1ID])?.set('opacity', 0);
      this.getCanvasElementByCanvasID(flow[CProps.p2ID])?.set('opacity', 0);


      let arr = this.getCanvasElementByCanvasID(df[CProps.arrowEID]);
      this.Canvas.bringToFront(arr);
      arr = this.getCanvasElementByCanvasID(df[CProps.arrowSID]);
      this.Canvas.bringToFront(arr);
    });

    // updates
    this.Canvas.getObjects().filter(x => x[CProps.myType] == CTypes.DataFlowCircle).forEach(x => x.selectable = false);
    this.Canvas.getObjects().filter(x => [ElementTypeIDs.LogDataStore, ElementTypeIDs.LogProcessing, ElementTypeIDs.LogProcessing, ElementTypeIDs.LogTrustArea].includes(x[CProps.elementTypeID])).forEach(obj => {
      const ele = this.getViewBaseElement(obj[CProps.ID]);
      if (ele['PhysicalElement'] != null) this.changeObjectPhysicalElement(obj[CProps.ID], ele['PhysicalElement']);
    });
    this.Canvas.getObjects().forEach(obj => {
      if (obj['_objects']) {
        const type = obj['_objects'].find(x => x[CProps.myType] == CTypes.ElementType);
        if (type) type.text = type.text.replace('<<', '«').replace('>>', '»');
      }
    });

    this.Canvas.getObjects().forEach(x => this.fireScaling(x));

    // bug fix: flow anchor black after report
    // this.Canvas.getObjects().forEach(obj => {
    //   if (obj['_objects']) {
    //     obj['_objects'].filter(x => x[CProps.myType] == CTypes.FlowAnchor).forEach(x => {
    //       if (x['_objects'] && x['_objects'].length == 3) {
    //         x['_objects'][1]['stroke'] = this.theme.Primary;
    //         x['_objects'][2]['stroke'] = this.theme.Primary;
    //       }
    //     });
    //   }
    // });
    // this.Canvas.getObjects().filter(x => [CTypes.DataFlowCircle, CTypes.DataFlowPoint].includes(x[CProps.myType])).forEach(x => {
    //   x['stroke'] = this.theme.Primary;
    //   x['fill'] = this.theme.Primary;
    // });

    this.Canvas.requestRenderAll();
  }

  protected subscriptionsScaling = [];
  protected abstract subscribeScaling(obj);

  private isSaving = false;
  protected onCanvasModified() {
    this.checkIntersection();
    if (!this.isSaving) {
      this.isSaving = true;
      setTimeout(() => {
        this.isSaving = false;
        this.Save();
      }, 1000);
    }
  }

  protected onCanvasMouseWheel(opt) {
    if (opt.e.ctrlKey) {
      let delta = opt.e.deltaY;
      let zoom = this.Canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 3) zoom = 3;
      if (zoom < 0.33) zoom = 0.33;
      this.SetZoom(zoom, opt.e.offsetX, opt.e.offsetY);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    }
  }

  protected onCanvasMouseMove(opt) {
    if ((opt.e.buttons == 1 || opt.e.buttons == 4) && this.Canvas.isDragging) {
      // pan canvas
      let vpt = this.Canvas.viewportTransform;
      vpt[4] += opt.e.clientX - this.Canvas.lastPosX;
      if (vpt[4] > 0) vpt[4] = 0;
      vpt[5] += opt.e.clientY - this.Canvas.lastPosY;
      if (vpt[5] > 0) vpt[5] = 0;

      this.Canvas.requestRenderAll();
      this.Canvas.lastPosX = opt.e.clientX;
      this.Canvas.lastPosY = opt.e.clientY;
    }

    if (this.tmpFlowLine) {
      // data flow line follows mouse
      this.tmpFlowLine.set({ x2: opt.absolutePointer.x, y2: opt.absolutePointer.y });
      this.tmpFlowLine.setCoords();
      this.Canvas.requestRenderAll();
    }
  }

  protected onCanvasMouseDown(opt) {
    if (this.Canvas.isDragging) {
      this.Canvas.lastPosX = opt.e.clientX;
      this.Canvas.lastPosY = opt.e.clientY;
    }
  }

  protected onCanvasMouseUp(opt) {
    this.Canvas.setViewportTransform(this.Canvas.viewportTransform);
    if (this.MouseMode == MouseModes.Pan) {
      this.SetMouse();
    }
    else if (this.MouseMode == MouseModes.Mouse) {
      let checkIntersections = this.blockCheckingIntersection;
      this.blockCheckingIntersection = false; 
      if (checkIntersections) this.checkIntersection();

      if (opt.transform?.target && opt.transform.target[CProps.ID] && !this.blockSelectionChangedAfterSend && !this.blockCheckingIntersection) {
        const ele = this.getViewBaseElement(opt.transform.target[CProps.ID]);
        if (ele == this.SelectedElement) {
          if (this.instanceOfContainer(this.SelectedElement)) {
            this.SendToBack();
          }
          this.SelectionChanged.emit(null);
        }
      }
    }
  }

  protected onCanvasMouseOver(opt) {
    if (opt.target) {
      if (opt.target._objects) {
        let target = opt.target;
        let objs = opt.target._objects.filter(x => CProps.fa in x);
        if (opt.target[CProps.myType] == CTypes.FlowAnchor) {
          objs = opt.target.group._objects.filter(x => CProps.fa in x);
          target = opt.target.group;
        }
        if (objs.length > 0) {
          const timer = this.overTimeoutBuffer[target[CProps.canvasID]];
          if (timer) {
            clearTimeout(timer);
            delete this.overTimeoutBuffer[target[CProps.canvasID]];
          }
          objs.forEach(x => {
            x.set(CProps.opacity, 1);
            this.Canvas.bringToFront(x);
          });
          this.Canvas.requestRenderAll();
        }
      }

      if (opt.target[CProps.t0ID] != null) {
        let p = this.getCanvasElementByCanvasID(opt.target[CProps.t0ID]);
        p.set(CProps.opacity, 1);
        //this.Canvas.bringToFront(p);
        this.Canvas.requestRenderAll();
      }
    }
  }

  private overTimeoutBuffer = {};
  protected onCanvasMouseOut(opt) {
    if (opt.target) {
      if (opt.target._objects) {
        let target = opt.target;
        let objs = opt.target._objects.filter(x => CProps.fa in x);
        if (opt.target[CProps.myType] == CTypes.FlowAnchor) {
          objs = opt.target.group._objects.filter(x => CProps.fa in x);
          target = opt.target.group;
        }
        if (objs.length > 0) {
          if (this.overTimeoutBuffer[target[CProps.canvasID]] == null) {
            this.overTimeoutBuffer[target[CProps.canvasID]] = setTimeout(() => {
              objs.forEach(x => {
                x.set(CProps.opacity, 0);
              });
              delete this.overTimeoutBuffer[target[CProps.canvasID]];
              this.Canvas.requestRenderAll();
            }, 500);
          }
        }
      }

      if (opt.target[CProps.t0ID] != null) {
        let p = this.getCanvasElementByCanvasID(opt.target[CProps.t0ID]);
        setTimeout(() => {
          p.set(CProps.opacity, 0);
          this.Canvas.requestRenderAll();
        }, 1500);
      }
    }
  }

  private arrowVisibilityBuffer = {};
  private arrowVisibilityStore() {
    this.arrowVisibilityBuffer = {};
    this.Canvas.getObjects().filter(x => [CTypes.DataFlowArrowE, CTypes.DataFlowArrowS].includes(x[CProps.myType])).forEach(arrow => {
      this.arrowVisibilityBuffer[arrow[CProps.canvasID]] = arrow[CProps.visible];
      arrow.set(CProps.visible, false);
      arrow.set('dirty', true);
    });
    this.Canvas.requestRenderAll();
  }

  private arrowVisibilityRestore() {
    Object.keys(this.arrowVisibilityBuffer).forEach(key => {
      const arrow = this.getCanvasElementByCanvasID(key);
      const val = this.arrowVisibilityBuffer[key];
      arrow.set(CProps.visible, val == null ? true : val);
    });
    this.Canvas.getObjects().forEach(x => this.onMovingObject(x));
    this.Canvas.requestRenderAll();
  }

  protected onCanvasObjectMoving(opt: any) {
    if (this.MouseMode == MouseModes.Move) {
      if (this.mouseMovingState == MouseMovingStates.Selecting) {
        // hide arrows
        this.arrowVisibilityStore();
        this.mouseMovingState = MouseMovingStates.Moving;
      }
      
      this.Canvas.getObjects().forEach(x => this.onMovingObject(x));
      return;
    }

    this.onMovingObject(opt.target);
  }

  private onMovingObject(movingObj) {
    this.blockCheckingIntersection = true;
    if (['p1'].includes(movingObj[CProps.name])) this.dfOnPointMoving(movingObj);
    else if (movingObj[CProps.myType] == CTypes.TextPosPoint) this.textOnMovingPoint(movingObj);
    else if (movingObj[CProps.t0ID]) this.textOnMovingText(movingObj);
    if (movingObj[CProps.ID]) {
      const stick = (x) => {
        return Math.round(x / CanvasBase.GridSize * 2) % 2 == 0;
      }

      if (this.ShowGrid && this.StickToGrid) {
        if (stick(movingObj.left)) movingObj.set('left', Math.round(movingObj.left / CanvasBase.GridSize) * CanvasBase.GridSize);
        if (stick(movingObj.top)) movingObj.set('top', Math.round(movingObj.top / CanvasBase.GridSize) * CanvasBase.GridSize);
        movingObj.setCoords();
      }
    }

    if (movingObj[CProps.dfs]) {
      movingObj[CProps.dfs].forEach(dfID => {
        const dfObj = this.getCanvasElementByCanvasID(dfID);
        let isEnd = dfObj[CProps.fe2] == movingObj[CProps.canvasID];
        let start = this.getFlowAnchorPoint(isEnd ? dfObj[CProps.fa2] : dfObj[CProps.fa1], movingObj);
        let p = isEnd ? CProps.p2ID : CProps.p0ID;
        let endPoint = this.getCanvasElementByCanvasID(dfObj[p]);
        endPoint.left = start[0];
        endPoint.top = start[1];
        let groupX = 0, groupY = 0;
        if (movingObj.group) {
          groupX = movingObj.group.left + movingObj.group.width/2;
          groupY = movingObj.group.top + movingObj.group.height/2;
        }
        if (isEnd) {
          dfObj.path[1][3] = groupX + start[0];
          dfObj.path[1][4] = groupY + start[1];
        }
        else {
          dfObj.path[0][1] = groupX + start[0];
          dfObj.path[0][2] = groupY + start[1];
        }

        if (dfObj[CProps.bendFlow] == false) {
          let p1 = this.getCanvasElementByCanvasID(dfObj[CProps.p1ID]);
          let midX = dfObj.path[0][1] +  (dfObj.path[1][3] - dfObj.path[0][1]) / 2;
          let midY = dfObj.path[0][2] +  (dfObj.path[1][4] - dfObj.path[0][2]) / 2;
          p1.left = dfObj.path[1][1] = midX;
          p1.top = dfObj.path[1][2] = midY;
        }

        let dims = dfObj._calcDimensions();
        dfObj.set({
          width: dims.width,
          height: dims.height,
          left: dims.left,
          top: dims.top,
          pathOffset: {
            x: dims.width / 2 + dims.left,
            y: dims.height / 2 + dims.top
          },
          dirty: true
        });
        dfObj.setCoords();

        let df = this.getViewBaseElement(dfObj[CProps.ID]);
        this.flowUpdateFlowArrow(df.ID);
        this.flowUpdateText(dfObj);
        this.Canvas.requestRenderAll();
      });
    }
    if (movingObj[CProps.myType] != CTypes.GridLine) {
      if (movingObj['left'] < 0) {
        movingObj['left'] = 0;
        this.Canvas.requestRenderAll();
      }
      if (movingObj['top'] < 0) {
        movingObj['top'] = 0;
        this.Canvas.requestRenderAll();
      }
      if (movingObj['left'] + movingObj['width'] > this.xMax && movingObj['left'] + movingObj['width'] > this.Canvas['width']) {
        this.Canvas.setWidth(movingObj['left'] + movingObj['width']);
        this.Canvas.requestRenderAll();
      }
      if (movingObj['top'] + movingObj['height'] > this.yMax && movingObj['top'] + movingObj['height'] > this.Canvas['height']) {
        this.Canvas.setHeight(movingObj['top'] + movingObj['height']);
        this.Canvas.requestRenderAll();
      }
    }
  }

  protected onCanvasSelectionChanged(opt) {
    if (this.MouseMode == MouseModes.Move) {
      if (this.mouseMovingState == MouseMovingStates.Moving) {
        this.SetMouse();
        this.mouseMovingState = MouseMovingStates.None;
        // show arrows
        this.arrowVisibilityRestore();
      }

      return;
    }
    if (this.blockSelectionChangedAfterReceive) return;

    if ('selected' in opt && opt.selected.length > 0) {
      if (opt.selected.length == 1) {
        let selectedObj = opt.selected[0];
        if (selectedObj[CProps.fa]) {
          // flow anchor selected
          this.Canvas.discardActiveObject();
          return; 
        }
        if (selectedObj.group) selectedObj = selectedObj.group;
        // set selected element
        if (selectedObj[CProps.ID]) {
          let ele = this.getViewBaseElement(selectedObj[CProps.ID]);
          this.SelectionChanged.emit(ele);
          if (selectedObj[CProps.elementTypeID] == ElementTypeIDs.DataFlow) this.setFlowSelected(selectedObj, true);
        }
        else if (selectedObj[CProps.flowID]) {
          let flow = this.getCanvasElementByCanvasID(selectedObj[CProps.flowID]);
          let ele = this.getViewBaseElement(flow[CProps.ID]);
          this.SelectionChanged.emit(ele);
          this.setFlowSelected(flow, true);
        }
      }
      else {
        console.error('More than one object selected');
      }
    }
    else if ('deselected' in opt) {      
      // reset selected element
      this.setFlowSelected(null, false);
      this.SelectionChanged.emit(null);
    }

    this.blockSelectionChangedAfterSend = true;
    setTimeout(() => {
      this.blockSelectionChangedAfterSend = false;
    }, 250);
  }

  protected onCanvasDrop(opt) {
    const data = opt.e.dataTransfer.getData('dragDropData');
    if (data) {
      let vpt = this.Canvas.viewportTransform;
      this.createElement(JSON.parse(data), (opt.e.offsetX - vpt[4]) / vpt[0], (opt.e.offsetY - vpt[5]) / vpt[0]);
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
      }, 250);
    }
  }

  protected onFlowAnchorHit(e: any) {
    if (!this.blockCreateLine) {
      // create new line
      let hitAnchor = '';
      let activeObj = null;
      if (e.subTargets?.length == 1) {
        hitAnchor = e.subTargets[0][CProps.fa];
        activeObj = e.target;
      }
      else {
        hitAnchor = e.target[CProps.fa];
        activeObj = e.target.group;
      }
      let start = this.getFlowAnchorPoint(hitAnchor, activeObj);
      if (this.tmpFlowLine == null) {
        this.tmpFlowLineEndpoint = activeObj;
        this.tmpFlowLine = new fabric.Line([start[0], start[1], start[0], start[1]], {
          stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, hasControls: false
        });
        this.tmpFlowLine[CProps.fa1] = hitAnchor;
        this.Canvas.add(this.tmpFlowLine);
        this.Canvas.sendToBack(this.tmpFlowLine);
      }
      else if (this.tmpFlowLineEndpoint[CProps.canvasID] != activeObj[CProps.canvasID]) {
        // two points defined
        const flow = this.instantiateFlow();
        if (this.instanceOfCanvasFlow(flow)) {
          flow.ArrowPos = this.FlowArrowPosition;
          flow.BendFlow = this.BendFlow;
          flow.ShowName = this.ShowName;
          let flowObj = this.createFlow(this.tmpFlowLine.x1, this.tmpFlowLine.y1, start[0], start[1], flow);
          flow.NameChanged.subscribe(x => this.changeObjectName(flow.ID));
          flow.OutOfScopeChanged.subscribe(x => this.changeObjectBorder(flow.ID));
          flow.LineTypeChanged?.subscribe(x => this.flowChangeLineType(flow.ID, x));
          flow.ArrowPosChanged?.subscribe(y => this.flowUpdateFlowArrow(flow.ID));
          flow.BendFlowChanged?.subscribe(y => this.flowChangeBending(flow.ID, y));
          flow.DirectionChanged?.subscribe(x => this.flowChangeDirection(flow.ID));
          flow.AnchorChanged?.subscribe(y => this.flowChangeAnchor(flow.ID, y));

          this.Diagram.Elements.AddChild(flow);
          flow.Sender = this.getViewBaseElement(this.tmpFlowLineEndpoint[CProps.ID]);
          flow.Receiver = this.getViewBaseElement(activeObj[CProps.ID]);
          flowObj[CProps.fa1] = this.tmpFlowLine[CProps.fa1]; // position of flow at endpoint
          flowObj[CProps.fe1] = this.tmpFlowLineEndpoint[CProps.canvasID]; // connect DF -> EP
          if (!this.tmpFlowLineEndpoint[CProps.dfs]) this.tmpFlowLineEndpoint[CProps.dfs] = [];
          this.tmpFlowLineEndpoint[CProps.dfs].push(flowObj[CProps.canvasID]); // connect EP -> DF

          flowObj[CProps.fa2] = hitAnchor;
          flowObj[CProps.fe2] = activeObj[CProps.canvasID];
          if (!activeObj[CProps.dfs]) activeObj[CProps.dfs] = [];
          activeObj[CProps.dfs].push(flowObj[CProps.canvasID]);

          this.tmpFlowLineEndpoint = null;
          this.Canvas.remove(this.tmpFlowLine);
          this.tmpFlowLine = null;
          this.Canvas.requestRenderAll();
          this.setFlowSelected(flowObj, true);
          this.SelectionChanged.emit(flow);
          this.onCanvasModified();
        }
      }
    }
  }

  protected abstract instantiateFlow(): ViewElementBase;

  protected abstract createElement(dragDropData: IDragDropData, posX: number, posY: number): ViewElementBase;

  protected deleteElement(elementID: string) {
    if (elementID == null) return;
    let flow = null;
    let obj = this.Canvas.getObjects().find(x => x[CProps.ID] == elementID);
    if (obj) {
      if (obj[CProps.elementTypeID] == ElementTypeIDs.DataFlow || obj[CProps.flowID]) flow = obj[CProps.elementTypeID] == ElementTypeIDs.DataFlow ? obj : this.getCanvasElementByCanvasID(obj[CProps.flowID]);

      if (flow) { // delete all data flow parts
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.p0ID]));
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.p1ID]));
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.p2ID]));
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.arrowEID]));
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.arrowSID]));
        this.Canvas.remove(this.getCanvasElementByCanvasID(flow[CProps.textID]));
        this.Canvas.getObjects().filter(x => x[CProps.dfs] != null).forEach(endPoint => {
          const index = endPoint[CProps.dfs].indexOf(flow[CProps.canvasID]);
          if (index >= 0) {
            endPoint[CProps.dfs].splice(index, 1);
          }
        });
        this.Canvas.remove(flow);
      }
      else {
        if (obj._objects) obj._objects.filter(x => x['type'] == 'group').forEach(x => this.Canvas.remove(x));
        this.Canvas.remove(obj);
      }

      if (obj[CProps.t0ID]) {
        const txt = this.getCanvasElementByCanvasID(obj[CProps.t0ID]);
        if (txt) this.Canvas.remove(txt);
      }

      let element = this.getViewBaseElement(elementID);
      if (element && this.instanceOfElementType(element)) {
        element.Parent.DeleteChild(element);
        this.Canvas.getObjects().filter(x => x[CProps.ID] == elementID).forEach(x => {
          this.Canvas.remove(x); // there may be multiple instances of devices in UC diagram
          this.Diagram.Elements.DeleteChild(element);
        });
      }
      if (element instanceof Device) this.NavTreeChanged.emit();

      this.onCanvasModified();
    }
  }

  protected seletedFlow = null;
  protected setFlowSelected(flowObj, isSelected: boolean) {
    let opacity = isSelected ? 1 : 0;
    if (this.seletedFlow) {
      // current selected element is DF -> deselect current one before new gets selected
      let tmp = this.seletedFlow;
      this.seletedFlow = null;
      this.setFlowSelected(tmp, false);
    }

    if (flowObj) {
      this.seletedFlow = flowObj;
      this.getCanvasElementByCanvasID(flowObj[CProps.p0ID])?.set('opacity', opacity);
      let flow = this.getViewBaseElement(flowObj[CProps.ID]);
      if (opacity == 0 || (this.instanceOfCanvasFlow(flow) && flow.BendFlow)) this.getCanvasElementByCanvasID(flowObj[CProps.p1ID])?.set('opacity', opacity);
      if (isSelected && this.getCanvasElementByCanvasID(flowObj[CProps.p1ID])) this.Canvas.bringToFront(this.getCanvasElementByCanvasID(flowObj[CProps.p1ID]));
      this.getCanvasElementByCanvasID(flowObj[CProps.p2ID])?.set('opacity', opacity);
      this.Canvas.requestRenderAll();
    }
  }

  protected createFlow(left: number, top: number, right: number, bottom: number, element: ViewElementBase): fabric.Object {
    let x = left, y = top, dx = right - left, dy = bottom - top;
    const angle = Math.PI / 2 - Math.acos(dx / (Math.sqrt(dx * dx + dy * dy)));
    const d = this.BendFlow ? 50 : 0;
    const px = dx / 2 + Math.sign(dy) * d * Math.cos(angle);
    const py = dy / 2 - d * Math.sin(angle);

    let flow: ICanvasFlow = null;
    if (this.instanceOfCanvasFlow(element)) {
      flow = element;
    }
    else {
      console.error('Element is not a flow object', element);
    }

    // create line
    let path = ['M', x.toString(), y.toString(), 'q', (px).toString(), (py).toString(), dx.toString(), dy.toString()].join(' ');
    let flowLine = new fabric.Path(path, {
      fill: '', stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, objectCaching: false, canvasID: uuidv4(), selectable: true,
      lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, hasBorders: false, transparentCorners: true, cornerColor: 'transparent',
      ID: element.ID, elementTypeID: ElementTypeIDs.DataFlow, myType: CTypes.DataFlowLine, bendFlow: this.BendFlow, perPixelTargetFind: true 
    });
    flowLine.setControlsVisibility({ mtr: false, mts: false });

    // create text on line
    let text = this.flowCreateText(left, top, right, bottom, left + px, top + py, element.GetProperty('Name'));
    text[CProps.visible] = flow.ShowName;
    flowLine[CProps.textID] = text[CProps.canvasID];
    text[CProps.flowID] = flowLine[CProps.canvasID];

    // create line arrow
    let arrowEnd = new fabric.Path('M 15 0 L 10 5 L 10 -5 z', {
      fill: this.StrokeColor, stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, objectCaching: false,
      originX: 'center', originY: 'center', canvasID: uuidv4(), selectable: false, myType: CTypes.DataFlowArrowE
    });
    arrowEnd.setControlsVisibility({ mtr: false, mts: false });
    flowLine[CProps.arrowEID] = arrowEnd[CProps.canvasID];
    arrowEnd[CProps.flowID] = flowLine[CProps.canvasID];
    arrowEnd[CProps.visible] = flow.ArrowPos != FlowArrowPositions.Start;
    let arrowStart = new fabric.Path('M 15 0 L 10 5 L 10 -5 z', {
      fill: flow.ArrowPos == FlowArrowPositions.Both ? this.StrokeColor : this.BackgroundColor, stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, objectCaching: false,
      originX: 'center', originY: 'center', canvasID: uuidv4(), selectable: false, myType: CTypes.DataFlowArrowS
    });
    arrowStart.setControlsVisibility({ mtr: false, mts: false });
    flowLine[CProps.arrowSID] = arrowStart[CProps.canvasID];
    arrowStart[CProps.flowID] = flowLine[CProps.canvasID];
    arrowStart[CProps.visible] = flow.ArrowPos != FlowArrowPositions.End;

    // create start, end and bend point
    let p1 = this.flowCreateCurvePoint('p1', flowLine.path[1][1], flowLine.path[1][2], flowLine); // bend point
    flowLine[CProps.p1ID] = p1[CProps.canvasID];
    p1[CProps.flowID] = flowLine[CProps.canvasID];
    p1[CProps.visible] = this.BendFlow;

    let p0 = this.flowCreateCurveCircle('p0', flowLine.path[0][1], flowLine.path[0][2], flowLine); // start point
    flowLine[CProps.p0ID] = p0[CProps.canvasID];
    p0[CProps.flowID] = flowLine[CProps.canvasID];

    let p2 = this.flowCreateCurveCircle('p2', flowLine.path[1][3], flowLine.path[1][4], flowLine); // end point
    flowLine[CProps.p2ID] = p2[CProps.canvasID];
    p2[CProps.flowID] = flowLine[CProps.canvasID];

    this.Canvas.add(flowLine);
    this.Canvas.add(arrowEnd);
    this.Canvas.add(arrowStart);
    this.Canvas.add(text);
    this.Canvas.add(p1);
    this.Canvas.add(p0);
    this.Canvas.add(p2);
    this.Canvas.sendToBack(text);
    this.Canvas.bringToFront(p1);

    setTimeout(() => {
      this.flowUpdateFlowArrow(element.ID);
    }, 100);
    return flowLine;
  }

  protected flowCreateCurveCircle(name, left, top, flow) {
    var c = new fabric.Circle({
      left: left, top: top, radius: 6.5,
      stroke: this.theme.Primary, fill: this.theme.Primary,
      originX: 'center', originY: 'center',
      name: name, canvasID: uuidv4(), myType: CTypes.DataFlowCircle,
      selectable: false, hasBorders: false, hasControls: false
    });

    c[CProps.flowID] = flow[CProps.canvasID];
    c.setControlsVisibility({ mtr: false, mts: false });

    return c;
  };

  protected flowCreateCurvePoint(name, left, top, flow) {
    var c = new fabric.Circle({
      left: left, top: top,
      radius: 7, stroke: this.theme.Primary, fill: this.theme.Primary,
      originX: 'center', originY: 'center',
      name: name, canvasID: uuidv4(), myType: CTypes.DataFlowPoint,
      selectable: true, hasBorders: false, hasControls: false
    });

    c[CProps.flowID] = flow[CProps.canvasID];
    c.setControlsVisibility({ mtr: false, mts: false });

    return c;
  };

  protected flowCreateText(x1: number, y1: number, x2: number, y2: number, xP: number, yP: number, displayText: string) {
    let x = x1, y = y1, dx = x2 - x1, dy = y2 - y1, px = xP - x, py = yP - y;
    const angle = Math.PI / 2 - Math.acos(dx / (Math.sqrt(dx * dx + dy * dy)));

    let xCorr = px < 0 ? px * Math.PI / 4 : 0;
    if (dx < xCorr) xCorr = dx;
    let yCorr = py < 0 ? py * Math.PI / 4 : 0;
    if (dy < yCorr) yCorr = dy;
    let pOffset = 10;
    let xTO = Math.cos(angle);
    let yTO = Math.sin(angle);
    let side = 'left';
    if (dx < 0 && dy < 0) {
      xTO *= -1;
      yTO *= -1;
      side = 'right';
      pOffset = 15;
    }
    else if (dx < 0) { // && dy > 0
      xTO *= +1;
      yTO *= -1;
      side = 'right';
      pOffset = 15;
    }
    else if (dy < 0) { // && dx > 0
      xTO *= -1;
      yTO *= -1;
    }
    else { // dx > 0 && dy > 0
      xTO *= +1;
      yTO *= -1;
    }

    xTO *= pOffset;
    yTO *= pOffset;

    let path = ['M', (x + Math.cos(angle) * pOffset).toString(), (y - Math.sin(angle) * pOffset).toString(), 'q', (px).toString(), (py).toString(), dx.toString(), dy.toString()].join(' ');
    let text = new fabric.Text(displayText, {
      left: x + xCorr + xTO, top: y + yCorr + yTO,
      textAlign: 'center', charSpacing: -50,
      path: new fabric.Path(path, { strokeWidth: 1, visible: false }), pathSide: side, pathStartOffset: 0,
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor, canvasID: uuidv4(), selectable: true, perPixelTargetFind: true, targetFindTolerance: 4,
      hasBorders: false, lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, transparentCorners: true, cornerColor: 'transparent', myType: CTypes.ElementName
    });

    text.setControlsVisibility({ mtr: false, mts: false });
    return text;
  };

  protected flowUpdateText(flowObj) {
    const oldText = this.getCanvasElementByCanvasID(flowObj[CProps.textID]);
    this.Canvas.remove(oldText);
    const textObj = this.flowCreateText(flowObj.path[0][1], flowObj.path[0][2], flowObj.path[1][3], flowObj.path[1][4], flowObj.path[1][1], flowObj.path[1][2], oldText.text);
    textObj['styles'] = oldText['styles']; 
    textObj[CProps.canvasID] = oldText[CProps.canvasID];
    textObj[CProps.visible] = oldText[CProps.visible];
    textObj[CProps.fontSize] = oldText[CProps.fontSize];
    this.Canvas.add(textObj);
    //this.canvas.sendToBack(text);
    flowObj[CProps.textID] = textObj[CProps.canvasID];
    textObj[CProps.flowID] = flowObj[CProps.canvasID];
    return textObj;
  };

  protected flowUpdateFlowArrow(id: string) {
    if (this.MouseMode == MouseModes.Move) return;
    const flowObj = this.getCanvasElementByID(id);
    const element = this.getViewBaseElement(id);
    const arrowWidth = 12;
    let arrowEnd = this.getCanvasElementByCanvasID(flowObj[CProps.arrowEID]);
    arrowEnd.set(CProps.visible, [FlowArrowPositions.End, FlowArrowPositions.Both, FlowArrowPositions.Initiator].includes(element.Data['ArrowPos']));
    let arrowStart = this.getCanvasElementByCanvasID(flowObj[CProps.arrowSID]);
    arrowStart.set(CProps.visible, [FlowArrowPositions.Start, FlowArrowPositions.Both, FlowArrowPositions.Initiator].includes(element.Data['ArrowPos']));
    arrowStart.set('fill', element.Data['ArrowPos'] == FlowArrowPositions.Initiator ? this.BackgroundColor : this.StrokeColor);
    if (arrowEnd[CProps.visible]) {
      let endPointX = flowObj.path[1][3] + flowObj.strokeWidth/2;
      let endPointY = flowObj.path[1][4] + flowObj.strokeWidth/2;
      let quadPointX = flowObj.path[1][1];
      let quadPointY = flowObj.path[1][2];
      let arrowAngle = Math.atan2(quadPointX - endPointX, quadPointY - endPointY) + Math.PI;
      arrowEnd.set('pathOffset', { x: arrowEnd.left, y: arrowEnd.top });
      let path = arrowEnd.path;
      path[0][1] = endPointX - (arrowWidth * Math.sin(arrowAngle - Math.PI / 6));
      path[0][2] = endPointY - (arrowWidth * Math.cos(arrowAngle - Math.PI / 6));
      path[1][1] = endPointX;
      path[1][2] = endPointY;
      path[2][1] = endPointX - (arrowWidth * Math.sin(arrowAngle + Math.PI / 6));
      path[2][2] = endPointY - (arrowWidth * Math.cos(arrowAngle + Math.PI / 6));
      arrowEnd.set('path', path);
      arrowEnd.setCoords();
    }
    if (arrowStart[CProps.visible]) {
      let startPointX = flowObj.path[0][1] + flowObj.strokeWidth/2;
      let startPointY = flowObj.path[0][2] + flowObj.strokeWidth/2;
      let quadPointX = flowObj.path[1][1];
      let quadPointY = flowObj.path[1][2];
      let arrowAngle = Math.atan2(quadPointX - startPointX, quadPointY - startPointY) + Math.PI;
      arrowStart.set('pathOffset', { x: arrowStart.left, y: arrowStart.top });
      let path = arrowStart.path;
      path[0][1] = startPointX - (arrowWidth * Math.sin(arrowAngle - Math.PI / 6));
      path[0][2] = startPointY - (arrowWidth * Math.cos(arrowAngle - Math.PI / 6));
      path[1][1] = startPointX;
      path[1][2] = startPointY;
      path[2][1] = startPointX - (arrowWidth * Math.sin(arrowAngle + Math.PI / 6));
      path[2][2] = startPointY - (arrowWidth * Math.cos(arrowAngle + Math.PI / 6));
      arrowStart.set('path', path);
      arrowStart.setCoords();
    }
    this.Canvas.requestRenderAll();
  };

  protected flowChangeLineType(id: string, newType: FlowLineTypes) {
    let obj = this.Canvas.getObjects().find(x => x[CProps.ID] == id);
    if (obj && obj[CProps.myType] == CTypes.DataFlowLine) {
      if (newType == FlowLineTypes.Dashed) obj.set(CProps.strokeDashArray, [5, 5]);
      else delete obj[CProps.strokeDashArray];
    }

    this.Canvas.requestRenderAll();
    this.onCanvasModified();
  }

  protected flowChangeBending(id: string, bend: boolean) {
    const flowObj = this.getCanvasElementByID(id);
    flowObj[CProps.bendFlow] = bend;

    let p1 = this.getCanvasElementByCanvasID(flowObj[CProps.p1ID]);
    if (flowObj[CProps.bendFlow] == false) {
      let midX = flowObj.path[0][1] +  (flowObj.path[1][3] - flowObj.path[0][1]) / 2;
      let midY = flowObj.path[0][2] +  (flowObj.path[1][4] - flowObj.path[0][2]) / 2;
      p1.left = flowObj.path[1][1] = midX;
      p1.top = flowObj.path[1][2] = midY;
      p1.set(CProps.visible, false);
      p1.set(CProps.opacity, 0);
    }
    else {
      const left = flowObj.path[0][1];
      const top = flowObj.path[0][2];
      const right = flowObj.path[1][3];
      const bottom = flowObj.path[1][4];

      let x = left, y = top, dx = right - left, dy = bottom - top;
      const angle = Math.PI / 2 - Math.acos(dx / (Math.sqrt(dx * dx + dy * dy)));
      const d = 50;
      const px = dx / 2 + Math.sign(dy) * d * Math.cos(angle);
      const py = dy / 2 - d * Math.sin(angle);

      p1.left = flowObj.path[1][1] = x + px;
      p1.top = flowObj.path[1][2] = y + py;
      p1.set(CProps.visible, true);
      p1.set(CProps.opacity, 1);
    }

    let dims = flowObj._calcDimensions();
    flowObj.set({
      width: dims.width,
      height: dims.height,
      left: dims.left,
      top: dims.top,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top
      },
      dirty: true
    });
    flowObj.setCoords();

    let df = this.getViewBaseElement(flowObj[CProps.ID]);
    this.flowUpdateFlowArrow(df.ID);
    this.flowUpdateText(flowObj);
    this.Canvas.requestRenderAll();
  }

  protected flowChangeDirection(id: string) {
    const oldFlowObj = this.getCanvasElementByID(id);
    const flow = this.getViewBaseElement(id) as DataFlow;

    const fa1 = this.getFlowAnchorPoint(oldFlowObj[CProps.fa2], this.getCanvasElementByCanvasID(oldFlowObj[CProps.fe2]));
    const fa2 = this.getFlowAnchorPoint(oldFlowObj[CProps.fa1], this.getCanvasElementByCanvasID(oldFlowObj[CProps.fe1]));

    const flowObj = this.createFlow(fa1[0], fa1[1], fa2[0], fa2[1], flow);

    flowObj[CProps.fa1] = oldFlowObj[CProps.fa2]; // position of flow at endpoint
    flowObj[CProps.fe1] = oldFlowObj[CProps.fe2]; // connect DF -> EP

    flowObj[CProps.fa2] = oldFlowObj[CProps.fa1];
    flowObj[CProps.fe2] = oldFlowObj[CProps.fe1];

    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.p0ID]));
    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.p1ID]));
    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.p2ID]));
    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.arrowEID]));
    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.arrowSID]));
    this.Canvas.remove(this.getCanvasElementByCanvasID(oldFlowObj[CProps.textID]));

    const copyProps = [
      CProps.ID, CProps.elementTypeID, CProps.myType,
      CProps.strokeDashArray, CProps.bendFlow,
      CProps.fontSize
    ];
    copyProps.forEach(prop => {
      flowObj.set(prop, oldFlowObj[prop]);
    });

    const restoredCanvasID = oldFlowObj[CProps.canvasID];
    this.getCanvasElementByCanvasID(flowObj[CProps.arrowSID])[CProps.flowID] = restoredCanvasID;
    this.getCanvasElementByCanvasID(flowObj[CProps.arrowEID])[CProps.flowID] = restoredCanvasID;
    this.getCanvasElementByCanvasID(flowObj[CProps.p0ID])[CProps.flowID] = restoredCanvasID;
    this.getCanvasElementByCanvasID(flowObj[CProps.p1ID])[CProps.flowID] = restoredCanvasID;
    this.getCanvasElementByCanvasID(flowObj[CProps.p2ID])[CProps.flowID] = restoredCanvasID;
    flowObj[CProps.canvasID] = restoredCanvasID

    this.Canvas.remove(oldFlowObj);

    this.flowChangeBending(flow.ID, flow.BendFlow);
    this.flowUpdateText(flowObj);
    this.flowUpdateFlowArrow(flow.ID);

    this.Canvas.requestRenderAll();
    this.setFlowSelected(flowObj, true);
    this.SelectionChanged.emit(flow);
    this.onCanvasModified();
  }

  protected flowChangeAnchor(id: string, details) {
    const flowObj = this.getCanvasElementByID(id);
    flowObj[CProps.fa+details['o']] = details['fa'];
    this.onMovingObject(this.getCanvasElementByCanvasID(flowObj['fe'+details['o']]));
  }

  protected dfOnPointMoving(p) {
    let flow = this.getCanvasElementByCanvasID(p[CProps.flowID]);
    /*
    if (p.name == 'p0') { // start point
      flow.path[0][1] = p.left;
      flow.path[0][2] = p.top;
    }
    else if (p.name == 'p2') { // end point
      flow.path[1][3] = p.left;
      flow.path[1][4] = p.top;
    }
    else 
    */
    if (p.name == 'p1') {  // bend point
      flow.path[1][1] = p.left;
      flow.path[1][2] = p.top;
    }

    let dims = flow._calcDimensions();
    flow.set({
      width: dims.width,
      height: dims.height,
      left: dims.left,
      top: dims.top,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top
      },
      dirty: true
    });
    flow.setCoords();

    this.flowUpdateFlowArrow(flow[CProps.ID]);
    this.flowUpdateText(flow);
  };

  protected createFlowAnchors(wid: number, hei: number, horizontal = true, vertical = true, halves = false, corners = false) {
    if (this.Diagram.DiagramType == DiagramTypes.Hardware) return [];
    let r = 6.5;
    let d = 2 * r;
    let o = 3; // offset
    let res = [];
    const createAnchor = (left, top, fa) => {
      let c = new fabric.Circle({ 
        left: left, top: top, radius: r,
        fill: this.StrokeColor, opacity: 0.15
      });
      const xCenter = left + r;
      const yCenter = top + r;
      const offset = 4.33; // Math.acos(Math.PI/4)*r;
      let l1 = new fabric.Line([xCenter-offset, yCenter-offset, xCenter+offset, yCenter+offset], { stroke: this.theme.Primary, selectable: false });
      let l2 = new fabric.Line([xCenter-offset, yCenter+offset, xCenter+offset, yCenter-offset], { stroke: this.theme.Primary, selectable: false });

      return new fabric.Group([c, l1, l2], {
        left: left, top: top,
        hasControls: false,
        hasBorders: false,
        lockRotation: true,
        opacity: 0,
        fa: fa, myType: CTypes.FlowAnchor, canvasID: uuidv4()
      });
    };
    if (horizontal) {
      res.push(createAnchor(wid - d - o, hei / 2 - r, AnchorDirections.East)); // flow anchor east
      res.push(createAnchor(r, hei / 2 - r, AnchorDirections.West)); // flow anchor west
    }

    if (vertical) {
      res.push(createAnchor( wid / 2 - r, r, AnchorDirections.North)); // flow anchor north
      res.push(createAnchor(wid / 2 - r, hei - d - o, AnchorDirections.South)); // flow anchor south
    }

    if (halves) {
      res.push(createAnchor(wid - d - o, hei / 4 - r, AnchorDirections.EasternNorth)); // flow anchor east north
      res.push(createAnchor(wid - d - o, hei * 3 / 4 - r, AnchorDirections.EasternSouth)); // flow anchor east south
      res.push(createAnchor(r,  hei / 4 - r, AnchorDirections.WesternNorth)); // flow anchor west north
      res.push(createAnchor(r, hei * 3 / 4 - r, AnchorDirections.WesternSouth)); // flow anchor west south
      res.push(createAnchor(wid * 3 / 4 - r, r, AnchorDirections.NorthernEast)); // flow anchor north east
      res.push(createAnchor(wid / 4 - r, r, AnchorDirections.NorthernWest)); // flow anchor north west
      res.push(createAnchor(wid * 3 / 4 - r, hei - d - o, AnchorDirections.SouthernEast)); // flow anchor south east
      res.push(createAnchor(wid / 4 - r, hei - d - o, AnchorDirections.SouthernWest)); // flow anchor south west
    }

    if (corners) {
      res.push(createAnchor(wid - d - o, r, AnchorDirections.NorthEast)); // flow anchor north-east 
      res.push(createAnchor(r, r, AnchorDirections.NorthWest)); // flow anchor north-west 
      res.push(createAnchor(wid - d - o, hei - d - o, AnchorDirections.SouthEast)); // flow anchor south-east 
      res.push(createAnchor(r, hei - d - o, AnchorDirections.SouthWest)); // flow anchor south-west 
    }

    res.forEach(x => {
      x.on('mousedown', (e) => {
        this.onFlowAnchorHit(e);
      });
    });

    return res;
  }

  protected getFlowAnchorPoint(anchor: string, obj) {
    if (anchor == AnchorDirections.North) return [obj.left + obj.width / 2, obj.top];
    else if (anchor == AnchorDirections.East) {
      if (obj[CProps.elementTypeID] == ElementTypeIDs.PhysicalLink) return [obj.left + obj.width - obj.width/14, obj.top + obj.height / 2];
      return [obj.left + obj.width, obj.top + obj.height / 2];
    }
    else if (anchor == AnchorDirections.South) return [obj.left + obj.width / 2, obj.top + obj.height];
    else if (anchor == AnchorDirections.West) {
      if (obj[CProps.elementTypeID] == ElementTypeIDs.PhysicalLink) return [obj.left + obj.width/14, obj.top + obj.height / 2];
      return [obj.left, obj.top + obj.height / 2];
    }
    else if (anchor == AnchorDirections.NorthernEast) return [obj.left + obj.width * 3 / 4, obj.top];
    else if (anchor == AnchorDirections.NorthernWest) return [obj.left + obj.width / 4, obj.top];
    else if (anchor == AnchorDirections.SouthernEast) return [obj.left + obj.width * 3 / 4, obj.top + obj.height];
    else if (anchor == AnchorDirections.SouthernWest) return [obj.left + obj.width / 4, obj.top + obj.height];
    else if (anchor == AnchorDirections.EasternNorth) return [obj.left + obj.width, obj.top + obj.height / 4];
    else if (anchor == AnchorDirections.EasternSouth) return [obj.left + obj.width, obj.top + obj.height * 3 / 4];
    else if (anchor == AnchorDirections.WesternNorth) return [obj.left, obj.top + obj.height / 4];
    else if (anchor == AnchorDirections.WesternSouth) return [obj.left, obj.top + obj.height * 3 / 4];
    else if (anchor == AnchorDirections.NorthEast) return [obj.left + obj.width, obj.top];
    else if (anchor == AnchorDirections.NorthWest) return [obj.left, obj.top];
    else if (anchor == AnchorDirections.SouthEast) return [obj.left + obj.width, obj.top + obj.height];
    else if (anchor == AnchorDirections.SouthWest) return [obj.left, obj.top + obj.height];
    else return null;
  }

  protected textOnMovingPoint(p) {
    let g = this.getCanvasElementByCanvasID(p[CProps.textObjID]);
    if (!g) {
      this.Canvas.remove(p);
      return;
    }
    let txt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);
    txt.set('left', p.left - (g.left + g.width/2));
    txt.set('top', p.top - (g.top + g.height/2 - 8));
    this.Canvas.requestRenderAll();
  };

  protected textOnMovingText(g) {
    let p = this.getCanvasElementByCanvasID(g[CProps.t0ID]);
    let txt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);
    p.set('left', g.left + g.width/2 + txt.left);
    p.set('top', g.top + g.height/2 + txt.top - 8);
    this.Canvas.requestRenderAll();
  }

  protected onScaleElement(event) {
    let g = event.transform.target;
    let etype = g._objects.find(x => x[CProps.myType] == CTypes.ElementType);
    let ephy = g._objects.find(x => x[CProps.myType] == CTypes.ElementPhyElement);
    let etxt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;

    g.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1
    });

    if (etype) etype.set({
      'left': 0,
      'top': -hg / 2 + 5
    });

    if (ephy) ephy.set({
      'left': 0,
      'top': hg / 2 - 15
    });

    // if (etxt) etxt.set({
    //   'left': 0,
    //   'top': -8
    // });

    let fas = g._objects.filter(x => x[CProps.fa] != null);
    let r = 6.5;
    let d = 2 * r;
    let o = 6; // offset
    fas.forEach(pt => {
      if (pt[CProps.fa] == AnchorDirections.East) pt.set({ 'left': wg / 2 - d - o, 'top': -r });
      else if (pt[CProps.fa] == AnchorDirections.West) pt.set({ 'left': -wg / 2 + r, 'top': -r });
      else if (pt[CProps.fa] == AnchorDirections.North) pt.set({ 'left': -r, 'top': -hg / 2 + r });
      else if (pt[CProps.fa] == AnchorDirections.South) pt.set({ 'left': -r, 'top': hg / 2 - d - o });
      else if (pt[CProps.fa] == AnchorDirections.EasternNorth) pt.set({ 'left': wg / 2 - d - o, 'top': -hg / 4 });
      else if (pt[CProps.fa] == AnchorDirections.EasternSouth) pt.set({ 'left': wg / 2 - d - o, 'top': hg / 4 - d });
      else if (pt[CProps.fa] == AnchorDirections.WesternNorth) pt.set({ 'left': -wg / 2 + r, 'top': -hg / 4 });
      else if (pt[CProps.fa] == AnchorDirections.WesternSouth) pt.set({ 'left': -wg / 2 + r, 'top': hg / 4 - d });
      else if (pt[CProps.fa] == AnchorDirections.NorthernEast) pt.set({ 'left': wg / 4 - d, 'top': -hg / 2 + r });
      else if (pt[CProps.fa] == AnchorDirections.NorthernWest) pt.set({ 'left': -wg / 4, 'top': -hg / 2 + r });
      else if (pt[CProps.fa] == AnchorDirections.SouthernEast) pt.set({ 'left': wg / 4 - d, 'top': hg / 2 - d - o });
      else if (pt[CProps.fa] == AnchorDirections.SouthernWest) pt.set({ 'left': -wg / 4, 'top': hg / 2 - d - o });
      else if (pt[CProps.fa] == AnchorDirections.NorthEast) pt.set({ 'left': wg / 2 - d - o, 'top': -hg / 2 + r });
      else if (pt[CProps.fa] == AnchorDirections.NorthWest) pt.set({ 'left': -wg / 2 + o, 'top': -hg / 2 + r });
      else if (pt[CProps.fa] == AnchorDirections.SouthEast) pt.set({ 'left': wg / 2 - d - o, 'top': hg / 2 - d - o });
      else if (pt[CProps.fa] == AnchorDirections.SouthWest) pt.set({ 'left': -wg / 2 + o, 'top': hg / 2 - d - o });
      pt.setCoords();
    });
  }

  protected fireScaling(obj) {
    obj.fire('scaling', { transform: { target: obj } });
  }

  protected abstract getViewBaseElement(ID: string): ViewElementBase;
  protected abstract getViewBaseElements(): ViewElementBase[];

  protected getCanvasElementByID(ID: string) {
    return this.Canvas.getObjects().find(x => x[CProps.ID] == ID);
  }

  protected getCanvasElementByCanvasID(canvasID: string) {
    return this.Canvas.getObjects().find(x => x[CProps.canvasID] == canvasID);
  }

  protected changeObjectType(id: string, newType: string) {
    let obj = this.Canvas.getObjects().find(x => x[CProps.ID] == id);
    if (obj['_objects']) {
      let txt = obj['_objects'].find(x => x[CProps.myType] == CTypes.ElementType);
      if (txt) {
        txt.text = '«' + newType + '»';
        obj.dirty = true;
        this.Canvas.requestRenderAll();
        this.onCanvasModified();
      }
    }
    else if (obj[CProps.textID]) {
      let txt = this.getCanvasElementByCanvasID(obj[CProps.textID]);
      txt.text = '«' + newType + '»';
      txt.dirty = true;
      this.Canvas.requestRenderAll();
      this.onCanvasModified();
    }
  }

  protected changeObjectPhysicalElement(id: string, phyEle: DataFlowEntity) {
    const obj = this.Canvas.getObjects().find(x => x[CProps.ID] == id);
    if (obj['_objects']) {
      let txt = obj['_objects'].find(x => x[CProps.myType] == CTypes.ElementPhyElement);
      if (txt) {
        txt.text = phyEle ? phyEle.GetProperty('Name') : '';
        obj.dirty = true;
        this.Canvas.requestRenderAll();
        this.onCanvasModified();
      }
      else {
        const ephy = new fabric.Text(phyEle ? phyEle.GetProperty('Name') : '', {
          fontSize: this.currentFontSizeConfig.Type, fill: this.theme.Primary,
          originX: 'center', left: 0, top: obj.height / 2 - 15,
          myType: CTypes.ElementPhyElement
        });
        if (obj[CProps.elementTypeID] == ElementTypeIDs.LogTrustArea) {
          ephy[CProps.originX] = 'left';
          ephy[CProps.originY] = 'top';
          ephy.set({
            'left': -obj['width'] / 2 + 5,
            'top': -obj['height'] / 2 + 35
          });
        }

        obj.add(ephy);
        this.Canvas.requestRenderAll();
        this.onCanvasModified();
      }
    }
    else if (obj[CProps.textID]) {
      let txt = this.getCanvasElementByCanvasID(obj[CProps.textID]);
      txt.text = phyEle ? phyEle.GetProperty('Name') : '';
      txt.dirty = true;
      this.Canvas.requestRenderAll();
      this.onCanvasModified();
    }
  }

  protected changeObjectName(id: string) {
    let obj = this.getCanvasElementByID(id);
    let ele = this.getViewBaseElement(id);
    let txt = null;
    if (obj['_objects']) {
      txt = obj['_objects'].find(x => x[CProps.myType] == CTypes.ElementName);
    }
    else if (obj[CProps.myType] == CTypes.DataFlowLine) {
      txt = this.Canvas.getObjects().find(x => x[CProps.myType] == CTypes.ElementName && x[CProps.flowID] == obj[CProps.canvasID]);
    }

    if (txt && ele) {
      if (ele['Ref'] != null) txt.text = ele['Ref']['NameRaw'];
      else txt.text = ele.NameRaw;
      if (ele instanceof ContextFlow || ele instanceof DataFlow) {
        if (ele.FlowType == FlowTypes.Extend) txt.text = '«extend»';
        else if (ele.FlowType == FlowTypes.Include) txt.text = '«include»';
        if (txt.styles) delete txt.styles[0];
        if (ele instanceof DataFlow && ele.ShowProtocolDetails) {
          if (ele.ProtocolStack?.length > 0) {
            txt.text = txt.text + ' (' + ele.ProtocolStack.map(x => x.NameRaw).join(', ') + ')';
          }
          if (ele.SenderInterface) {
            txt.text = ele.SenderInterface.Name + ': ' + txt.text;
            if (!txt.styles || !txt.styles[0]) txt.styles = { 0: {} };
            for (let i = 0; i < ele.SenderInterface.Name.length; i++) txt.styles[0][i] = { fill: this.theme.Primary };
          }
          if (ele.ReceiverInterface) {
            txt.text =  txt.text + ' :' + ele.ReceiverInterface.Name;
            if (!txt.styles || !txt.styles[0]) txt.styles = { 0: {} };
            for (let i = txt.text.length - ele.ReceiverInterface.Name.length; i < txt.text.length; i++) txt.styles[0][i] = { fill: this.theme.Primary };
          }
        }
        txt = this.flowUpdateText(obj);
        txt.set(CProps.visible, ele.Data['ShowName'] == null || ele.Data['ShowName']);
      }
      else {
        let prop: IProperty;
        if (ele instanceof DFDElementRef || ele instanceof DFDContainerRef || ele instanceof ContextElementRef || ele instanceof SystemContextContainerRef) {
          prop = ele.Ref.GetProperties().find(x => x.ID == 'Name');
        }
        else prop = ele.GetProperties().find(x => x.ID == 'Name');
        if (prop.Type == PropertyEditTypes.TextArea) {
          txt.set('top', -txt['height']/2); // multi line 
        }
      }

      txt.set('dirty', true);
      this.Canvas.requestRenderAll();
      //this.onCanvasModified();
    }
  }

  protected changeObjectBorder(id: string) {
    const obj = this.getCanvasElementByID(id);
    const ele = this.getViewBaseElement(id);
    let border = null;
    if (obj['_objects']) {
      border = obj['_objects'].find(x => x[CProps.myType] == CTypes.ElementBorder);
    }
    else if (obj[CProps.myType] == CTypes.DataFlowLine) {
      border = obj;
    }

    if (border && ele) {
      if (ele.OutOfScope) {
        border.set('strokeDashArray', [2, 2]);
      }
      else if (obj[CProps.myType] == CTypes.TrustArea) {
        border.set('strokeDashArray', [10, 5]);
      }// else if dashed data flow, but this case is rarely
      else {
        delete border['strokeDashArray'];
      }

      border.set('dirty', true);
      this.Canvas.requestRenderAll();
    }
  }

  protected changeFontSize() {
    this.Canvas.getObjects().forEach(obj => {
      let etype = null, etxt = null, ephy = null;
      if (obj._objects) {
        etype = obj._objects.find(x => x[CProps.myType] == CTypes.ElementType);
        ephy = obj._objects.find(x => x[CProps.myType] == CTypes.ElementPhyElement);
        etxt = obj._objects.find(x => x[CProps.myType] == CTypes.ElementName);
      }
      else if (obj[CProps.myType] == CTypes.DataFlowLine) { etxt = this.getCanvasElementByCanvasID(obj[CProps.textID]); }

      if (etxt) etxt.set(CProps.fontSize, obj[CProps.myType] != CTypes.TrustArea ? this.currentFontSizeConfig.Name : this.currentFontSizeConfig.Type);
      if (etype) etype.set(CProps.fontSize, this.currentFontSizeConfig.Type);
      if (ephy) ephy.set(CProps.fontSize, this.currentFontSizeConfig.Type);
    });
    this.Canvas.requestRenderAll();
    this.onCanvasModified();
  }

  protected renderIcon(ctx: CanvasRenderingContext2D, left, top, styleOverride, fabricObject) {
    //if (fabricObject[CProps.myType] == 'Annotation') return;
    var size = 24;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

    let delImg = document.createElement('img');
    delImg.src = deleteIcon;
    ctx.drawImage(delImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private intersectionPairs = [];
  private blockCheckingIntersection: boolean = false;
  private checkIntersection() {
    if (!this.blockCheckingIntersection) {
      this.blockCheckingIntersection = true;
      setTimeout(() => {
        this.intersectionPairs.forEach(x => x[2] = 0); // reset
        let intersections: IKeyValuePair[] = []; // temporary save all intersections
        let objs = this.Canvas.getObjects();
        for (let i = 0; i < objs.length; i++) {
          for (let j = i; j < objs.length; j++) {
            let o1 = objs[i];
            let o2 = objs[j];
            if (o1[CProps.ID] != o2[CProps.ID] && o1.intersectsWithObject(o2)) {
              let isContainer = (o) => {
                return o[CProps.elementTypeID] == ElementTypeIDs.LogTrustArea || o[CProps.elementTypeID] == ElementTypeIDs.PhyTrustArea;
              }

              let ta = null;
              let child = null;
              if (isContainer(o1) && isContainer(o2)) { // both are TAs
                if (o1.width * o1.height > o2.width * o2.height) {
                  ta = o1;
                  child = o2;
                }
                else {
                  ta = o2;
                  child = o1;
                }
              }
              else if (isContainer(o1)) {
                ta = o1;
                child = o2;
              }
              else if (isContainer(o2)) {
                ta = o2;
                child = o1;
              }

              if (ta) {
                if (!intersections.some(x => x.key == child)) intersections.push({ key: child, value: [] }); // create for child an array with all TAs that include the child
                intersections.find(x => x.key == child).value.push(ta);
              }
            }
          }
        }

        intersections.forEach(objPair => {
          let smallestTA = objPair.value[0];
          if (objPair.value.length > 1) {
            smallestTA = objPair.value.find(y => y.width * y.height == Math.min(...objPair.value.map(x => x.width * x.height)));
          }

          let container = this.getViewBaseElement(smallestTA[CProps.ID]);
          if (container && this.instanceOfContainer(container)) {
            let child = this.getViewBaseElement(objPair.key[CProps.ID]);
            if (child) {
              container.AddChild(child);
              //console.log('dia add1', child.Name, 'to',container.Name);
              const existing = this.intersectionPairs.find(x => x[0][CProps.ID] == smallestTA[CProps.ID] && x[1][CProps.ID] == objPair.key[CProps.ID]);
              if (!existing) this.intersectionPairs.push([smallestTA, objPair.key, 1]);
              else existing[2] = 1;
            }
          }
        });

        for (let i = 0; i < this.intersectionPairs.length; i++) {
          let x = this.intersectionPairs[i];
          if (x[2] == 0) {
            let ta = this.getViewBaseElement(x[0][CProps.ID]);
            let child = this.getViewBaseElement(x[1][CProps.ID]);
            if (ta && child && this.instanceOfContainer(ta)) {
              //console.log('dia add2', child.Name, 'to', ta.Root.Data['Name']);
              if (ta.Root == null) {
                console.log('Root is null');
              }
              ta.Root.AddChild(child);
              this.intersectionPairs.splice(i, 1);
              i--;
            }
          }
        }

        this.blockCheckingIntersection = false;
      }, 1000);
    }
  }

  private getCanvasSize() {
    let xMin = Number.MAX_VALUE, xMax = Number.MIN_VALUE, yMin = Number.MAX_VALUE, yMax = Number.MIN_VALUE;
    this.Canvas.getObjects().forEach(ele => {
      if (ele[CProps.myType] != CTypes.GridLine) {
        if (ele['aCoords']['tl']['x'] < xMin) xMin = ele['aCoords']['tl']['x'];
        if (ele['aCoords']['br']['x'] > xMax) xMax = ele['aCoords']['br']['x'];
        if (ele['aCoords']['tl']['y'] < yMin) yMin = ele['aCoords']['tl']['y'];
        if (ele['aCoords']['br']['y'] > yMax) yMax = ele['aCoords']['br']['y'];
      }
    });

    xMin -= 5;
    yMin -= 5;
    xMax += 5;
    yMax += 5;
    
    this.xMax = xMax;
    this.yMax = yMax;

    return [xMin, yMin, xMax, yMax];
  }

  private setCanvasColor() {
    if (this.Canvas.backgroundColor != this.BackgroundColor) {
      this.Canvas.backgroundColor = this.BackgroundColor;
      fabric.Object.prototype.cornerColor = this.StrokeColor;
      let setColor = (obj: any) => {
        if (obj.stroke && obj.stroke != this.theme.Primary) {
          obj.set('stroke', this.StrokeColor);
        }
        if (obj.fill && obj.fill != this.theme.Primary) {
          let fill = '';
          if (obj.fill == 'white') fill = 'black';
          else if (obj.fill == 'black' || obj.fill == 'rgb(0,0,0)') fill = 'white';
          else if (obj.fill == 'transparent') fill = obj.fill;
          else if (obj.fill == CanvasBase.BackgroundColorDark) fill = CanvasBase.BackgroundColorLight;
          else if (obj.fill == CanvasBase.BackgroundColorLight) fill = CanvasBase.BackgroundColorDark;
          else {
            console.log('obj fill', obj.fill);
          }
          obj.set('fill', fill);
        }
        if (obj.cornerColor && obj.cornerColor != this.theme.Primary) {
          let col = '';
          if (obj.cornerColor == 'transparent') col = 'transparent';
          else if (obj.cornerColor == 'white') col = 'black';
          else if (obj.cornerColor == 'black') col = 'white';
          else {
            console.log('cornerColor', obj.cornerColor);
          }
          obj.set('cornerColor', col);
        }
      };
      let checkObjects = (objs: any[]) => {
        objs.forEach(x => {
          setColor(x);
          if (x._objects) checkObjects(x._objects);
        });
      };
      checkObjects(this.Canvas.getObjects());
      this.Canvas.renderAll();
    }
  }

  private instanceOfCanvasFlow(object: any): object is ICanvasFlow {
    return object instanceof DataFlow || object instanceof ContextFlow;
  }

  private instanceOfContainer(object: any): object is IContainer {
    if (object instanceof DFDContainerRef) return true;
    return object instanceof DFDContainer || object instanceof SystemContextContainer;
  }

  private instanceOfElementType(object: any): object is IElementType {
    return object instanceof ContextElement || object instanceof DFDElement;
  }
}

export class HWDFCanvas extends CanvasBase {
  public Diagram: HWDFDiagram;

  public CopyElement() {
    if (this.SelectedElement instanceof DFDElementRef || this.SelectedElement instanceof DFDContainerRef) return;
    if (this.SelectedElement instanceof DataFlow) return;
    this.copyID = this.SelectedElement.ID;
  }

  public PasteElement() {
    if (!this.copyID) return;
    const src = this.getViewBaseElement(this.copyID) as DFDElement;
    const srcObj = this.getCanvasElementByID(this.copyID);
    if (src) {
      const copy = this.createElement({ stencilRef: { name: '', stencilID: src.GetProperty('Type').ID } }, srcObj.left +  srcObj.width + 10, srcObj.top);
      copy.CopyFrom(src.Data);
      //copy.Name = StringExtension.FindUniqueName(src.GetProperty('Type').Name, this.getViewBaseElements().map(x => x.Name));
      copy.Name += '-Copy';
      const copyObj = this.getCanvasElementByID(copy.ID);
      copyObj.set('width', srcObj.width);
      copyObj.set('height', srcObj.height);
      this.fireScaling(copyObj);
      this.copyID = null;
    }
  }

  protected initializeCanvas(cc: HTMLElement): boolean {
    if (!super.initializeCanvas(cc)) return false;

    if (!this.Diagram.Canvas && this.Diagram.DiagramType == DiagramTypes.Hardware) {
      let stencil = this.dataService.Config.GetStencilTypes().find(x => x.ElementTypeID == ElementTypeIDs.PhyTrustArea && x.Name == 'Device Casing');
      if (!stencil) stencil = this.dataService.Config.GetStencilTypes().find(x => x.IsDefault && x.ElementTypeID == ElementTypeIDs.PhyTrustArea);
      const element = this.createElement({ stencilRef: { name: '', stencilID: stencil.ID } }, 5, 5);
      let obj = this.getCanvasElementByID(element.ID);
      element.Name = this.dataService.Project.FindDeviceOfDiagram(this.Diagram)?.Name + "'s Casing";
      obj.set('scaleX', (cc.clientWidth - 200) / obj.width);
      obj.set('scaleY', (cc.clientHeight - 100) / obj.height);
      this.fireScaling(obj);
      setTimeout(() => {
        this.SendToBack();
        this.SelectedElement = null;
      }, 100);
    }

    this.dataService.Project.DFDElementsChanged.subscribe(change => {
      if (change.Type == DataChangedTypes.Removed) {
        this.deleteElement(change.ID);
      }
    });
    return true;
  }

  protected instantiateFlow(): ViewElementBase {
    return DFDElement.Instantiate(DataFlow.GetDefaultType(this.dataService.Config), this.dataService.Project, this.dataService.Config) as DataFlow;
  }

  protected createElement(dragDropData: IDragDropData, posX: number, posY: number): ViewElementBase {
    let type: StencilType;
    let element: DFDElement;
    if (dragDropData.stencilRef.stencilID) {
      type = this.dataService.Config.GetStencilType(dragDropData.stencilRef.stencilID);
      element = DFDElement.Instantiate(type, this.dataService.Project, this.dataService.Config);
      if (type.Name != dragDropData.stencilRef.name) {
        element.Name = StringExtension.FindUniqueName(dragDropData.stencilRef.name, this.getViewBaseElements().map(x => x.Name));
      }
    }
    else if (dragDropData.stencilRef.elementID) {
      type = this.dataService.Project.GetDFDElement(dragDropData.stencilRef.elementID).GetProperty('Type');
      element = DFDElementRef.InstantiateRef(this.dataService.Project.GetDFDElement(dragDropData.stencilRef.elementID), this.dataService.Project, this.dataService.Config);
    }
    else if (dragDropData.stencilRef.templateID) {
      let template = this.dataService.Config.GetStencilTypeTemplate(dragDropData.stencilRef.templateID);
      for (let i = 0; i < template.StencilTypes.length; i++) {
        let name = template.Layout[i].name;
        if (!name) name = template.StencilTypes[i].Name;
        element = this.createElement({ stencilRef: { name: name, stencilID: template.StencilTypes[i].ID } }, posX + template.Layout[i].x, posY + template.Layout[i].y) as DFDElement;
        if (template.StencilTypes[i].ElementTypeID == ElementTypeIDs.PhyTrustArea || template.StencilTypes[i].ElementTypeID == ElementTypeIDs.LogTrustArea) {
          element.Name = StringExtension.FindUniqueName(dragDropData.stencilRef.name, this.dataService.Project.GetDFDElements().filter(x => x != element).map(x => x.Name));
          let obj = this.getCanvasElementByID(element.ID);
          obj.set('scaleX', (template.Layout[i].width) / obj.width);
          obj.set('scaleY', (template.Layout[i].height) / obj.height);
          this.fireScaling(obj);
        }
      }

      return element;
    }

    element.NameChanged.subscribe(x => this.changeObjectName(element.ID));
    element.OutOfScopeChanged.subscribe(x => this.changeObjectBorder(element.ID));
    element.TypeChanged.subscribe(x => this.changeObjectType(element.ID, x.Name));
    element.PhysicalElementChanged.subscribe(x => this.changeObjectPhysicalElement(element.ID, x));
    let x = 0; //ev.e.dataTransfer.getData("offsetX");
    let y = 0; //ev.e.dataTransfer.getData("offsetY");
    let visElement = null;
    if (type.ElementTypeID == ElementTypeIDs.PhyProcessing || type.ElementTypeID == ElementTypeIDs.LogProcessing) visElement = this.createProcessing(posX - 0 * x, posY - 0 * y, element);
    else if (type.ElementTypeID == ElementTypeIDs.PhyDataStore || type.ElementTypeID == ElementTypeIDs.LogDataStore) visElement = this.createDataStore(posX - 0 * x, posY - 0 * y, element);
    else if (type.ElementTypeID == ElementTypeIDs.PhyExternalEntity || type.ElementTypeID == ElementTypeIDs.LogExternalEntity) visElement = this.createExternalEntity(posX - 0 * x, posY - 0 * y, element);
    else if (type.ElementTypeID == ElementTypeIDs.DataFlow) visElement = this.createFlow(posX - 0 * x, posY - 0 * y, posX - 0 * x + 200, posY - 0 * y, element as DataFlow);
    else if (type.ElementTypeID == ElementTypeIDs.PhyTrustArea || type.ElementTypeID == ElementTypeIDs.LogTrustArea) visElement = this.createTrustArea(posX - 0 * x, posY - 0 * y, element);
    else if (type.ElementTypeID == ElementTypeIDs.PhysicalLink) visElement = this.createPhysicalLink(posX - 0 * x, posY - 0 * y, element);
    else if (type.ElementTypeID == ElementTypeIDs.Interface) visElement = this.createInterface(posX - 0 * x, posY - 0 * y, element);

    if (visElement != null) {
      this.Diagram.Elements.AddChild(element);
      this.Canvas.add(visElement);
      if (type.ElementTypeID == ElementTypeIDs.PhyTrustArea || type.ElementTypeID == ElementTypeIDs.LogTrustArea) this.Canvas.sendToBack(visElement);
      this.SelectionChanged.emit(element);
      this.onCanvasModified();
      return element;
    }
  }

  protected getFlowAnchorPoint(anchor: AnchorDirections, obj) {
    if (obj[CProps.myType] == CTypes.Process) {
      if ([AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].includes(anchor)) {
        const offset = 5;
        if (anchor == AnchorDirections.NorthEast) return [obj.left + obj.width - offset, obj.top + offset];
        else if (anchor == AnchorDirections.NorthWest) return [obj.left + offset, obj.top + offset];
        else if (anchor == AnchorDirections.SouthEast) return [obj.left + obj.width - offset, obj.top + obj.height - offset];
        else if (anchor == AnchorDirections.SouthWest) return [obj.left + offset, obj.top + obj.height - offset];
      }
    }
    else if (obj[CProps.myType] == CTypes.DataStore) {
      if ([AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].includes(anchor)) {
        const offset = 7;
        if (anchor == AnchorDirections.NorthEast) return [obj.left + obj.width, obj.top + offset];
        else if (anchor == AnchorDirections.NorthWest) return [obj.left, obj.top + offset];
        else if (anchor == AnchorDirections.SouthEast) return [obj.left + obj.width, obj.top + obj.height - offset];
        else if (anchor == AnchorDirections.SouthWest) return [obj.left, obj.top + obj.height - offset];
      }
    }
    else if (obj[CProps.myType] == CTypes.PhysicalLink) {
      if ([AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].includes(anchor)) {
        const offset = obj.width/7;
        if (anchor == AnchorDirections.NorthWest) return [obj.left + offset, obj.top];
        else if (anchor == AnchorDirections.SouthEast) return [obj.left + obj.width - offset, obj.top + obj.height];
      }
    }

    return super.getFlowAnchorPoint(anchor, obj);
  }

  protected subscribeScaling(obj) {
    switch (obj[CProps.myType]) {
      case CTypes.DataStore: obj.on('scaling', (e) => this.onScaleDataStore(e));
        break;
      case CTypes.Process: obj.on('scaling', (e) => this.onScaleProcessing(e));
        break;
      case CTypes.ExternalEntity: obj.on('scaling', (e) => this.onScaleExternalEntity(e));
        break;
      case CTypes.PhysicalLink: obj.on('scaling', (e) => this.onScalePhysicalLink(e));
        break;
      case CTypes.Interface: obj.on('scaling', (e) => this.onScaleInterface(e));
        break;
      case CTypes.TrustArea: obj.on('scaling', (e) => this.onScaleTrustArea(e));
        break;
      default:
        if (![CTypes.Annotation, CTypes.TextPosPoint, CTypes.ElementName, CTypes.DataFlowLine, CTypes.DataFlowArrowE, CTypes.DataFlowCircle, CTypes.DataFlowPoint].includes(obj[CProps.myType])) {
          console.error('Unknown type: ', obj, obj[CProps.myType]);
        }
        break;
    }
  }

  protected getViewBaseElement(ID: string): ViewElementBase {
    return this.dataService.Project.GetDFDElement(ID);
  }

  protected getViewBaseElements(): ViewElementBase[] {
    return this.dataService.Project.GetDFDElements();
  }

  private createDataStore(left: number, top: number, element: DFDElement): fabric.Object {
    const wid = 140;
    const hei = 75;

    // M 0 8 L 0 66 A 10 1.3 0 0 0 140 66 L 140 8 A 10 1.3 0 0 0 0 8 A 10 1.3 0 0 0 140 8
    const e = new fabric.Path(this.createDataStorePath(wid, hei), {
      fill: 'transparent', stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, objectCaching: false,
      myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 2,
      myType: CTypes.ElementType
    });
    const ephy = new fabric.Text(element.PhysicalElement ? element.PhysicalElement.GetProperty('Name') : '', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.theme.Primary,
      originX: 'center', left: wid / 2, top: hei-16,
      myType: CTypes.ElementPhyElement
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt, ephy, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: false, lockScalingY: false,
      hasBorders: false, subTargetCheck: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: CTypes.DataStore
    });

    g.on('scaling', (e) => this.onScaleDataStore(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private createDataStorePath(wid: number, hei: number): string {
    const ps = [
      'M 0 8 L 0',
      (hei-9).toString(),
      'A 10 1.3 0 0 0',
      wid.toString(),
      (hei-9).toString(),
      'L',
      wid.toString(),
      '8 A 10 1.3 0 0 0 0 8 A 10 1.3 0 0 0',
      wid.toString(),
      '8'
    ];
    return ps.join(' ');
  }

  private onScaleDataStore(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    let etype = g._objects.find(x => x[CProps.myType] == CTypes.ElementType);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });
    const tmp = new fabric.Path(this.createDataStorePath(wg, hg));
    e.set('path', tmp.path);
    e.set('pathOffset', { x: wg/2, y: hg/2 });
    e.setCoords();
    if (etype) etype.set({
      'left': 0,
      'top': -hg / 2 + 2
    });
    this.onCanvasModified();
  }

  private createProcessing(left: number, top: number, element: DFDElement): fabric.Object {
    const wid = 140;
    const hei = 75;
    const e = new fabric.Rect({
      stroke: this.StrokeColor, strokeWidth: this.StrokeWidth,
      rx: 15, ry: 15,
      width: wid, height: hei, fill: 'transparent',
      myType: CTypes.ElementBorder
    });

    let spl = null, spr = null;

    if (element.GetProperties().some(x => x.Type == PropertyEditTypes.DiagramReference)) {
      const xOff = 15;
      spl = new fabric.Line([0 + xOff, 0, 0 + xOff, hei], {
        stroke: this.StrokeColor,
        strokeWidth: this.StrokeWidth
      });
      spr = new fabric.Line([wid - xOff, 0, wid - xOff, hei], {
        stroke: this.StrokeColor,
        strokeWidth: this.StrokeWidth
      });
    }

    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 5,
      myType: CTypes.ElementType
    });
    const ephy = new fabric.Text(element.PhysicalElement ? element.PhysicalElement.GetProperty('Name') : '', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.theme.Primary,
      originX: 'center', left: wid / 2, top: hei-16,
      myType: CTypes.ElementPhyElement
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e];
    if (spl) parts.push(...[spl, spr]);
    parts.push(...[etype, etxt, ephy, ...this.createFlowAnchors(wid, hei, true, true, false, true)]);
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: false, lockScalingY: false, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: 'P', subTargetCheck: true
    });

    g.on('scaling', (e) => this.onScaleProcessing(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleProcessing(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });
    this.onCanvasModified();
  }

  private createExternalEntity(left: number, top: number, element: DFDElement): fabric.Object {
    const wid = 140;
    const hei = 75;
    const e = new fabric.Rect({
      stroke: element instanceof DFDElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: wid, height: hei, fill: 'transparent', myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 5,
      myType: CTypes.ElementType
    });
    const ephy = new fabric.Text(element.PhysicalElement ? element.PhysicalElement.GetProperty('Name') : '', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.theme.Primary,
      originX: 'center', left: wid / 2, top: hei-16,
      myType: CTypes.ElementPhyElement
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt, ephy, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true,
      lockRotation: true, lockScalingX: false, lockScalingY: false,
      hasBorders: false, subTargetCheck: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: CTypes.ExternalEntity
    });

    g.on('scaling', (e) => this.onScaleExternalEntity(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleExternalEntity(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });
    this.onCanvasModified();
  }

  private createPhysicalLink(left: number, top: number, element: DFDElement): fabric.Object {
    const wid = 140;
    const hei = 75;
    const e = new fabric.Polygon([
      { x: wid/7, y: 0 },
      { x: wid, y: 0 },
      { x: wid - wid/7, y: hei },
      { x: 0, y: hei }
    ], {
      stroke: element instanceof DFDElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      fill: 'transparent', myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2 + 5, top: 5,
      myType: CTypes.ElementType
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name,
      fill: this.StrokeColor,
      originX: 'center',
      left: wid / 2 - 3, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left,
      top: top,
      hasControls: true,
      //cornerColor: 'transparent',
      lockRotation: true, lockScalingX: false, lockScalingY: false,
      hasBorders: false, subTargetCheck: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: CTypes.PhysicalLink
    });

    g.on('scaling', (e) => this.onScalePhysicalLink(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScalePhysicalLink(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });    
    let pts = [
      { x: wg/7, y: 0 },
      { x: wg, y: 0 },
      { x: wg - wg/7, y: hg },
      { x: 0, y: hg }
    ];
    e.set('points', pts);
    e.set('pathOffset', { x: wg/2, y: hg/2 });
    this.onCanvasModified();
  }

  private createInterface(left: number, top: number, element: DFDElement): fabric.Object {
    const wid = 140;
    const hei = 75;
    const e = new fabric.Polygon([
      { x: 0, y: 0 },
      { x: wid - wid/7, y: 0 },
      { x: wid, y: hei / 2 },
      { x: wid - wid/7, y: hei },
      { x: 0, y: hei },
      { x: wid/7, y: hei / 2 }
    ], {
      stroke: this.StrokeColor, strokeWidth: this.StrokeWidth, fill: 'transparent', myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2 + 5, top: 5,
      myType: CTypes.ElementType
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2 + 5, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true,
      hasBorders: false, subTargetCheck: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: CTypes.Interface
    });

    g.on('scaling', (e) => this.onScaleInterface(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleInterface(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });
    let pts = [
      { x: 0, y: 0 },
      { x: wg - wg/7, y: 0 },
      { x: wg, y: hg / 2 },
      { x: wg - wg/7, y: hg },
      { x: 0, y: hg },
      { x: wg/7, y: hg / 2 }
    ];
    e.set('points', pts);
    e.set('pathOffset', { x: wg/2, y: hg/2 });
    this.onCanvasModified();
  }

  private createTrustArea(left: number, top: number, element: DFDElement, width = 350, height = 200): fabric.Object {
    const e = new fabric.Rect({
      stroke: (element instanceof DFDElementRef || element instanceof DFDContainerRef) ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: width, height: height,
      strokeDashArray: [10, 5], fill: 'transparent',
      myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«' + element.GetProperty('Type').GetProperty('Name') + '»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'left', originY: 'top', left: 5, top: 20,
      myType: CTypes.ElementType
    });
    const ephy = new fabric.Text(element.PhysicalElement ? element.PhysicalElement.GetProperty('Name') : '', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.theme.Primary,
      originX: 'left', originY: 'top', left: 5, top: 35,
      myType: CTypes.ElementPhyElement
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'left', originY: 'top',
      left: 5, top: 5,
      myType: CTypes.ElementName
    });

    const g = new fabric.Group([e, etxt, etype, ephy], {
      left: left, top: top,
      hasControls: true,
      hasBorders: false,
      lockRotation: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: element.GetProperty('Type').ElementTypeID, myType: CTypes.TrustArea
    });

    g.on('scaling', (e) => this.onScaleTrustArea(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleTrustArea(event) {
    this.onScaleElement(event);
    const g = event.transform.target;
    const e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    const etype = g._objects.find(x => x[CProps.myType] == CTypes.ElementType);
    const ephy = g._objects.find(x => x[CProps.myType] == CTypes.ElementPhyElement);
    const etxt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);

    const wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2, 'top': -hg / 2
    });

    etype.set({
      'left': -wg / 2 + 5,
      'top': -hg / 2 + 20
    });
    ephy?.set({
      'left': -wg / 2 + 5,
      'top': -hg / 2 + 35
    });
    etxt.set({
      'left': -wg / 2 + 5,
      'top': -hg / 2 + 5
    });
    this.onCanvasModified();
  }
}

export class CtxCanvas extends CanvasBase {

  public Diagram: CtxDiagram;

  public IsContextDiagram: boolean = false;
  public IsUseCaseDiagram: boolean = false;

  constructor(dia: Diagram, dataService: DataService, theme: ThemeService, dialog: DialogService, locStorage: LocalStorageService, translate: TranslateService, nodeType: string) {
    super(dia, dataService, theme, dialog, locStorage, translate);

    this.IsContextDiagram = nodeType == 'context';
    this.IsUseCaseDiagram = nodeType == 'use-case';
  }

  public CopyElement() {
    if (this.SelectedElement instanceof ContextElementRef || this.SelectedElement instanceof SystemContextContainerRef) return;
    if (this.SelectedElement instanceof Device || this.SelectedElement instanceof MobileApp) return;
    this.copyID = this.SelectedElement.ID;
  }

  public PasteElement() {
    if (!this.copyID) return;
    const src = this.getViewBaseElement(this.copyID) as ContextElement;
    const srcObj = this.getCanvasElementByID(this.copyID);
    if (src) {
      const copy = this.createElement({ contextRef: { name: ContextElementTypeUtil.ToString(src.Type) } }, srcObj.left +  srcObj.width + 10, srcObj.top);
      copy.CopyFrom(src.Data);
      //copy.Name = StringExtension.FindUniqueName(ContextElementTypeUtil.ToString(src.Type), this.getViewBaseElements().map(x => x.Name));
      copy.Name += '-Copy';
      const copyObj = this.getCanvasElementByID(copy.ID);
      copyObj.set('width', srcObj.width);
      copyObj.set('height', srcObj.height);
      this.fireScaling(copyObj);
      this.copyID = null;
    }
  }

  protected initializeCanvas(cc: HTMLElement): boolean {
    if (!super.initializeCanvas(cc)) return false;

    if (this.IsContextDiagram) {
      this.dataService.Project.GetDevices().filter(x => !(x instanceof ContextElementRef)).forEach(dev => {
        let obj = this.getCanvasElementByID(dev.ID);
        if (!obj) {
          let visElement = this.createDevice(cc.clientWidth / 2 - 100, cc.clientHeight / 2 - 100, dev, true);

          dev.NameChanged.subscribe(x => this.changeObjectName(dev.ID));

          this.Diagram.Elements.AddChild(dev);
          this.Canvas.add(visElement);
          this.onCanvasModified();
        }

        dev.DeviceInterfaceNameChanged.subscribe(x => this.changeDeviceInterfaceVisibility(dev));
      });
      this.dataService.Project.GetMobileApps().filter(x => !(x instanceof ContextElementRef)).forEach(app => {
        let obj = this.getCanvasElementByID(app.ID);
        if (!obj) {
          let visElement = this.createMobileApp(cc.clientWidth / 2 - 100, cc.clientHeight / 2 - 100, app, true);

          app.NameChanged.subscribe(x => this.changeObjectName(app.ID));

          this.Diagram.Elements.AddChild(app);
          this.Canvas.add(visElement);
          this.onCanvasModified();
        }

        app.MobileAppInterfaceNameChanged.subscribe(x => this.changeMobileAppInterfaceVisibility(app));
      });
    }

    this.dataService.Project.ContextElementsChanged.subscribe(change => {
      if (change.Type == DataChangedTypes.Removed) {
        this.deleteElement(change.ID);
      }
    });

    return true;
  }

  protected instantiateFlow(): ViewElementBase {
    return ContextElement.Instantiate(ContextElementTypes.Flow, this.dataService.Project, this.dataService.Config) as ContextFlow;
  }

  protected getFlowAnchorPoint(anchor: string, obj) {
    if (obj[CProps.myType] == CTypes.DeviceInterface) {
      let e = obj._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
      if (anchor == AnchorDirections.North) return [obj.left + obj.width / 2 + e.left + e.width / 2, obj.top + obj.height / 2 + e.top];
      else if (anchor == AnchorDirections.East) return [obj.left + obj.width / 2 + e.left + e.width, obj.top + obj.height / 2 + e.top + e.height / 2];
      else if (anchor == AnchorDirections.South) return [obj.left + obj.width / 2 + e.left + e.width / 2, obj.top + obj.height / 2 + e.top + e.height];
      else if (anchor == AnchorDirections.West) return [obj.left + obj.width / 2 + e.left, obj.top + obj.height / 2 + e.top + e.height / 2];
      else if (anchor == AnchorDirections.NorthWest) return [obj.left + obj.width / 2 + e.left, obj.top + obj.height / 2 + e.top];
      else if (anchor == AnchorDirections.NorthEast) return [obj.left + obj.width / 2 + e.left + e.width, obj.top + obj.height / 2 + e.top];
      else if (anchor == AnchorDirections.SouthEast) return [obj.left + obj.width / 2 + e.left + e.width, obj.top + obj.height / 2 + e.top + e.height];
      else if (anchor == AnchorDirections.SouthWest) return [obj.left + obj.width / 2 + e.left, obj.top + obj.height / 2 + e.top + e.height];
      else return null;
    }
    else if (obj[CProps.myType] == CTypes.Interactor) {
      let e = obj._objects.find(x => x[CProps.myType] == CTypes.InteractorArms);
      let l = obj._objects.find(x => x[CProps.myType] == CTypes.InteractorLeg1);
      if (anchor == AnchorDirections.North) return [obj.left + obj.width / 2, obj.top+5];
      else if (anchor == AnchorDirections.East) return [obj.left + obj.width / 2 + e.left + e.width, obj.top + obj.height / 2 + e.top + e.height / 2];
      else if (anchor == AnchorDirections.South) return [obj.left + obj.width / 2, obj.top + obj.height / 2 + 10];
      else if (anchor == AnchorDirections.West) return [obj.left + obj.width / 2 + e.left, obj.top + obj.height / 2 + e.top + e.height / 2];
      else return null;
    }

    return super.getFlowAnchorPoint(anchor, obj);
  }

  protected createElement(dragDropData: IDragDropData, posX: number, posY: number): ContextElement {
    if (!dragDropData.contextRef) return null;

    let element: ContextElement;
    let visElement = null;
    if (dragDropData.contextRef.elementType == ContextElementTypes.Device) {
      let ref = this.dataService.Project.GetContextElement(dragDropData.contextRef.elementID);
      element = ContextElementRef.InstantiateRef(ref, this.dataService.Project, this.dataService.Config);
      visElement = this.createDevice(posX, posY, element, false);
    }
    else if (dragDropData.contextRef.name == 'Device') {
      element = this.dataService.Project.CreateDevice();
      const dev = element as Device;
      if (dragDropData.contextRef.type == '1') dev.InterfaceTop = dev.InterfaceRight = dev.InterfaceBottom = dev.InterfaceLeft = DeviceInterfaceNames.None;
      visElement = this.createDevice(posX, posY, element, dragDropData.contextRef.type == '2');
      this.NavTreeChanged.emit();
    }
    else if (dragDropData.contextRef.elementType == ContextElementTypes.MobileApp) {
      let ref = this.dataService.Project.GetContextElement(dragDropData.contextRef.elementID);
      element = ContextElementRef.InstantiateRef(ref, this.dataService.Project, this.dataService.Config);
      visElement = this.createMobileApp(posX, posY, element, false);
    }
    else if (dragDropData.contextRef.name == 'App') {
      element = this.dataService.Project.CreateMobileApp();
      const app = element as MobileApp;
      if (dragDropData.contextRef.type == '1') app.InterfaceTop = app.InterfaceRight = app.InterfaceBottom = app.InterfaceLeft = DeviceInterfaceNames.None;
      visElement = this.createMobileApp(posX, posY, element, dragDropData.contextRef.type == '2');
      this.NavTreeChanged.emit();
    }
    else if (dragDropData.contextRef.elementType == ContextElementTypes.Interactor) {
      let ref = this.dataService.Project.GetContextElement(dragDropData.contextRef.elementID);
      element = ContextElementRef.InstantiateRef(ref, this.dataService.Project, this.dataService.Config);
      visElement = this.createInteractor(posX, posY, element);
    }
    else if (dragDropData.contextRef.name == 'Interactor') {
      element = ContextElement.Instantiate(ContextElementTypes.Interactor, this.dataService.Project, this.dataService.Config);
      visElement = this.createInteractor(posX, posY, element);
    }
    else if (dragDropData.contextRef.name.startsWith('Interface')) {
      element = ContextElement.Instantiate(ContextElementTypes.Interface, this.dataService.Project, this.dataService.Config);
      visElement = this.createInterface(posX, posY, element, dragDropData.contextRef.name);
    }
    else if (dragDropData.contextRef.name == 'Use Case') {
      element = ContextElement.Instantiate(ContextElementTypes.UseCase, this.dataService.Project, this.dataService.Config);
      visElement = this.createUseCase(posX, posY, element);
    }
    else if (dragDropData.contextRef.name == 'External Entity') {
      element = ContextElement.Instantiate(ContextElementTypes.ExternalEntity, this.dataService.Project, this.dataService.Config);
      visElement = this.createExternalEntity(posX, posY, element);
    }
    else if (dragDropData.contextRef.name == 'Trust Area') {
      element = ContextElement.Instantiate(ContextElementTypes.TrustArea, this.dataService.Project, this.dataService.Config);
      visElement = this.createTrustArea(posX, posY, element);
    }

    element.NameChanged.subscribe(x => this.changeObjectName(element.ID));
    element.OutOfScopeChanged.subscribe(x => this.changeObjectBorder(element.ID));
    element.TypeChanged.subscribe(x => this.changeObjectType(element.ID, ContextElementTypeUtil.ToString(element.Type)));

    this.Diagram.Elements.AddChild(element);
    this.Canvas.add(visElement);
    if (dragDropData.contextRef.name == 'Trust Area') this.Canvas.sendToBack(visElement);
    this.SelectionChanged.emit(element);
    this.onCanvasModified();
    return element;
  }

  protected subscribeScaling(obj) {
    switch (obj[CProps.myType]) {
      case CTypes.Device: obj.on('scaling', (e) => this.onScaleDevice(e));
        break;
      case CTypes.DeviceReference: obj.on('scaling', (e) => this.onScaleDevice(e));
        break;
      case CTypes.MobileApp: obj.on('scaling', (e) => this.onScaleMobileApp(e));
        break;
      case CTypes.Interactor: obj.on('scaling', (e) => this.onScaleInteractor(e));
        break;
      case CTypes.SystemUseCase: obj.on('scaling', (e) => this.onScaleUseCase(e));
        break;
      case CTypes.DeviceInterface: obj.on('scaling', (e) => this.onScaleInterface(e));
        break;
      case CTypes.SystemExternalEntity: obj.on('scaling', (e) => this.onScaleExternalEntity(e));
        break;
      case CTypes.TrustArea: obj.on('scaling', (e) => this.onScaleTrustArea(e));
        break;
      default:
        if (![CTypes.Annotation, CTypes.TextPosPoint, CTypes.ElementName, CTypes.DataFlowLine, CTypes.DataFlowArrowE, CTypes.DataFlowCircle, CTypes.DataFlowPoint].includes(obj[CProps.myType])) {
          console.error('Unknown type: ', obj, obj[CProps.myType]);
        }
        break;
    }
  }

  protected getViewBaseElement(ID: string): ViewElementBase {
    return this.Diagram.Elements.GetChildrenFlat().find(x => x.ID == ID);
  }

  protected getViewBaseElements(): ViewElementBase[] {
    return this.Diagram.Elements.GetChildrenFlat();
  }

  private createDevice(left: number, top: number, element: ContextElement, detailedInterfaces: boolean): fabric.Object {
    let wid = 200;
    let hei = 200;
    if (this.IsUseCaseDiagram) {
      wid = 250;
      hei = 350;
    }
    const isReference = element instanceof ContextElementRef;
    const e = new fabric.Rect({
      stroke: isReference ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: wid, height: hei, fill: 'transparent', myType: CTypes.ElementBorder
    });

    const etype = new fabric.Text('«Device»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 25,
      myType: CTypes.ElementType
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: isReference ? (5) : (hei / 2 - 8), textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt];
    // detailed interfaces
    const elbl1 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor, angle: 90,
      originX: 'center', left: 20, top: hei / 2,
      myType: CTypes.DeviceLabel1
    });
    const elbl1l = new fabric.Line([20, 0, 20, hei], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.DeviceLabel1Line
    });

    const elbl2 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei - 16,
      myType: CTypes.DeviceLabel2
    });
    const elbl2l = new fabric.Line([0, hei - 20, wid, hei - 20], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.DeviceLabel2Line
    });

    const elbl3 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor, angle: 90,
      originX: 'center', left: wid, top: hei / 2,
      myType: CTypes.DeviceLabel3
    });
    const elbl3l = new fabric.Line([wid - 20, 0, wid - 20, hei], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.DeviceLabel3Line
    });

    const elbl4 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 5,
      myType: CTypes.DeviceLabel4
    });
    const elbl4l = new fabric.Line([0, 20, wid, 20], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.DeviceLabel4Line
    });

    let dev: Device = null;
    if (element instanceof Device) dev = element;
    else if (isReference && element.Ref instanceof Device) dev = element.Ref;
    if (detailedInterfaces) dev.DeviceInterfaceNameChanged.subscribe(x => this.changeDeviceInterfaceVisibility(dev));
    parts.push(...[elbl1, elbl1l, elbl2, elbl2l, elbl3, elbl3l, elbl4, elbl4l]);

    parts.push(...this.createFlowAnchors(wid, hei, true, true, true, true));

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: false, lockScalingY: false, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      myType: isReference ? CTypes.DeviceReference : CTypes.Device, subTargetCheck: true
    });

    g.on('scaling', (e) => this.onScaleDevice(e));
    this.changeDeviceInterfaceVisibility(dev, g, !detailedInterfaces);

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleDevice(event) {
    this.onScaleElement(event);
    const g = event.transform.target;
    const e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    const etxt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);
    const etype = g._objects.find(x => x[CProps.myType] == CTypes.ElementType);
    const elbl1 = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel1);
    const elbl1l = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel1Line);
    const elbl2 = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel2);
    const elbl2l = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel2Line);
    const elbl3 = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel3);
    const elbl3l = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel3Line);
    const elbl4 = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel4);
    const elbl4l = g._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel4Line);


    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });

    if (g[CProps.myType] == CTypes.DeviceReference) etxt.set({
      'left': 0,
      'top': -hg / 2 + 5
    });

    etype?.set({
      'left': 0,
      'top': -hg / 2 + 25
    });

    elbl1?.set({
      'left': -wg / 2 + 20,
      'top': 0
    });
    elbl1l?.set({
      'left': -wg / 2 + 20,
      'top': -hg / 2,
      'height': hg
    });

    elbl2?.set({
      'left': 0,
      'top': hg / 2 - 16
    });
    elbl2l?.set({
      'left': -wg / 2,
      'top': hg / 2 - 20,
      'width': wg
    });

    elbl3?.set({
      'left': wg / 2,
      'top': 0
    });
    elbl3l?.set({
      'left': wg / 2 - 20,
      'top': -hg / 2,
      'height': hg
    });

    elbl4?.set({
      'left': 0,
      'top': -hg / 2 + 5
    });
    elbl4l?.set({
      'left': -wg / 2,
      'top': -hg / 2 + 20,
      'width': wg
    });
    this.onCanvasModified();
  }

  private changeDeviceInterfaceVisibility(dev: Device, devObj?, hide = false) {
    if (devObj == null) devObj = this.getCanvasElementByID(dev.ID);
    if (devObj) {
      let elbl1 = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel1);
      let elbl1l = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel1Line);
      let elbl2 = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel2);
      let elbl2l = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel2Line);
      let elbl3 = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel3);
      let elbl3l = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel3Line);
      let elbl4 = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel4);
      let elbl4l = devObj._objects.find(x => x[CProps.myType] == CTypes.DeviceLabel4Line);

      elbl1.set('text', this.translate.instant(dev.InterfaceLeft));
      elbl1.set(CProps.visible, dev.InterfaceLeft != DeviceInterfaceNames.None && !hide);
      elbl1l.set(CProps.visible, dev.InterfaceLeft != DeviceInterfaceNames.None && !hide);
      elbl2.set('text', this.translate.instant(dev.InterfaceBottom));
      elbl2.set(CProps.visible, dev.InterfaceBottom != DeviceInterfaceNames.None && !hide);
      elbl2l.set(CProps.visible, dev.InterfaceBottom != DeviceInterfaceNames.None && !hide);
      elbl3.set('text', this.translate.instant(dev.InterfaceRight));
      elbl3.set(CProps.visible, dev.InterfaceRight != DeviceInterfaceNames.None && !hide);
      elbl3l.set(CProps.visible, dev.InterfaceRight != DeviceInterfaceNames.None && !hide);
      elbl4?.set('text', this.translate.instant(dev.InterfaceTop));
      elbl4?.set(CProps.visible, dev.InterfaceTop != DeviceInterfaceNames.None && !hide);
      elbl4l?.set(CProps.visible, dev.InterfaceTop != DeviceInterfaceNames.None && !hide);

      this.Canvas.requestRenderAll();
    }
  }

  private createMobileApp(left: number, top: number, element: ContextElement, detailedInterfaces: boolean): fabric.Object {
    let wid = 200;
    let hei = 200;
    if (this.IsUseCaseDiagram) {
      wid = 250;
      hei = 350;
    }
    let e = new fabric.Rect({
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: wid, height: hei, fill: 'transparent', myType: CTypes.ElementBorder
    });

    let etype = new fabric.Text('«App»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 25,
      myType: CTypes.ElementType
    });
    let etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    let parts = [e, etype, etxt];
    // detailed interfaces
    let elbl1 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor, angle: 90,
      originX: 'center', left: 20, top: hei / 2,
      myType: CTypes.AppLabel1
    });
    let elbl1l = new fabric.Line([20, 0, 20, hei], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.AppLabel1Line
    });

    let elbl2 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei - 16,
      myType: CTypes.AppLabel2
    });
    let elbl2l = new fabric.Line([0, hei - 20, wid, hei - 20], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.AppLabel2Line
    });

    let elbl3 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor, angle: 90,
      originX: 'center', left: wid, top: hei / 2,
      myType: CTypes.AppLabel3
    });
    let elbl3l = new fabric.Line([wid - 20, 0, wid - 20, hei], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.AppLabel3Line
    });

    let elbl4 = new fabric.Text('', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 5,
      myType: CTypes.AppLabel4
    });
    let elbl4l = new fabric.Line([0, 20, wid, 20], {
      stroke: this.StrokeColor, strokeWidth: 1, myType: CTypes.AppLabel4Line
    });

    let app: MobileApp = null;
    if (element instanceof MobileApp) app = element;
    else if (element instanceof ContextElementRef && element.Ref instanceof MobileApp) app = element.Ref;
    if (detailedInterfaces) app.MobileAppInterfaceNameChanged.subscribe(x => this.changeMobileAppInterfaceVisibility(app));
    parts.push(...[elbl1, elbl1l, elbl2, elbl2l, elbl3, elbl3l, elbl4, elbl4l]);

    parts.push(...this.createFlowAnchors(wid, hei, true, true, true, true));

    let g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: false, lockScalingY: false, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      myType: CTypes.MobileApp, subTargetCheck: true
    });

    g.on('scaling', (e) => this.onScaleMobileApp(e));
    this.changeMobileAppInterfaceVisibility(app, g, !detailedInterfaces);

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleMobileApp(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    let etype = g._objects.find(x => x[CProps.myType] == CTypes.ElementType);
    let elbl1 = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel1);
    let elbl1l = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel1Line);
    let elbl2 = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel2);
    let elbl2l = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel2Line);
    let elbl3 = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel3);
    let elbl3l = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel3Line);
    let elbl4 = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel4);
    let elbl4l = g._objects.find(x => x[CProps.myType] == CTypes.AppLabel4Line);


    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });

    etype?.set({
      'left': 0,
      'top': -hg / 2 + 25
    });

    elbl1?.set({
      'left': -wg / 2 + 20,
      'top': 0
    });
    elbl1l?.set({
      'left': -wg / 2 + 20,
      'top': -hg / 2,
      'height': hg
    });

    elbl2?.set({
      'left': 0,
      'top': hg / 2 - 16
    });
    elbl2l?.set({
      'left': -wg / 2,
      'top': hg / 2 - 20,
      'width': wg
    });

    elbl3?.set({
      'left': wg / 2,
      'top': 0
    });
    elbl3l?.set({
      'left': wg / 2 - 20,
      'top': -hg / 2,
      'height': hg
    });

    elbl4?.set({
      'left': 0,
      'top': -hg / 2 + 5
    });
    elbl4l?.set({
      'left': -wg / 2,
      'top': -hg / 2 + 20,
      'width': wg
    });
    this.onCanvasModified();
  }

  private changeMobileAppInterfaceVisibility(app: MobileApp, appObj?, hide = false) {
    if (appObj == null) appObj = this.getCanvasElementByID(app.ID);
    if (appObj) {
      let elbl1 = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel1);
      let elbl1l = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel1Line);
      let elbl2 = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel2);
      let elbl2l = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel2Line);
      let elbl3 = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel3);
      let elbl3l = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel3Line);
      let elbl4 = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel4);
      let elbl4l = appObj._objects.find(x => x[CProps.myType] == CTypes.AppLabel4Line);

      elbl1.set('text', this.translate.instant(app.InterfaceLeft));
      elbl1.set(CProps.visible, app.InterfaceLeft != DeviceInterfaceNames.None && !hide);
      elbl1l.set(CProps.visible, app.InterfaceLeft != DeviceInterfaceNames.None && !hide);
      elbl2.set('text', this.translate.instant(app.InterfaceBottom));
      elbl2.set(CProps.visible, app.InterfaceBottom != DeviceInterfaceNames.None && !hide);
      elbl2l.set(CProps.visible, app.InterfaceBottom != DeviceInterfaceNames.None && !hide);
      elbl3.set('text', this.translate.instant(app.InterfaceRight));
      elbl3.set(CProps.visible, app.InterfaceRight != DeviceInterfaceNames.None && !hide);
      elbl3l.set(CProps.visible, app.InterfaceRight != DeviceInterfaceNames.None && !hide);
      elbl4?.set('text', this.translate.instant(app.InterfaceTop));
      elbl4?.set(CProps.visible, app.InterfaceTop != DeviceInterfaceNames.None && !hide);
      elbl4l?.set(CProps.visible, app.InterfaceTop != DeviceInterfaceNames.None && !hide);

      this.Canvas.requestRenderAll();
    }
  }

  private createInteractor(left: number, top: number, element: ContextElement): fabric.Object {
    let wid = 70;
    let hei = 65;
    let actWid = 20;
    let actHei = 30;

    let h = new fabric.Circle({
      left: wid / 2, top: hei / 2 - actHei / 3, radius: actHei / 5,
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth, fill: 'transparent',
      originX: 'center', originY: 'center',
      canvasID: uuidv4(), myType: CTypes.InteractorHead,
      selectable: true, hasBorders: false, hasControls: false
    });

    let a = new fabric.Line([wid / 2 - actWid / 2, hei / 2, wid / 2 + actWid / 2, hei / 2], {
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth, myType: CTypes.InteractorArms
    });

    let b = new fabric.Line([wid / 2 - 1.5, hei / 2 - actHei / 3 + actHei / 5, wid / 2 - 1.5, hei / 2 + actHei / 3], {
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth, myType: CTypes.InteractorBody
    });

    let l1 = new fabric.Line([wid / 2 - 1, hei / 2 + actHei / 3 - 5, wid / 2 - actWid / 2, hei / 2 + 2/3*actHei], {
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth, myType: CTypes.InteractorLeg1
    });

    let l2 = new fabric.Line([wid / 2 - 2, hei / 2 + actHei / 3 - 5, wid / 2 + actWid / 2 - 3, hei / 2 + 2/3*actHei], {
      stroke: element instanceof ContextElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth, myType: CTypes.InteractorLeg2
    });

    let etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei, textAlign: 'center',
      myType: CTypes.ElementName
    });

    let parts = [h, a, b, l1, l2, ...this.createFlowAnchors(wid, hei, true, true), etxt];

    let g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      myType: CTypes.Interactor, subTargetCheck: true
    });

    g.on('scaling', (e) => this.onScaleInteractor(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleInteractor(event) {
    // g.on('scaling', () => {
    //   let wg = g.width * g.scaleX, hg = g.height * g.scaleY;

    //   g.set({
    //     'height': hg,
    //     'width': wg,
    //     'scaleX': 1,
    //     'scaleY': 1
    //   });
    //   h.set({
    //     'radius': hg/5,
    //     'scaleX': 1,
    //     'scaleY': 1,
    //     'left': 0,
    //     'top': -hg/2
    //   });
    //   // b.set({
    //   //   'height': hg,
    //   //   'width': wg,
    //   //   'scaleX': 1,
    //   //   'scaleY': 1,
    //   //   'left': -wg/2,
    //   //   'top': -hg/2
    //   // });

    //   etxt.set({
    //     'left': 0,
    //     'top': hg/2
    //   });
    // });
  }

  private createInterface(left: number, top: number, element: ContextElement, option: string): fabric.Object {
    const wid = 50;
    const hei = 50;
    const e = new fabric.Rect({
      stroke: this.StrokeColor, strokeWidth: this.StrokeWidth,
      left: 12.5, top: 12.5, width: 25, height: 25,
      fill: this.isDarkMode ? CanvasBase.BackgroundColorDark : CanvasBase.BackgroundColorLight, myType: CTypes.ElementBorder
    });

    let etxt = null;
    if (option == 'Interface1') {
      etxt = new fabric.Text(element.GetProperty('Name'), {
        fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
        originX: 'center', left: wid / 2, top: -5, textAlign: 'center',
        myType: CTypes.ElementName
      });
    }
    /*
    else if (option == 'Interface2') {
      etxt = new fabric.Text(element.GetProperty('Name'), {
        fontSize: 16, fill: this.StrokeColor,
        originX: 'left', left: 42, top: 17,
        myType: CTypes.ElementName
      });
    }
    else if (option == 'Interface3') {
      etxt = new fabric.Text(element.GetProperty('Name'), {
        fontSize: 16, fill: this.StrokeColor,
        originX: 'center', left: wid / 2, top: 40,
        myType: CTypes.ElementName
      });
    }
    else if (option == 'Interface4') {
      etxt = new fabric.Text(element.GetProperty('Name'), {
        fontSize: 16, fill: this.StrokeColor,
        originX: 'right', left: 8, top: 17,
        myType: CTypes.ElementName
      });
    }
    */

    const parts = [e, etxt, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      myType: CTypes.DeviceInterface, subTargetCheck: true
    });

    setTimeout(() => {
      // create text moving point
      let border = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
      let left = g.left + g.width/2;
      let top = g.top + g.height/2 + border.top - 25;
      let t0 = this.createTextPositionPoint('t0', left , top, g); // text point
      t0[CProps.opacity] = 0;
      g[CProps.t0ID] = t0[CProps.canvasID];
      this.Canvas.add(t0);
    }, 100);

    g.on('scaling', (e) => this.onScaleInterface(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private createTextPositionPoint(name, left, top, element) {
    var p = new fabric.Circle({
      left: left, top: top,
      radius: 5, stroke: this.theme.Primary, fill: this.theme.Primary,
      originX: 'center', originY: 'center',
      name: name, canvasID: uuidv4(), myType: CTypes.TextPosPoint,
      selectable: true, hasBorders: false, hasControls: false
    });

    p[CProps.textObjID] = element[CProps.canvasID];
    p.setControlsVisibility({ mtr: false, mts: false });

    return p;
  };

  private onScaleInterface(event) {
    // this.onScaleElement(event);
    // let g = event.transform.target;
    // let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    // let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    // e.set({
    //   'height': hg, 'width': wg,
    //   'scaleX': 1, 'scaleY': 1,
    //   'left': -wg / 2,
    //   'top': -hg / 2
    // });
    // this.onCanvasModified();
  }

  private createUseCase(left: number, top: number, element: ContextElement): fabric.Object {
    let wid = 140;
    let hei = 50;
    let e = new fabric.Ellipse({
      stroke: this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: wid, height: hei, rx: wid / 2, ry: hei / 2,
      fill: this.isDarkMode ? CanvasBase.BackgroundColorDark : CanvasBase.BackgroundColorLight, myType: CTypes.ElementBorder
    });

    let etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    let parts = [e];
    parts.push(...[etxt, ...this.createFlowAnchors(wid, hei, true, true)]);

    let g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true, lockRotation: true, lockScalingX: false, lockScalingY: false, hasBorders: false,
      ID: element.ID, canvasID: uuidv4(),
      myType: CTypes.SystemUseCase, subTargetCheck: true
    });

    g.on('scaling', (e) => this.onScaleUseCase(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleUseCase(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2,
      'rx': wg / 2,
      'ry': hg / 2
    });
    this.onCanvasModified();
  }

  private createExternalEntity(left: number, top: number, element: ContextElement): fabric.Object {
    const wid = 140;
    const hei = 75;
    const e = new fabric.Rect({
      stroke: element instanceof DFDElementRef ? this.theme.Primary : this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: wid, height: hei, fill: 'transparent', myType: CTypes.ElementBorder
    });
    const etype = new fabric.Text('«External Entity»', {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: 5,
      myType: CTypes.ElementType
    });
    const etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Name, fill: this.StrokeColor,
      originX: 'center', left: wid / 2, top: hei / 2 - 8, textAlign: 'center',
      myType: CTypes.ElementName
    });

    const parts = [e, etype, etxt, ...this.createFlowAnchors(wid, hei, true, true, false, true)];
    if (this.AnchorCount == 4) {
      [AnchorDirections.NorthWest, AnchorDirections.NorthEast, AnchorDirections.SouthEast, AnchorDirections.SouthWest].forEach(fa => parts.find(x => x[CProps.fa] == fa)?.set(CProps.visible, false));
    }

    const g = new fabric.Group(parts, {
      left: left, top: top,
      hasControls: true,
      lockRotation: true, lockScalingX: false, lockScalingY: false,
      hasBorders: false, subTargetCheck: true,
      ID: element.ID, canvasID: uuidv4(), myType: CTypes.SystemExternalEntity
    });

    g.on('scaling', (e) => this.onScaleExternalEntity(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleExternalEntity(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2,
      'top': -hg / 2
    });
    this.onCanvasModified();
  }

  private createTrustArea(left: number, top: number, element: ContextElement, width = 300, height = 300): fabric.Object {
    let e = new fabric.Rect({
      stroke: this.StrokeColor, strokeWidth: this.StrokeWidth,
      width: width, height: height,
      strokeDashArray: [10, 5], fill: 'transparent',
      myType: CTypes.ElementBorder
    });
    let etxt = new fabric.Text(element.GetProperty('Name'), {
      fontSize: this.currentFontSizeConfig.Type, fill: this.StrokeColor,
      originX: 'left', originY: 'top',
      left: 5, top: 5,
      myType: CTypes.ElementName
    });

    let g = new fabric.Group([e, etxt], {
      left: left, top: top,
      hasControls: true,
      hasBorders: false,
      lockRotation: true,
      ID: element.ID, canvasID: uuidv4(),
      elementTypeID: ElementTypeIDs.LogTrustArea, myType: CTypes.TrustArea
    });

    g.on('scaling', (e) => this.onScaleTrustArea(e));

    g.setControlsVisibility({ mtr: false }); // remove rotate button
    return g;
  }

  private onScaleTrustArea(event) {
    this.onScaleElement(event);
    let g = event.transform.target;
    let e = g._objects.find(x => x[CProps.myType] == CTypes.ElementBorder);
    let etxt = g._objects.find(x => x[CProps.myType] == CTypes.ElementName);

    let wg = g.width * g.scaleX, hg = g.height * g.scaleY;
    e.set({
      'height': hg, 'width': wg,
      'scaleX': 1, 'scaleY': 1,
      'left': -wg / 2, 'top': -hg / 2
    });

    etxt.set({
      'left': -wg / 2 + 5,
      'top': -hg / 2 + 5
    });
    this.onCanvasModified();
  }
}

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent implements OnInit {

  public faArrowsAltH = faArrowsAltH;
  public faLongArrowAltRight = faLongArrowAltRight;

  public menuTopLeftPosition = { x: '0', y: '0' };
  @ViewChild('ctxMenu') public matMenuTrigger: MatMenuTrigger;

  public Dia: CanvasBase;

  @ViewChild('zoomSelect')
  public zoomSelect;
  public get Zoom(): number {
    if (this.Dia.Canvas) {
      let zoom = this.Dia.Canvas.getZoom();
      if (![0.33, 0.5, 0.66, 0.75, 1, 1.5, 2, 2.5, 3].includes(zoom)) this.zoomSelect['nativeElement']['selectedIndex'] = 9;
      return zoom;
    }
    return null;
  }
  public set Zoom(zoom: number) {
    this.Dia.SetZoom(zoom);
    this.locStorage.Set(LocStorageKeys.PAGE_MODELING_DIAGRAM_ZOOM, zoom.toString());
  }

  @Input() public selectedNode: INavigationNode;

  @Input() public diagram: Diagram;

  public get IsContextDiagram(): boolean { return this.diagram instanceof CtxDiagram; }

  public get HasMnemonics(): boolean {
    return this.dataService.Config.GetStencilThreatMnemonics().length > 0;
  }

  public get HasThreatRuleGroups(): boolean {
    return this.GetThreatRuleGroups()?.length > 0;
  }

  public get selectedElement(): ViewElementBase { return this.Dia?.SelectedElement; }
  @Input() public set selectedElement(element: ViewElementBase) {
    if (this.Dia) this.Dia.SelectedElement = element;
  }

  @Output() public selectionChanged = new EventEmitter<ViewElementBase>();

  @Output() public navTreeChanged = new EventEmitter();

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService, private locStorage: LocalStorageService, private translate: TranslateService) { }

  ngOnInit(): void {
    if (!this.diagram || !(this.diagram instanceof Diagram)) {
      console.error('Undefined diagram');
    }
    else {
      if (this.diagram instanceof HWDFDiagram) this.Dia = new HWDFCanvas(this.diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate);
      else if (this.diagram instanceof CtxDiagram) this.Dia = new CtxCanvas(this.diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate, this.selectedNode?.dataType);
      this.Dia.SelectionChanged.subscribe((val) => {
        this.selectionChanged.emit(val);
      });
      this.Dia.NavTreeChanged.subscribe(() => this.navTreeChanged.emit());
    }
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey) {
      if (event.key == 'c' && this.selectedElement && document.activeElement.tagName == 'BODY') {
        event.preventDefault();
        this.Dia.CopyElement();
      }
      else if (event.key == 'v' && this.Dia.CanCopy && document.activeElement.tagName == 'BODY') {
        event.preventDefault();
        this.Dia.PasteElement();
      }
    }
    else if (event.key == 'Delete' && this.selectedElement && document.activeElement.tagName == 'BODY') {
      event.preventDefault();
      this.Dia.OnDeleteElement(this.selectedElement);
    }
  }

  ngOnDestroy() {
    this.Dia.Save();
  }

  public GetIconColor(isActive: boolean): string {
    return isActive ? (this.theme.IsDarkMode ? '#FFF' : '#000') : (this.theme.IsDarkMode ? '#676767' : '#B6B6B6')
  }

  public GetContextIconColor(isActive: boolean): string {
    return isActive ? (this.theme.IsDarkMode ? '#FFF' : '#707070') : (this.theme.IsDarkMode ? '#676767' : '#B6B6B6')
  }

  public ShowSuggestedThreats() {
    this.dialog.OpenSuggestThreatsDialog(this.selectedElement as DFDElement);
  }

  public ShowCVESearch() {
    this.dialog.OpenCveSearchDialog(this.selectedElement, this.diagram.ID);
  }

  public GetThreatRuleGroups(): ThreatRuleGroup[] {
    let rules = this.dataService.Config.GetThreatRuleGroups().filter(x => x.ThreatRules?.length > 0);
    if (this.diagram.Settings.GenerationThreatLibrary) {
      rules = rules.filter(x => x.ThreatRules.every(y => !y.IsActive));
    }
    return rules
  }

  public OnResized(event: ResizedEvent, container) {
    this.Dia.OnResized(event, container);
  }

  public SetZoom(event) {
    this.Zoom = Number(event['target']['value']);
  }

  public OpenContextMenu(event) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    this.matMenuTrigger.menuData = { item: this.selectedElement };
    this.matMenuTrigger.openMenu();
  }
}
