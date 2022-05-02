import { ConfigFile } from "./config-file";
import { DatabaseBase, IDataReferences } from "./database";
import { ProjectFile } from "./project-file";


export class CharScope extends DatabaseBase {
  private project: ProjectFile;
  private config: ConfigFile;

  public get Sector(): string[] { return this.Data['Sector']; }
  public set Sector(val: string[]) { this.Data['Sector'] = val; }
  public get Function(): string[] { return this.Data['Function']; }
  public set Function(val: string[]) { this.Data['Function'] = val; }
  public get Application(): string[] { return this.Data['Application']; }
  public set Application(val: string[]) { this.Data['Application'] = val; }
  public get Requirements(): string[] { return this.Data['Requirements']; }
  public set Requirements(val: string[]) { this.Data['Requirements'] = val; }
  public get Criticality(): string[] { return this.Data['Criticality']; }
  public set Criticality(val: string[]) { this.Data['Criticality'] = val; }
  public get LocEnv(): string[] { return this.Data['LocEnv']; }
  public set LocEnv(val: string[]) { this.Data['LocEnv'] = val; }
  public get Connectivity(): string[] { return this.Data['Connectivity']; }
  public set Connectivity(val: string[]) { this.Data['Connectivity'] = val; }
  public get TargetMarket(): string[] { return this.Data['TargetMarket']; }
  public set TargetMarket(val: string[]) { this.Data['TargetMarket'] = val; }
  public get Standards(): string[] { return this.Data['Standards']; }
  public set Standards(val: string[]) { this.Data['Standards'] = val; }
  public get InvolvedPeople(): string[] { return this.Data['InvolvedPeople']; }
  public set InvolvedPeople(val: string[]) { this.Data['InvolvedPeople'] = val; }
  public get Budget(): string[] { return this.Data['Budget']; }
  public set Budget(val: string[]) { this.Data['Budget'] = val; }
  public get Timeframe(): string[] { return this.Data['Timeframe']; }
  public set Timeframe(val: string[]) { this.Data['Timeframe'] = val; }
  public get ExpectedOutput(): string[] { return this.Data['ExpectedOutput']; }
  public set ExpectedOutput(val: string[]) { this.Data['ExpectedOutput'] = val; }
  public get Assumptions(): string[] { return this.Data['Assumptions']; }
  public set Assumptions(val: string[]) { this.Data['Assumptions'] = val; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Sector) this.Sector = [];
    if (!this.Function) this.Function = [];
    if (!this.Application) this.Application = [];
    if (!this.Requirements) this.Requirements = [];
    if (!this.Criticality) this.Criticality = [];
    if (!this.LocEnv) this.LocEnv = [];
    if (!this.Connectivity) this.Connectivity = [];
    if (!this.TargetMarket) this.TargetMarket = [];
    if (!this.Standards) this.Standards = [];
    if (!this.InvolvedPeople) this.InvolvedPeople = [];
    if (!this.Budget) this.Budget = [];
    if (!this.Timeframe) this.Timeframe = [];
    if (!this.ExpectedOutput) this.ExpectedOutput = [];
    if (!this.Assumptions) this.Assumptions = [];
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): CharScope {
    return new CharScope(data, pf, cf);
  }
}