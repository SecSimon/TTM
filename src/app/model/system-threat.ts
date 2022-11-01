import { AssetGroup, LowMediumHighNumber, MyData } from "./assets";
import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";
import { ImpactCategories, ThreatCategory } from "./threat-model";

export class SystemThreat extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get AffectedAssetObjects(): (AssetGroup|MyData)[] {
    let res = [];
    if (this.Data['affectedAssetObjectIDs']) {
      this.project.GetAssetGroups().filter(x => this.Data['affectedAssetObjectIDs'].includes(x.ID)).forEach(x => res.push(x));
      this.project.GetMyDatas().filter(x => this.Data['affectedAssetObjectIDs'].includes(x.ID)).forEach(x => res.push(x));
    }
    
    return res;
  }
  public set AffectedAssetObjects(val: (AssetGroup|MyData)[]) {
    this.Data['affectedAssetObjectIDs'] = val?.map(x => x.ID);
  }

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

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): SystemThreat {
    return new SystemThreat(data, pf, cf);
  }
}