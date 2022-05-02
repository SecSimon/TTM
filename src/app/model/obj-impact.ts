import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";


export class ObjImpact extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get DeviceGoals(): string[] { return this.Data['DeviceGoals']; }
  public set DeviceGoals(val: string[]) { this.Data['DeviceGoals'] = val; }
  public get BusinessGoals(): string[] { return this.Data['BusinessGoals']; }
  public set BusinessGoals(val: string[]) { this.Data['BusinessGoals'] = val; }
  public get BusinessImpact(): string[] { return this.Data['BusinessImpact']; }
  public set BusinessImpact(val: string[]) { this.Data['BusinessImpact'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.DeviceGoals) this.DeviceGoals = [];
    if (!this.BusinessGoals) this.BusinessGoals = [];
    if (!this.BusinessImpact) this.BusinessImpact = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): ObjImpact {
    return new ObjImpact(data, pf, cf);
  }
}