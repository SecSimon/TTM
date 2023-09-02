import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, ICustomNumber, IDataReferences, PropertyEditTypes } from "./database";
import { ProjectFile } from "./project-file";
import { ImpactCategories, ImpactCategoryUtil } from "./threat-model";

export enum LowMediumHighNumber {
  Low = 1,
  Medium = 2,
  High = 3
}

export class LowMediumHighNumberUtil {
  public static GetKeys() {
    return [LowMediumHighNumber.Low, LowMediumHighNumber.Medium, LowMediumHighNumber.High];
  }

  public static ToString(val: LowMediumHighNumber): string {
    switch (val) {
      case LowMediumHighNumber.Low: return 'general.Low';
      case LowMediumHighNumber.Medium: return 'general.Medium';
      case LowMediumHighNumber.High: return 'general.High';
    }
  }
}

export class MyData extends DatabaseBase implements ICustomNumber {
  private config: ConfigFile;
  private project: ProjectFile;

  public get IsProjectData(): boolean { return this.project != null; }

  public get Number(): string { return this.Data['Number']; }
  public set Number(val: string) { this.Data['Number'] = val ? String(val) : val; }
  public get IsNewAsset(): boolean { return this.Data['IsNewAsset']; }
  public set IsNewAsset(val: boolean) { 
    this.Data['IsNewAsset'] = val; 
    if (val) {
      this.AddProperty('general.Number', 'Number', '', true, PropertyEditTypes.TextBoxValidator, true, null, 'CheckUniqueNumber');
      this['properties'].splice(2,0, this['properties'].splice(this.GetProperties().length-1,1)[0]);
      this['properties'].splice(this.GetProperties().findIndex(x => x.Type == PropertyEditTypes.AssignNumberToAsset), 1);
    }
  }

  public get Sensitivity(): LowMediumHighNumber { return this.Data['Sensitivity']; }
  public set Sensitivity(val: LowMediumHighNumber) { this.Data['Sensitivity'] = val ? Number(val) : val; }

  public get ImpactCats(): ImpactCategories[] { return this.Data['ImpactCats']; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Sensitivity) this.Sensitivity = LowMediumHighNumber.Medium;
    if (!this.ImpactCats) this.Data['ImpactCats'] = [];
  }

  public FindAssetGroup(): AssetGroup {
    if (this.project) return this.project.GetAssetGroups().find(x => x.AssociatedData.includes(this));
    else return this.config.GetAssetGroups().find(x => x.AssociatedData.includes(this));
  }

  public CheckUniqueNumber(): boolean {
    return this.project.GetMyDatas().some(x => x.Number == this.Number && x.ID != this.ID);
  }

  public GetLongName(): string {
    return 'A' + this.Number + ') ' + this.Name;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let file = this.IsProjectData ? pf : cf;
    let asset = file.GetAssetGroups().find(x => x.AssociatedData.includes(this));
    if (asset) asset.RemoveMyData(this);
  }

  protected initProperties() {
    super.initProperties();

    if (this.IsNewAsset) this.AddProperty('general.Number', 'Number', '', true, PropertyEditTypes.TextBoxValidator, true, null, 'CheckUniqueNumber');
    else this.AddProperty('general.Number', '', '', false, PropertyEditTypes.AssignNumberToAsset, true);

    this.AddProperty('properties.Sensitivity', 'Sensitivity', '', true, PropertyEditTypes.LowMediumHighSelect, true);
    ImpactCategoryUtil.GetKeys().forEach(x => this.AddProperty(ImpactCategoryUtil.ToString(x), 'ImpactCats-'+x.toString(), '', false, PropertyEditTypes.ImpactCategory, true, false));
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): MyData {
    return new MyData(data, pf, cf);
  }
}

export class AssetGroup extends DatabaseBase implements ICustomNumber {
  
  public static Icon: string = 'account_balance';

  private config: ConfigFile;
  private project: ProjectFile;

  private get file() { return this.IsProjectAsset ? this.project : this.config; };


  public get IsProjectAsset(): boolean { return this.project != null; }
  public get IsActive(): boolean { return this.Data['IsActive']; }
  public set IsActive(val: boolean) { 
    this.Data['IsActive'] = val; 
    if (val && this.Parent) this.Parent.IsActive = val;
    else if (!val) this.SubGroups.forEach(x => x.IsActive = val);
  }

