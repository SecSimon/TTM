import { Injectable } from '@angular/core';
import { MyComponentStack } from '../model/component';
import { ViewElementBase } from '../model/database';
import { CtxDiagram, Diagram } from '../model/diagram';
import { Countermeasure, MitigationStates } from '../model/mitigations';
import { MappingStates, AttackScenario } from '../model/threat-model';
import { DataService } from './data.service';

interface IMappingDetails {
  map: Countermeasure;
  attackScenarioIDs: string[];
  targetIDs: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MitigationEngineService {

  constructor(public dataService: DataService) { }

  public GenerateDiagramMitigations(diagram: Diagram): Countermeasure[] {
    return this.generateMitigations(diagram.ID);
  }

  public GenerateStackMitigations(stack: MyComponentStack): Countermeasure[] {
    return this.generateMitigations(stack.ID);
  }

  private generateMitigations(viewID: string) {
    let pf = this.dataService.Project;
    let cf = this.dataService.Config;
    
    //console.log('gen mitigations');
    pf.GetCountermeasures().filter(x => x.ViewID == viewID && x.MappingState == MappingStates.New).forEach(x => x.MappingState = MappingStates.Stable);
    let mappingsBefore = pf.GetCountermeasures().filter(x => x.ViewID == viewID && x.IsGenerated); // current mitigations
    mappingsBefore.forEach(x => x.RuleStillApplies = true);
    mappingsBefore.filter(x => x.MappingState == MappingStates.Removed).forEach(x => pf.DeleteCountermeasure(x)); // delete mitigations that are marked to remove
    mappingsBefore = mappingsBefore.filter(x => x.MappingState != MappingStates.Removed); // update current threats
    let mappingsBeforeDetails: IMappingDetails[] = [];
    mappingsBefore.forEach(x => mappingsBeforeDetails.push({ map: x, attackScenarioIDs: x.AttackScenarios.map(y => y?.ID), targetIDs: x.Targets.map(y => y?.ID)}));

    let checkMappings = (attackScenarios: AttackScenario[]) => {
      let mitigations = cf.GetControls();
      attackScenarios.forEach(tm => {
        let mits = mitigations.filter(x => x.MitigatedAttackVectors.includes(tm.AttackVector));
        mits.push(...mitigations.filter(x => x.MitigatedThreatRules.includes(tm.ThreatRule)));
        
        mits.forEach(mit => {
          let targets: ViewElementBase[];
          if (tm.Target) targets = [tm.Target];
          else targets = tm.Targets;
          const existing = pf.GetCountermeasures().find(x => x.Control == mit && (x.AttackScenarios.includes(tm) || (x.Targets.includes(tm.Target) || x.Targets.some(x => tm.Targets.includes(x)))));
          if (existing) {
            existing.MappingState = MappingStates.Stable;
            mappingsBefore.splice(mappingsBefore.findIndex(x => x.ID == existing.ID), 1); // remove from list as this mapping still applies
            existing.AddAttackScenario(tm);
            targets.forEach(x => existing.AddTarget(x));
            const detail = mappingsBeforeDetails.find(x => x.map == existing);
            if (detail) {
              let index = detail.attackScenarioIDs.indexOf(tm.ID);
              if (index >= 0) detail.attackScenarioIDs.splice(index, 1);
              targets.forEach(x => {
                index = detail.targetIDs.indexOf(x.ID);
                if (index >= 0) detail.targetIDs.splice(index, 1);
              });
            }
          }
          else {
            const map = pf.CreateCountermeasure(viewID, true);
            map.SetMapping(mit, targets, [tm]);
          }
        });
      });
    };

    let attackScenarios = pf.GetAttackScenarios().filter(x => x.ViewID == viewID && (x.AttackVector || x.ThreatRule) && [MappingStates.New, MappingStates.Stable].includes(x.MappingState));
    checkMappings(attackScenarios);

    mappingsBefore.forEach(x => {
      if (x.MitigationState == MitigationStates.NotSet) x.MappingState = MappingStates.Removed; // mark all mappings that does not apply anymore as to remove
      else x.RuleStillApplies = false;
    });

    // clean up targets and attack scenarios
    mappingsBeforeDetails.forEach(detail => {
      if (detail.map.MappingState != MappingStates.Removed) {
        for (let i = 0; i < detail.targetIDs.length; i++) {
          if (detail.targetIDs[i]) {
            detail.map.RemoveTarget(detail.targetIDs[i]);
            detail.targetIDs.splice(i, 1);
            i--;
          }
        }
        // cannot be done because of manually mapping countermeasures
        // for (let i = 0; i < detail.attackScenarioIDs.length; i++) {
        //   if (detail.attackScenarioIDs[i]) {
        //     detail.map.RemoveAttackScenario(detail.attackScenarioIDs[i]);
        //     detail.attackScenarioIDs.splice(i, 1);
        //     i--;
        //   }
        // }
        if (detail.targetIDs.length > 0 || detail.attackScenarioIDs.length > 0) {
          detail.map.CleanUpReferences();
        }
      }
    });

    pf.GetCountermeasures().filter(x => x.ViewID == viewID).filter(x => x.AttackScenarios.length == 0 && x.Targets.length == 0).forEach(x => {
      x.MappingState = MappingStates.Removed;
    });

    return pf.GetCountermeasures().filter(x => x.ViewID == viewID);
  }
}
