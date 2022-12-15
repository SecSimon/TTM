import { Component, Input, OnInit, Optional } from '@angular/core';
import { DatabaseBase, IKeyValue } from '../../model/database';
import { OptionTypes, OptionTypesUtil, ThreatCategoryGroup, AttackVector, AttackVectorGroup, ThreatQuestion } from '../../model/threat-model';
import { DataService } from '../../util/data.service';
import { DialogService } from '../../util/dialog.service';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-threat-question',
  templateUrl: './threat-question.component.html',
  styleUrls: ['./threat-question.component.scss']
})
export class ThreatQuestionComponent implements OnInit {
  private _threatQuestion;

  @Input() public canEdit: boolean = true;
  @Input() public showAttackVector = true;

  public get threatQuestion(): ThreatQuestion { return this._threatQuestion; }
  @Input() public set threatQuestion(val: ThreatQuestion) {
    this._threatQuestion = val;
    this.selectedOption = null;
  }

  public selectedOption: IKeyValue;

  constructor(public theme: ThemeService, public dataService: DataService, private dialog: DialogService) {
  }

  ngOnInit(): void {
  }

  public GetProperties() {
    return this.threatQuestion.ComponentType.Properties;
  } 

  public GetOptionTypes(): OptionTypes[] {
    return OptionTypesUtil.GetTypes();
  }

  public GetOptionTypeName(opt: OptionTypes) {
    return OptionTypesUtil.ToString(opt);
  }

  public GetOptionValues(ot: OptionTypes) {
    return OptionTypesUtil.GetOptions(ot)
  }

  public IsOptionSelected(opt: IKeyValue) {
    return this.selectedOption != null ? opt.Key == this.selectedOption.Key : false;
  }
}
