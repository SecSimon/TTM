import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { TestCase, TestCaseStates, TestCaseStateUtil, Testing } from '../../model/test-case';
import { DataService } from '../../util/data.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-testing',
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.scss']
})
export class TestingComponent implements OnInit {

  @Input() public testing: Testing;
  public selectedTestCase: TestCase;  

  constructor(public dataService: DataService, public theme: ThemeService) { }

  ngOnInit(): void {
  }

  public AddTestCase() {
    const tc = this.dataService.Project.CreateTestCase();
    this.testing.AddTestCase(tc);
    this.selectedTestCase = tc;
    return tc;
  }

  public DeleteTestCase(tc: TestCase) {
    if (this.selectedTestCase == tc) this.selectedTestCase = null;
    this.dataService.Project.DeleteTestCase(tc);
  }

  public ResetNumbers() {
    const arr = this.dataService.Project.GetTestCases();
    for (let i = 0; i < arr.length; i++) {
      arr[i].Number = (i+1).toString();
    }
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.testing.Data['testCaseIDs'], event.previousIndex, event.currentIndex);
  }

  public GetStatus(tcs: TestCaseStates) {
    return TestCaseStateUtil.ToString(tcs);
  }
}
