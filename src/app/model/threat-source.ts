import { LowMediumHighNumber } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";

export interface IThreatSource {
  Name: string;
  Motive: string[];
  Likelihood: LowMediumHighNumber;
}


export class ThreatSources extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Sources(): IThreatSource[] { return this.Data['Sources']; }
  public set Sources(val: IThreatSource[]) { this.Data['Sources'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Sources) this.Sources = [];
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