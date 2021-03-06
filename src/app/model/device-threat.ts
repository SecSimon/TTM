import { LowMediumHighNumber } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";
import { ImpactCategories, ThreatCategory } from "./threat-model";

export class DeviceThreat extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get ThreatCategory(): ThreatCategory { return this.config.GetThreatCategory(this.Data['threatCategoryID']); }
  public set ThreatCategory(val: ThreatCategory) { 
    this.Data['threatCategoryID'] = val?.ID; 
    if (val) {
      this.Data['ImpactCats'] = JSON.parse(JSON.stringify(val.ImpactCats))
    }
  }

  public get ImpactCats(): ImpactCategories[] { return this.Data['ImpactCats']; }

  public get Impact(): LowMediumHighNumber { return this.Data['Impact']; }
  public set Impact(val: LowMediumHighNumber) { this.Data['Impact'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Impact) this.Impact = LowMediumHighNumber.Medium;

    if (!this.ImpactCats) this.Data['ImpactCats'] = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): DeviceThreat {
    return new DeviceThreat(data, pf, cf);
  }
}