  public get Number(): string { return this.Data['Number']; }
  public set Number(val: string) { this.Data['Number'] = val ? String(val) : val; }
  public get IsNewAsset(): boolean { return this.Data['IsNewAsset']; }
  public set IsNewAsset(val: boolean) { 
    this.Data['IsNewAsset'] = val; 
    if (val) {
      this.AddProperty('general.Number', 'Number', '', true, PropertyEditTypes.TextBoxValidator, true, null, 'CheckUniqueNumber');
      this['properties'].splice(2,0, this['properties'].splice(this.GetProperties().length-1,1)[0]);
      this['properties'].splice(this.GetProperties().findIndex(x => x.Type == PropertyEditTypes.AssignNumberToAsset), 1);
    }
  }

  public get SubGroups(): AssetGroup[] { 
    let res = [];
    this.Data['assetGroupIDs'].forEach(id => res.push(this.file.GetAssetGroup(id)));
    return res;
  }

  public get AssociatedData(): MyData[] { 
    let res = [];
    this.Data['associatedDataIDs'].forEach(id => res.push(this.file.GetMyData(id)));
    return res;
  }
  public set AssociatedData(val: MyData[]) {
    this.Data['associatedDataIDs'] = val?.map(x => x.ID);
  }

  public get Parent(): AssetGroup {
    return this.file.GetAssetGroups().find(x => x.SubGroups.includes(this));
  }

  public get ImpactCats(): ImpactCategories[] { return this.Data['ImpactCats']; }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;
    this.config = cf;

    if (!this.Data['assetGroupIDs']) { this.Data['assetGroupIDs'] = []; }
    if (!this.Data['associatedDataIDs']) { this.Data['associatedDataIDs'] = []; }
    if (!this.ImpactCats) this.Data['ImpactCats'] = [];

    if (this.IsActive == null) this.IsActive = true;
  }

  public AddAssetGroup(group: AssetGroup) {
    if (!this.SubGroups.includes(group)) this.Data['assetGroupIDs'].push(group.ID);
  }

  public RemoveAssetGroup(group: AssetGroup) {
    if (this.SubGroups.includes(group)) this.Data['assetGroupIDs'].splice(this.Data['assetGroupIDs'].indexOf(group.ID), 1);
  }

  public AddMyData(data: MyData) {
    if (!this.AssociatedData.includes(data)) this.Data['associatedDataIDs'].push(data.ID);
  }

  public RemoveMyData(data: MyData) {
    if (this.AssociatedData.includes(data)) {
      this.Data['associatedDataIDs'].splice(this.Data['associatedDataIDs'].indexOf(data.ID), 1);
    }
  }

  public GetMyDataFlat(): MyData[] {
    let res: MyData[] = [];

    res.push(...this.AssociatedData);
    this.SubGroups.forEach(x => res.push(...x.GetMyDataFlat()));

    return res;
  }

  public GetGroupsFlat(): AssetGroup[] {
    let res: AssetGroup[] = [];

    this.SubGroups.forEach(x => {
      res.push(x);
      res.push(...x.GetGroupsFlat());
    });

    return res;
  }

  public CheckUniqueNumber(): boolean {
    return this.project.GetAssetGroups().some(x => x.Number == this.Number && x.ID != this.ID);
  }

  public GetLongName(): string {
    return 'A' + this.Number + ') ' + this.Name;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    let res: IDataReferences[] = [];

    this.AssociatedData.forEach(x => res.push({ Type: DataReferenceTypes.DeleteMyData, Param: x }));
    this.SubGroups.forEach(x => res.push({ Type: DataReferenceTypes.DeleteAssetGroup, Param: x }));

    return res;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    let parentGroup = this.file.GetAssetGroups().find(x => x.SubGroups.includes(this));
    if (parentGroup) parentGroup.RemoveAssetGroup(this);

    let refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteMyData) {
        this.file.DeleteMyData(ref.Param as MyData);
      }
      else if (ref.Type == DataReferenceTypes.DeleteAssetGroup) {
        this.file.DeleteAssetGroup(ref.Param as AssetGroup);
      }
    });
  }

  protected initProperties() {
    super.initProperties();

    if (this.IsNewAsset) this.AddProperty('general.Number', 'Number', '', true, PropertyEditTypes.TextBoxValidator, true, null, 'CheckUniqueNumber');
    else this.AddProperty('general.Number', '', '', false, PropertyEditTypes.AssignNumberToAsset, true);

    this.AddProperty('properties.IsActive', 'IsActive', '', true, PropertyEditTypes.CheckBox, true);

    ImpactCategoryUtil.GetKeys().forEach(x => this.AddProperty(ImpactCategoryUtil.ToString(x), 'ImpactCats-'+x.toString(), '', false, PropertyEditTypes.ImpactCategory, true, false));
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): AssetGroup {
    return new AssetGroup(data, pf, cf);
  }
}