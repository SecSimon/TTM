import { Injectable } from '@angular/core';
import { DataFlow, DFDElement, ElementTypeIDs, Interface } from '../model/dfd-model';
import { DiagramTypes, HWDFDiagram } from '../model/diagram';
import { DataService } from './data.service';

export enum DFDRuleTypes {
  AtLeastOneDF = 1, // at least one data flow for EE, DS, P, PL
  DFconnectsP = 2, // every data flow connects to a least one process
  TooManyProcesses = 3, // not more than 7 processes recommended
  IFNotUsed = 101 // interface is not used in any data flow
}

export enum DFDIssueTypes {
  Info = 1,
  Warning = 2,
  Error = 3
}

export interface IDFDIssue {
  DiagramID: string;
  Type: DFDIssueTypes;
  RuleType: DFDRuleTypes;
  Element: DFDElement;
}

@Injectable({
  providedIn: 'root'
})
export class DFDCopService {

  constructor(public dataService: DataService) { }

  public CheckDFDRules(diagram: HWDFDiagram): IDFDIssue[] {
    if (!diagram.Elements) return [];
    let res: IDFDIssue[] = [];

    if (diagram.DiagramType == DiagramTypes.DataFlow) {
      res.push(...this.checkRule1(diagram));
      res.push(...this.checkRule2(diagram));
      res.push(...this.checkRule3(diagram));
    }
    else {
      res.push(...this.checkRule101(diagram));
    }

    return res;
  }

  private checkRule1(diagram: HWDFDiagram): IDFDIssue[] {
    let res: IDFDIssue[] = [];

    let elements = diagram.Elements.GetChildrenFlat();
    let eles = elements.filter(x => [ElementTypeIDs.LogExternalEntity, ElementTypeIDs.PhyExternalEntity, ElementTypeIDs.LogDataStore, ElementTypeIDs.LogProcessing, ElementTypeIDs.PhysicalLink].includes(x.Type.ElementTypeID));
    let dfs = elements.filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow) as DataFlow[];

    dfs.forEach(df => {
      if (df.Sender) {
        let ix = eles.findIndex(x => x.ID == df.Sender.ID);
        eles.splice(ix, 1);
      }
      if (df.Receiver) {
        let ix = eles.findIndex(x => x.ID == df.Receiver.ID);
        eles.splice(ix, 1);
      }
    });

    eles.forEach(x => res.push({ DiagramID: diagram.ID, RuleType: DFDRuleTypes.AtLeastOneDF, Type: DFDIssueTypes.Warning, Element: x }));

    return res;
  }

  private checkRule2(diagram: HWDFDiagram): IDFDIssue[] {
    let res: IDFDIssue[] = [];

    let elements = diagram.Elements.GetChildrenFlat();
    let dfs = elements.filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow) as DataFlow[];

    dfs.forEach(df => {
      let hasP = false;
      let bothPL = true;
      if (df.Sender) {
        hasP = df.Sender.Type.ElementTypeID == ElementTypeIDs.LogProcessing;
        bothPL = df.Sender.Type.ElementTypeID == ElementTypeIDs.PhysicalLink;
      }
      if (!hasP && df.Receiver) {
        hasP = df.Receiver.Type.ElementTypeID == ElementTypeIDs.LogProcessing;
        bothPL = bothPL && df.Receiver.Type.ElementTypeID == ElementTypeIDs.PhysicalLink;
      }

      if (!hasP && !bothPL) {
        res.push({ DiagramID: diagram.ID, RuleType: DFDRuleTypes.DFconnectsP, Type: DFDIssueTypes.Warning, Element: df });
      }
    });

    return res;
  }

  private checkRule3(diagram: HWDFDiagram): IDFDIssue[] {
    let res: IDFDIssue[] = [];

    let elements = diagram.Elements.GetChildrenFlat();
    let ps = elements.filter(x => x.Type.ElementTypeID == ElementTypeIDs.LogProcessing);

    if (ps.length > 7) {
      res.push({ DiagramID: diagram.ID, RuleType: DFDRuleTypes.TooManyProcesses, Type: DFDIssueTypes.Warning, Element: null });
    }

    return res;
  }

  private checkRule101(diagram: HWDFDiagram): IDFDIssue[] {
    let res: IDFDIssue[] = [];

    let interfaces = diagram.Elements.GetChildrenFlat().filter(x => x.Type.ElementTypeID == ElementTypeIDs.Interface) as Interface[];
    let dfs = this.dataService.Project.GetDFDElements().filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow) as DataFlow[];

    interfaces.forEach(i => {
      if (!dfs.some(x => x.SenderInterface?.ID == i.ID || x.ReceiverInterface?.ID == i.ID)) {
        res.push({ DiagramID: diagram.ID, RuleType: DFDRuleTypes.IFNotUsed, Type: DFDIssueTypes.Info, Element: i });
      }
    });

    return res;
  }
}
