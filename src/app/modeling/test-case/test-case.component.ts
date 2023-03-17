import { Component, Input, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { MyComponentStack } from '../../model/component';
import { IKeyValue, ViewElementBase } from '../../model/database';
import { Diagram } from '../../model/diagram';
import { Countermeasure } from '../../model/mitigations';
import { TestCase, TestCaseStates, TestCaseStateUtil } from '../../model/test-case';
import { AttackScenario } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-test-case',
  templateUrl: './test-case.component.html',
  styleUrls: ['./test-case.component.scss']
})
export class TestCaseComponent implements OnInit {
  private _testCase : TestCase;

  public get testCase(): TestCase { return this._testCase; }
  @Input() public set testCase(val: TestCase) {
    this._testCase = val;
    this.selectedLinks = null;
    this.RefreshLinks();
  }

  public linkLists: IKeyValue[] = [];
  public selectedLinks: IKeyValue = null;

  public get canAddAttackScenario(): boolean { return this.testCase.LinkedElements.length > 0; }

  constructor(@Optional() tc: TestCase, public dataService: DataService, public theme: ThemeService, private dialog: DialogService, private router: Router, private activatedRoute: ActivatedRoute) {
    if (tc) this.testCase = tc;
  }

  ngOnInit(): void {
    this.RefreshLinks();
  }

  public RefreshLinks(current: string = null) {
    this.linkLists = [];
    this.linkLists.push({ Key: 'properties.LinkedElements', Value: this.testCase.LinkedElements });
    this.linkLists.push({ Key: 'properties.LinkedScenarios', Value: this.testCase.LinkedScenarios });
    this.linkLists.push({ Key: 'properties.LinkedMeasures', Value: this.testCase.LinkedMeasures });
    if (current) this.selectedLinks = this.linkLists.find(x => x.Key === current);
    this.groups = {};
  }

  public AddAttackScenario() {
    const element = this.testCase.LinkedElements[0];
    const view = this.GetItemView(element);
    const as = this.dataService.Project.CreateAttackScenario(view.ID, false);
    as.SetMapping('', [], element, [element], null, null, null, null);
    as.IsGenerated = false;
    as.Name = this.testCase.Name;
    as.Description = this.testCase.Description;
    this.dialog.OpenAttackScenarioDialog(as, true).subscribe(result => {
      if (!result) {
        this.dataService.Project.DeleteAttackScenario(as);
      }
      else {
        this.testCase.AddLinkedAttackScenario(as);
        this.RefreshLinks();
      }
    });
  }

  public AddLink(item) {
    if (this.selectedLinks.Key === 'properties.LinkedElements') this.testCase.AddLinkedElement(item);
    else if (this.selectedLinks.Key === 'properties.LinkedScenarios') this.testCase.AddLinkedAttackScenario(item);
    else if (this.selectedLinks.Key === 'properties.LinkedMeasures') this.testCase.AddLinkedCountermeasure(item);
    this.RefreshLinks(this.selectedLinks.Key);
  }

  public OnItemClick(item) {
    if (item instanceof ViewElementBase) {
      const queryParams: Params = { viewID: this.GetItemView(item).ID, elementID: item.ID };
      this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, replaceUrl: true });
    }
    else if (item instanceof AttackScenario) this.dialog.OpenAttackScenarioDialog(item, false);
    else if (item instanceof Countermeasure) this.dialog.OpenCountermeasureDialog(item, false, []);
  }

  public async OnFileSelected(event) {
    if (event.target.files && event.target.files[0]) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }

      try {
        const compressedFile = await imageCompression(event.target.files[0], options);
        
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = (event) => {
          this.testCase.Images = [...this.testCase.Images, event.target.result.toString()];
        }
      } 
      catch (error) {
        console.log(error);
      }
    }
  }

  public DeleteImage(img) {
    const index = this.testCase.Images.indexOf(img);
    if (index >= 0) {
      this.testCase.Images.splice(index, 1);
    }
  }

  public ViewImage(img) {
    this.dialog.OpenViewImageDialog(img);
  }

  public GetItemView(item) {
    if (item instanceof ViewElementBase) {
      return this.testCase.GetViewOfLinkedElement(item);
    }
    else if (item instanceof AttackScenario || item instanceof Countermeasure) return this.dataService.Project.GetView(item.ViewID);
  }

  private groups = {};
  public GetMenuGroups(links: IKeyValue) {
    if (this.groups[links.Key] == null) {
      this.groups[links.Key] = [];
      const views = [];
      // get all relevant views
      this.dataService.Project.GetDevices().forEach(dev => {
        views.push(dev.HardwareDiagram);
        if (dev.SoftwareStack) views.push(dev.SoftwareStack);
        if (dev.ProcessStack) views.push(dev.ProcessStack);
      });
      this.dataService.Project.GetMobileApps().forEach(app => {
        if (app.SoftwareStack) views.push(app.SoftwareStack);
        if (app.ProcessStack) views.push(app.ProcessStack);
      });
      views.push(...this.dataService.Project.GetDFDiagrams());

      if (links.Key === 'properties.LinkedElements') {
        views.forEach(view => {
          let items;
          if (view instanceof Diagram) { items = view.Elements.GetChildrenFlat(); }
          else if (view instanceof MyComponentStack) { items = view.GetChildrenFlat(); }
          if (items) {
            items = items.filter(x => !this.testCase.LinkedElements.includes(x));
            if (items.length > 0) this.groups[links.Key].push({ Key: view, Value: items });
          }
        });
      }
      else if (links.Key === 'properties.LinkedScenarios') {
        views.forEach(view => {
          const items = this.dataService.Project.GetAttackScenariosApplicable().filter(x => x.ViewID == view.ID && !this.testCase.LinkedScenarios.includes(x));
          if (items?.length > 0) this.groups[links.Key].push({ Key: view, Value: items });
        });
      }
      else if (links.Key === 'properties.LinkedMeasures') {
        views.forEach(view => {
          const items = this.dataService.Project.GetCountermeasuresApplicable().filter(x => x.ViewID == view.ID && !this.testCase.LinkedMeasures.includes(x));
          if (items?.length > 0) this.groups[links.Key].push({ Key: view, Value: items });
        });
      }
    }

    return this.groups[links.Key];
  }

  public GetTestCaseStates() {
    return TestCaseStateUtil.GetKeys();
  }

  public GetTestCaseStateName(tcs: TestCaseStates) {
    return TestCaseStateUtil.ToString(tcs);
  }

  public NumberAlreadyExists() {
    return this.dataService.Project.GetTestCases().some(x => x.Number == this.testCase.Number && x.ID != this.testCase.ID);
  }
}
