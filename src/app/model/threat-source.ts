import { LowMediumHighNumber } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";

export class ThreatActor extends DatabaseBase {

  public get Motive(): string[] { return this.Data['Motive']; }
  public set Motive(val: string[]) { this.Data['Motive'] = val; }
  public get Likelihood(): LowMediumHighNumber { return this.Data['Likelihood']; }
  public set Likelihood(val: LowMediumHighNumber) { this.Data['Likelihood'] = val; }

  constructor(data, cf: ConfigFile) {
    super(data);
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    pf.GetThreatSources().RemoveThreatActor(this);
  }

  public static FromJSON(data, cf: ConfigFile): ThreatActor {
    let res = new ThreatActor(data, cf);
    return res;
  }
}


export class ThreatSources extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Sources(): ThreatActor[] { 
    let res = [];
    this.Data['sourceIDs'].forEach(x => res.push(this.project.GetThreatActor(x))); 
    return res;
  }
  public set Sources(val: ThreatActor[]) { this.Data['sourceIDs'] = val?.map(x => x.ID); }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Data['sourceIDs']) this.Data['sourceIDs'] = [];
  }

  public AddThreatActor(ta: ThreatActor) {
    if (!this.Sources.includes(ta)) {
      this.Data['sourceIDs'].push(ta.ID);
    }
  }

  public RemoveThreatActor(ta: ThreatActor) {
    if (this.Sources.includes(ta)) {
      this.Data['sourceIDs'].splice(this.Data['sourceIDs'].indexOf(ta.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): ThreatSources {
    let res = new ThreatSources(data, pf, cf);
    return res;
  }
}