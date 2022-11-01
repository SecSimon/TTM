import { EventEmitter } from "@angular/core";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IContainer, IDataReferences, IProperty, PropertyEditTypes, ViewElementBase } from "./database";
import { ProjectFile } from "./project-file";
import { ThreatQuestion } from "./threat-model";

export enum MyComponentTypeIDs {
  None = 0,
  Software = 1,
  Process = 2
}

export class MyComponentType extends DatabaseBase {
  private config: ConfigFile;

  public get ComponentTypeID(): MyComponentTypeIDs { return this.Data['ComponentTypeID']; }
  public set ComponentTypeID(val: MyComponentTypeIDs) { this.Data['ComponentTypeID'] = val; }
  public get IsActive(): boolean { return this.Data['IsActive']; }
  public set IsActive(val: boolean) { this.Data['IsActive'] = val; }
  public get IsThirdParty(): boolean { return this.Data['IsThirdParty']; }
  public set IsThirdParty(val: boolean) { this.Data['IsThirdParty'] = val; }

  public get Properties(): IProperty[] { return this.Data['Properties']; }
  public set Properties(val: IProperty[]) { this.Data['Properties'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Properties) this.Properties = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    // questions, components
    cf.GetThreatQuestions().filter(x => x.ComponentType.ID == this.ID).forEach(x => res.push({ Type: DataReferenceTypes.DeleteThreatQuestion, Param: x }));
    pf?.GetComponents().filter(x => x.Type.ID == this.ID).forEach(x => res.push({ Type: DataReferenceTypes.DeleteComponent, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    let group = cf.FindGroupOfMyComponent(this);
    if (group) group.RemoveMyComponentType(this);
    
    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteThreatQuestion) {
        cf.DeleteThreatQuestion(ref.Param as ThreatQuestion);
      }
      else if (ref.Type == DataReferenceTypes.DeleteComponent) {
        pf.DeleteComponent(ref.Param as MyComponent);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): MyComponentType {
    return new MyComponentType(data, cf);
  }
}

export class MyComponentTypeGroup extends DatabaseBase {
  private config: ConfigFile;

  public get Types(): MyComponentType[] { 
    let res = [];
    this.Data['myComponentTypeIDs'].forEach(id => res.push(this.config.GetMyComponentType(id)));
    return res;
  }
  public get ComponentTypeID(): MyComponentTypeIDs { return this.Data['ComponentTypeID']; }
  public set ComponentTypeID(val: MyComponentTypeIDs) { this.Data['ComponentTypeID'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
    this.config = cf;

    if (!this.Data['myComponentTypeIDs']) { this.Data['myComponentTypeIDs'] = []; }
  }

  public AddMyComponentType(type: MyComponentType) {
    if (!this.Types.includes(type)) this.Data['myComponentTypeIDs'].push(type.ID);
  }

  public RemoveMyComponentType(t: MyComponentType) {
    if (this.Types.includes(t)) {
      this.Data['myComponentTypeIDs'].splice(this.Data['myComponentTypeIDs'].indexOf(t.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.Types.forEach(x => res.push({ Type: DataReferenceTypes.DeleteMyComponentType, Param: x}));
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteMyComponentType) {
        cf.DeleteMyComponentType(ref.Param as MyComponentType);
      }
    });
  }

  public static FromJSON(data, cf: ConfigFile): MyComponentTypeGroup {
    return new MyComponentTypeGroup(data, cf);
  }
}

export class MyComponent extends ViewElementBase {
  private config: ConfigFile;
  private project: ProjectFile;

  public get IsActive(): boolean { return this.Data['IsActive']; }
  public set IsActive(val: boolean) { this.Data['IsActive'] = val; }
  public get IsThirdParty(): boolean { return this.Data['IsThirdParty']; }
  public set IsThirdParty(val: boolean) { this.Data['IsThirdParty'] = val; }
  public get Type(): MyComponentType { return this.config.GetMyComponentType(this.Data['typeID']); }
  public set Type(type: MyComponentType) { 
    this.Data['typeID'] = type.ID; 
    this.setTypeProperties(type);
    this.TypeID = type.ComponentTypeID;
  }
  public get TypeID(): MyComponentTypeIDs { return this.Data['TypeID']; }
  public set TypeID(val: MyComponentTypeIDs) { this.Data['TypeID'] = val; }

  public get ThreatQuestions() { return this.Data['threatQuestions']; } // key: questionID, value: optionVal

  public get NotesPerQuestion(): {} { return this.Data['notesPerQuestion']; }
  public set NotesPerQuestion(val: {}) { this.Data['notesPerQuestion'] = val; }

  constructor(data: {}, type: MyComponentType, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;
    if (!this.Type) {
      this.Name = type.Name;
      this.IsActive = type.IsActive;
      this.IsThirdParty = type.IsThirdParty;
      this.Description = type.Description;
    }
    this.Type = type;

    if (!this.Data['threatQuestions']) this.Data['threatQuestions'] = {};
    if (!this.Data['notesPerQuestion']) this.Data['notesPerQuestion'] = {};

    cf.GetThreatQuestions().filter(x => x.ComponentType.ID == type.ID).forEach(x => this.AddThreatQuestion(x));
  }

  public AddThreatQuestion(question: ThreatQuestion) {
    if (!(question.ID in this.Data['threatQuestions'])) this.Data['threatQuestions'][question.ID] = null;
  }

  public RemoveThreatQuestion(question: ThreatQuestion) {
    if (this.Data['threatQuestions'][question.ID]) {
      delete this.Data['threatQuestions'][question.ID];
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = super.FindReferences(pf, cf);

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    super.OnDelete(pf, cf);

    let stack = pf.GetStacks().find(x => x.GetChildren().includes(this));
    if (stack) stack.RemoveChild(this);
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MyComponent {
    let type = cf.GetMyComponentType(data['typeID']);
    if (type == null) {
      type = cf.CreateMyComponentType(cf.GetMyComponentTypeGroups(data['TypeID'])[0]);
      type.Name = data['Name'] = data['Name'] +  ' - ERROR - Missing type';
    }
    return new MyComponent(data, type, pf, cf);
  }

  protected initProperties() {
    super.initProperties();

    this.AddProperty('properties.IsActive', 'IsActive', '', true, PropertyEditTypes.CheckBox, true);
    this.AddProperty('properties.IsThirdParty', 'IsThirdParty', '', true, PropertyEditTypes.CheckBox, true);
  }

  private setTypeProperties(type: MyComponentType) {
    if (type) {
      // add properties of specific component type (e.g. cryptography)
      if (type.Properties) {
        type.Properties.forEach(x => {
          this.AddProperty((x.DisplayName == null ? x.ID : x.DisplayName), x.ID, x.Tooltip, x.HasGetter, x.Type, x.Editable);
          if (this.Data[x.ID] == null) {
            this.Data[x.ID] = x.DefaultValue;
          }
        });
      }
    }
  }
}

export class MyComponentStack extends DatabaseBase implements IContainer {
  private project: ProjectFile;

  private get children(): MyComponent[] { 
    let res = [];
    this.Data['childrenIDs'].forEach(x => res.push(this.project.GetComponent(x)));
    return res; 
  }

  public get ComponentTypeID(): MyComponentTypeIDs { return this.Data['ComponentTypeID']; }
  public set ComponentTypeID(val: MyComponentTypeIDs) { this.Data['ComponentTypeID'] = val; }

  public ChildrenChanged = new EventEmitter<boolean>();
  public get Root(): IContainer {
    return this.project.GetStack(this.Data['rootID']) as MyComponentStack;
  }
  public set Root(val: IContainer) {
    this.Data['rootID'] = (val as MyComponentStack)?.ID;
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (!this.Data['childrenIDs']) this.Data['childrenIDs'] = [];

    if (this.ComponentTypeID == null && this.children.length > 0) {
      this.ComponentTypeID = this.children[0].Type.ComponentTypeID; // update for older projects necesssary
    }
  }

  public AddChild(child: MyComponent) {
    if (child == null) {
      console.error('child undefined');
      return;
    }
    if (!this.Data['childrenIDs'].includes(child.ID)) {
      this.Data['childrenIDs'].push(child.ID);
      //child.Parent = this;
      if (this.Root) this.Root.ChildrenChanged.emit(true);
      else this.ChildrenChanged.emit(true);
    }
  }

  public RemoveChild(child: MyComponent): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);
      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public DeleteChild(child: MyComponent): boolean {
    const index = this.Data['childrenIDs'].indexOf(child.ID);
    if (index >= 0) {
      this.Data['childrenIDs'].splice(index, 1);
      this.project.DeleteComponent(child);
      if (this.Root) this.Root.ChildrenChanged.emit(false);
      else this.ChildrenChanged.emit(false);
    } 
    return index >= 0;
  }

  public GetChildren(): MyComponent[] {
    return this.children;
  }

  public GetChildrenFlat(): MyComponent[] {
    return this.GetChildren();
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.GetChildren().forEach(x => res.push({ Type: DataReferenceTypes.DeleteComponent, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteComponent) {
        pf.DeleteComponent(ref.Param as MyComponent);
      }
    });
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MyComponentStack {
    return new MyComponentStack(data, pf, cf);
  }
}