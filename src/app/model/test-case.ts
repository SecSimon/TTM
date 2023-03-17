import { MyComponentStack } from "./component";
import { ConfigFile } from "./config-file";
import { DatabaseBase, DataReferenceTypes, IDataReferences, INote, ViewElementBase } from "./database";
import { Diagram } from "./diagram";
import { Countermeasure } from "./mitigations";
import { ProjectFile } from "./project-file";
import { AttackScenario } from "./threat-model";

export enum TestCaseStates {
  NotSet = 1,
  Pass = 2,
  Fail = 3
}

export class TestCaseStateUtil {
  public static GetKeys(): TestCaseStates[] {
    return [TestCaseStates.NotSet, TestCaseStates.Pass, TestCaseStates.Fail];
  }

  public static ToString(state: TestCaseStates): string {
    switch (state) {
      case TestCaseStates.NotSet: return 'properties.testcasestate.NotSet';
      case TestCaseStates.Pass: return 'properties.testcasestate.Pass';
      case TestCaseStates.Fail: return 'properties.testcasestate.Fail';
      default:
        console.error('Missing State in TestCaseStateUtil.ToString()', state)
        return 'Undefined';
    }
  }
}

export class TestCase extends DatabaseBase {
  private project: ProjectFile;

  public get Number(): string { return this.Data['Number']; }
  public set Number(val: string) { this.Data['Number'] = val ? String(val) : val; }
  public get PreConditions(): string[] { return this.Data['PreConditions']; }
  public set PreConditions(val: string[]) { this.Data['PreConditions'] = val; }
  public get Version(): string { return this.Data['Version']; }
  public set Version(val: string) { this.Data['Version'] = val; }
  public get Steps(): string[] { return this.Data['Steps']; }
  public set Steps(val: string[]) { this.Data['Steps'] = val; }
  public get TestData(): string[] { return this.Data['TestData']; }
  public set TestData(val: string[]) { this.Data['TestData'] = val; }
  public get Summary(): INote[] { return this.Data['Summary']; }
  public set Summary(val: INote[]) { this.Data['Summary'] = val; }
  public get Status(): TestCaseStates { return this.Data['Status']; }
  public set Status(val: TestCaseStates) { this.Data['Status'] = val; }
  public get Images(): string[] { return this.Data['Images']; }
  public set Images(val: string[]) { this.Data['Images'] = val; }

