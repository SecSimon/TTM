import { Color } from '@angular-material-components/color-picker';
import { ConfigFile } from './config-file';
import { DatabaseBase, IDataReferences, DataReferenceTypes } from './database';
import { ProjectFile } from './project-file';
import { AttackScenario } from './threat-model';
import { Countermeasure } from './mitigations';

export interface ITagable {
  MyTags: MyTag[];
  AddMyTag(tag: MyTag);
  RemoveMyTag(id: string);
}

export enum TagChartTypes {
  Severity = 1,
  Risk = 2,
  Countermeasure = 3,
}

export class TagChartTypeUtil {
  public static GetKeys(): TagChartTypes[] {
    return [TagChartTypes.Severity, TagChartTypes.Risk, TagChartTypes.Countermeasure];
  }

  public static ToString(type: TagChartTypes): string {
    switch (type) {
      case TagChartTypes.Severity: return 'properties.tagcharttype.Severity';
      case TagChartTypes.Risk: return 'properties.tagcharttype.Risk';
      case TagChartTypes.Countermeasure: return 'properties.tagcharttype.Countermeasure';
      default:
        console.error('Missing State in TagChartTypeUtil.ToString()', type);
        return 'Undefined';
    }
  }
}

export class MyTag extends DatabaseBase {
  private project: ProjectFile;

  public get Color(): string { return this.Data['Color']; }
  public set Color(val: string) { this.Data['Color'] = val; }

  private colorPicker: Color;
  public get ColorPicker(): Color {
    if (this.colorPicker?.toHexString() != this.Color) {
      let aRgbHex = this.Color.replace('#', '').match(/.{1,2}/g);
      let aRgb = [
          parseInt(aRgbHex[0], 16),
          parseInt(aRgbHex[1], 16),
          parseInt(aRgbHex[2], 16)
      ];
      this.colorPicker = new Color(aRgb[0], aRgb[1], aRgb[2]);
    }
    
    return this.colorPicker;
  }
  public set ColorPicker(val: Color) {
    this.Color = val.toHexString();
  }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (!this.Color) this.Color = '#2196f3';
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = [];

    pf?.GetAttackScenarios().filter(x => x.MyTags.includes(this)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveMyTagFromAttackScenario, Param: x }));
    pf?.GetCountermeasures().filter(x => x.MyTags.includes(this)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveMyTagFromCountermeasure, Param: x }));
    pf?.GetMyTagCharts().filter(x => x.MyTags.includes(this)).forEach(x => refs.push({ Type: DataReferenceTypes.RemoveMyTagFromMyTagChart, Param: x }));

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
      if (x.Type == DataReferenceTypes.RemoveMyTagFromAttackScenario) (x.Param as AttackScenario).RemoveMyTag(this.ID);
      else if (x.Type == DataReferenceTypes.RemoveMyTagFromCountermeasure) (x.Param as Countermeasure).RemoveMyTag(this.ID);
      else if (x.Type == DataReferenceTypes.RemoveMyTagFromMyTagChart) (x.Param as MyTagChart).RemoveMyTag(this.ID);
    });
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MyTag {
    return new MyTag(data, pf, cf);
  }
}

export class MyTagChart extends DatabaseBase {
  private project: ProjectFile;

  public get MyTags(): MyTag[] {
    let res = []
    this.Data['myTagIDs'].forEach(x => res.push(this.project.GetMyTag(x)));
    return res;
  }
  public set MyTags(val: MyTag[]) { this.Data['myTagIDs'] = val?.map(x => x.ID); }

  public get Type(): TagChartTypes { return this.Data['Type']; }
  public set Type(val: TagChartTypes) { this.Data['Type'] = val; }

  constructor(data: {}, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (!this.Data['myTagIDs']) this.Data['myTagIDs'] = [];
    if (!this.Type) this.Type = TagChartTypes.Severity;
  }

  public AddMyTag(tag: MyTag) {
    if (!this.MyTags.includes(tag)) {
      this.Data['myTagIDs'].push(tag.ID);
    }
  }

  public RemoveMyTag(id: string) {
    const index = this.Data['myTagIDs'].indexOf(id); 
    if (index >= 0) {
      this.Data['myTagIDs'].splice(index, 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let refs: IDataReferences[] = [];

    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let refs = this.FindReferences(pf, cf);
    refs.forEach(x => {
    });
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MyTagChart {
    return new MyTagChart(data, pf, cf);
  }
}