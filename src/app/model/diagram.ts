import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IContainer, IDataReferences, IKeyValue } from "./database";
import { DFDContainer, DFDElement } from "./dfd-model";
import { ProjectFile } from "./project-file";
import { ContextElement, SystemContextContainer } from "./system-context";

export enum DiagramTypes {
  Hardware = 'HW',
  DataFlow = 'DF',
  Context = 'CTX',
  UseCase = 'UC'
}

export interface IDiagramSettings {
  GenerationThreatLibrary: boolean;
  GenerationAssetBased: boolean;
  GenerationMnemonics: {};
  GenerationRules: {};
}

export abstract class Diagram extends DatabaseBase {
  protected project: ProjectFile;
  protected get elementsID(): string { return this.Data['elementsID']; }
  protected set elementsID(val: string) { this.Data['elementsID'] = val; }

  public get Name(): string { return this.Data['Name']; }
  public set Name(val: string) {
    this.Data['Name'] = val;
    if (this.Elements) this.Elements['Name'] = val;
    this.NameChanged.emit(val);
  }

  public get Canvas(): string { return this.Data['Canvas']; }
  public set Canvas(val: string) { 
    if (val == this.Data['Canvas']) return;
    this.Data['Canvas'] = val; 
  }

  public get DiagramType(): DiagramTypes { return this.Data['DiagramType']; }
  public set DiagramType(val: DiagramTypes) { this.Data['DiagramType'] = val; }

  public get Settings(): IDiagramSettings { return this.Data['Settings']; }
  public set Settings(val: IDiagramSettings) { this.Data['Settings'] = val; }

  public abstract get Elements(): IContainer;

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (!this.Settings) {
      this.Settings = { GenerationThreatLibrary: true, GenerationAssetBased: false, GenerationMnemonics: {}, GenerationRules: {} };
    }
    if (!this.Settings.GenerationMnemonics) this.Settings.GenerationMnemonics = {};
    if (!this.Settings.GenerationRules) this.Settings.GenerationRules = {};
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): Diagram {
    if (data['DiagramType'] == DiagramTypes.Hardware || data['DiagramType'] == DiagramTypes.DataFlow) return new HWDFDiagram(data, pf, cf);
    if (data['DiagramType'] == DiagramTypes.Context || data['DiagramType'] == DiagramTypes.UseCase) return new CtxDiagram(data, pf, cf);
  }
}

export class HWDFDiagram extends Diagram {

  public get Elements(): DFDContainer {
    return this.project?.GetDFDElement(this.elementsID) as DFDContainer;
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, pf, cf);

    if (!this.Elements) {
      let element = new DFDContainer({}, DFDContainer.GetDefaultType(cf), pf, cf);
      pf.AddDFDElement(element);
      this.elementsID = element.ID;
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];
    
    this.Elements.GetChildrenFlat().forEach(x => {
      res.push({ Type: DataReferenceTypes.DeleteDFDElement, Param: x });
    })
    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteDFDElement) {
        pf.DeleteDDFElement(ref.Param as DFDElement);
      }
    });

    pf.DeleteDDFElement(this.Elements);
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): Diagram {
    return new HWDFDiagram(data, pf, cf);
  }
}

export class CtxDiagram extends Diagram {
  public get Elements(): SystemContextContainer {
    return this.project?.GetContextElement(this.elementsID) as SystemContextContainer;
  }

  public get IsUseCaseDiagram(): boolean { return this.Data['IsUseCaseDiagram']; }
  public set IsUseCaseDiagram(val: boolean) { this.Data['IsUseCaseDiagram'] = val; }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data, pf, cf);

    if (!this.elementsID) {
      let element = new SystemContextContainer({}, pf, cf);
      pf.AddContextElement(element);
      this.elementsID = element.ID;
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    const res: IDataReferences[] = [];

    this.Elements.GetChildrenFlat().forEach(x => {
      res.push({ Type: DataReferenceTypes.DeleteContextElement, Param: x });
    });

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    const refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteContextElement) {
        pf.DeleteContextElement(ref.Param as ContextElement);
      }
    });

    pf.DeleteContextElement(this.Elements);
  }
}