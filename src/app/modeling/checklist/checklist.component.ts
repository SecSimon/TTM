import { Component, Input, OnInit } from '@angular/core';
import { Checklist, IRequirementValue, RequirementType } from '../../model/checklist';
import { Device } from '../../model/system-context';
import { DataService } from '../../util/data.service';

interface IFlatRequirement {
  requirement: RequirementType;
  value: IRequirementValue;
  level: number;
  updateAvailable: boolean;
}

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent implements OnInit {

  public Requirements: IFlatRequirement[] = [];

  @Input() checklist: Checklist;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    let device = this.dataService.Project.GetDevices().find(x => x.Checklists.includes(this.checklist));
    let addRequirements = (reqs: RequirementType[], level: number) => {
      reqs.forEach(req => {
        let update = false;
        let reqValue = this.checklist.RequirementValues.find(x => x.RequirementTypeID == req.ID);
        if (!reqValue) {
          reqValue = { RequirementTypeID: req.ID, NeedsReview: false, Values: new Array(this.checklist.Type.Levels.length).fill(false) };
          this.checklist.RequirementValues.push(reqValue);
          let calculatedValues = req.EvalRequirement(device);
          if (calculatedValues) {
            reqValue.Values = calculatedValues;
            reqValue.NeedsReview = req.ReqFulfillRule.NeedsReview;
          }
        }
        else {
          let calculatedValues = req.EvalRequirement(device);
          if (calculatedValues) {
            if (calculatedValues.length != reqValue.Values.length) update = true;
            else {
              for (let i = 0; i < calculatedValues.length; i++) {
                if (calculatedValues[i] != reqValue.Values[i]) update = true;
              }
            }
          }
        }

        let res: IFlatRequirement = { requirement: req, level: level, value: reqValue, updateAvailable: update };
        this.Requirements.push(res);
        if (req.SubReqTypes.length > 0) addRequirements(req.SubReqTypes, level+1);
      });
    };

    addRequirements(this.checklist.Type.RequirementTypes, 0);
  }

  public UpdateValues(req: IFlatRequirement) {
    let device = this.dataService.Project.GetDevices().find(x => x.Checklists.includes(this.checklist));
    let calculatedValues = req.requirement.EvalRequirement(device);
    if (calculatedValues) {
      req.value.Values = calculatedValues;
      req.updateAvailable = false;
      req.value.NeedsReview = true;
    }
  }

  public GetCellStatus(req: IFlatRequirement, index: number) {
    let expected = req.requirement.RequiredPerLevel[index];
    if (expected) {
      if (req.value.Values[index]) return true;
      return false;
    }
    else return null;
  }

  public GetBackgroundColor(req: IFlatRequirement, index: number) {
    let status = this.GetCellStatus(req, index);
    if (status) return '#589758';
    else if (status == false) return '#b15b5b';
    return 'transparent';
  }
}