  public get LinkedElements(): ViewElementBase[] {
    let res = [];
    this.Data['linkedElementIDs'].forEach(id => {
      let obj: ViewElementBase = this.project.GetDFDElement(id);
      if (!obj) obj = this.project.GetComponent(id);
      if (obj) res.push(obj);
    });
    return res;
  }
  public set LinkedElements(val: ViewElementBase[]) { this.Data['linkedElementIDs'] = val?.map(x => x.ID); }
  public get LinkedScenarios(): AttackScenario[] {
    let res = [];
    this.Data['linkedScenarioIDs'].forEach(id => res.push(this.project.GetAttackScenario(id)));
    return res;
  }
  public set LinkedScenarios(val: AttackScenario[]) { this.Data['linkedScenarioIDs'] = val?.map(x => x.ID); }
  public get LinkedMeasures(): Countermeasure[] {
    let res = [];
    this.Data['linkedMeasureIDs'].forEach(id => res.push(this.project.GetCountermeasure(id)));
    return res;
  }
  public set LinkedMeasures(val: Countermeasure[]) { this.Data['linkedMeasureIDs'] = val?.map(x => x.ID); }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (this.Status == null) this.Status = TestCaseStates.NotSet;
    if (!this.PreConditions) this.PreConditions = [];
    if (!this.Steps) this.Steps = [];
    if (!this.TestData) this.TestData = [];
    if (!this.Summary) this.Summary = [];
    if (!this.Images) this.Images = [];
    if (!this.Data['linkedElementIDs']) this.Data['linkedElementIDs'] = [];
    if (!this.Data['linkedScenarioIDs']) this.Data['linkedScenarioIDs'] = [];
    if (!this.Data['linkedMeasureIDs']) this.Data['linkedMeasureIDs'] = [];
  }

  public AddLinkedElement(element: ViewElementBase) {
    if (!this.LinkedElements.includes(element)) {
      this.Data['linkedElementIDs'].push(element.ID);
    }
  }

  public RemoveLinkedElement(id: string) {
    const index = this.Data['linkedElementIDs'].indexOf(id); 
    if (index >= 0) {
      this.Data['linkedElementIDs'].splice(index, 1);
    }
  }

  public AddLinkedAttackScenario(map: AttackScenario) {
    if (!this.LinkedScenarios.includes(map)) {
      this.Data['linkedScenarioIDs'].push(map.ID);
    }
  }

  public RemoveLinkedAttackScenario(id: string) {
    const index = this.Data['linkedScenarioIDs'].indexOf(id); 
    if (index >= 0) {
      this.Data['linkedScenarioIDs'].splice(index, 1);
    }
  }

  public AddLinkedCountermeasure(cm: Countermeasure) {
    if (!this.LinkedMeasures.includes(cm)) {
      this.Data['linkedMeasureIDs'].push(cm.ID);
    }
  }

  public RemoveLinkedCountermeasure(id: string) {
    const index = this.Data['linkedMeasureIDs'].indexOf(id); 
    if (index >= 0) {
      this.Data['linkedMeasureIDs'].splice(index, 1);
    }
  }

  public GetViewOfLinkedElement(element: ViewElementBase): Diagram|MyComponentStack {
    let res: any = this.project.FindDiagramOfElement(element.ID); 
    if (!res) res = this.project.GetStacks().find(x => x.GetChildrenFlat().some(y => y.ID == element.ID));
    return res;
  }

  public GetLongName(): string {
    return 'TC' + this.Number + ') ' + this.Name;
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    return [];
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    pf.GetTesting().RemoveTestCase(this);
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): TestCase {
    let res = new TestCase(data, pf, cf);
    return res;
  }
}

export class Testing extends DatabaseBase {
  private project: ProjectFile;

  public get TestCases(): TestCase[] { 
    let res = [];
    this.Data['testCaseIDs'].forEach(x => res.push(this.project.GetTestCase(x))); 
    return res;
  }
  public set TestCases(val: TestCase[]) { this.Data['testCaseIDs'] = val?.map(x => x.ID); }

  constructor(data, pf: ProjectFile, cf: ConfigFile) {
    super(data);
    this.project = pf;

    if (!this.Data['testCaseIDs']) this.Data['testCaseIDs'] = [];
  }

  public AddTestCase(tc: TestCase) {
    if (!this.TestCases.includes(tc)) {
      this.Data['testCaseIDs'].push(tc.ID);
    }
  }

  public RemoveTestCase(tc: TestCase) {
    if (this.TestCases.includes(tc)) {
      this.Data['testCaseIDs'].splice(this.Data['testCaseIDs'].indexOf(tc.ID), 1);
    }
  }

  public FindReferences(pf: ProjectFile, cf: ConfigFile): IDataReferences[] {
    const refs = [];

    pf?.GetTestCases().forEach(x => refs.push({ Type: DataReferenceTypes.DeleteTestCase, Param: x }));
    return refs;
  }

  public OnDelete(pf: ProjectFile, cf: ConfigFile) {
    const refs = this.FindReferences(pf, cf);

    refs.forEach(ref => {
      if (ref.Type == DataReferenceTypes.DeleteTestCase) { pf.DeleteTestCase(ref.Param as TestCase); }
    });
  }

  public static FromJSON(data, pf: ProjectFile, cf: ConfigFile): Testing {
    let res = new Testing(data, pf, cf);
    return res;
  }
}