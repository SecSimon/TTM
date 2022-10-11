import { Injectable } from '@angular/core';
import { MyComponent, MyComponentStack } from '../model/component';
import { DatabaseBase, ViewElementBase } from '../model/database';
import { DataFlow, DFDContainerRef, DFDElement, DFDElementRef, ElementTypeIDs, IElementTypeThreat } from '../model/dfd-model';
import { CtxDiagram, Diagram, DiagramTypes, HWDFDiagram } from '../model/diagram';
import { FlowArrowPositions } from '../model/system-context';
import { IPropertyRestriction, MappingStates, ThreatMapping, RuleTypes, ITypeIDs, IDetailRestriction, RestrictionTypes, ThreatRule, RuleGenerationTypes, PropertyComparisonTypes, ThreatQuestion, ThreatStates } from '../model/threat-model';
import { DataService } from './data.service';
import { DialogService } from './dialog.service';

interface IEvalResult {
  target: ViewElementBase;
  elements: ViewElementBase[];
}
@Injectable({
  providedIn: 'root'
})
export class ThreatEngineService {

  constructor(private dataService: DataService, private dialog: DialogService) { }

  /**
   * Generate threats for all diagrams and MyComponent stacks
   * @returns all threats
   */
  public GenerateAllThreats(): ThreatMapping[] {
    let pf = this.dataService.Project;
    pf.GetDiagrams().forEach(x => this.GenerateDiagramThreats(x));
    pf.GetStacks().forEach(x => this.GenerateStackThreats(x));
    return pf.GetThreatMappings();
  }

  /**
   * Generate threats for given diagram
   * @param diagram the diagram
   * @returns list of threat mappings belonging to the given diagram
   */
  public GenerateDiagramThreats(diagram: Diagram): ThreatMapping[] {
    if (!diagram.Elements) return [];
    let pf = this.dataService.Project;
  
    //console.log('gen threats');
    pf.GetThreatMappings().filter(x => x.ViewID == diagram.ID && !x.IsGenerated).forEach(x => x.MappingState = MappingStates.Stable);
    let mappingsBefore = pf.GetThreatMappings().filter(x => x.ViewID == diagram.ID && x.IsGenerated); // current threats
    mappingsBefore.forEach(x => x.RuleStillApplies = true);
    mappingsBefore.filter(x => x.MappingState == MappingStates.Removed).forEach(x => pf.DeleteThreatMapping(x)); // delete threats that are marked to remove
    mappingsBefore = mappingsBefore.filter(x => x.MappingState != MappingStates.Removed); // update current threats

    let checkElements = (ruleType: RuleTypes, elements: DFDElement[]) => {
      // rules for each element
      elements.forEach(element => {
        this.dataService.Config.GetThreatRules().filter(x => x.RuleType == ruleType && x.IsActive && x.RuleGenerationType == RuleGenerationTypes.EachElement).forEach(rule => {
          let matches = this.checkElementAgainstRule(rule, element, elements);
          matches.forEach(m => {
            let existing = this.checkForExistingMapping(rule, m.target, m.elements);
            if (existing) {
              existing.MappingState = MappingStates.Stable;
              mappingsBefore.splice(mappingsBefore.findIndex(x => x.ID == existing.ID), 1); // remove from list as this mapping still applies
            }
            else {
              const map = pf.CreateThreatMapping(diagram.ID, true);
              map.SetMapping(rule.ThreatOrigin?.ID, rule.ThreatCategories.map(x => x.ID), m.target, m.elements, rule, null);
            }
          });
        });
      });

      // rules for once for all elements
      this.dataService.Config.GetThreatRules().filter(x => x.RuleType == ruleType && x.IsActive && x.RuleGenerationType == RuleGenerationTypes.OnceForAllElements).forEach(rule => {
        let appliedElements = [];
        elements.forEach(element => {
          let res = this.checkElementAgainstRule(rule, element, elements);
          res.forEach(x => appliedElements.push(...x.elements));
        });

        if (appliedElements.length > 0) {
          let existing = this.checkForExistingMapping(rule, appliedElements.length == 1 ? appliedElements[0] : null, appliedElements);
          if (existing) {
            existing.MappingState = MappingStates.Stable;
            mappingsBefore.splice(mappingsBefore.findIndex(x => x.ID == existing.ID), 1); // remove from list as this mapping still applies
          }
          else {
            let map = pf.CreateThreatMapping(diagram.ID, true);
            map.SetMapping(rule.ThreatOrigin?.ID, rule.ThreatCategories.map(x => x.ID), appliedElements.length == 1 ? appliedElements[0] : null, appliedElements, rule, null);
            // if (ruleType == RuleTypes.DFD) {
            //   // todo
            //   map.SetMapping(rule.ThreatOrigin?.ID, rule.ThreatCategories.map(x => x.ID), appliedElements.length == 1 ? appliedElements[0] : null, appliedElements, rule, null);
            // }
            // else {
            //   map.SetMapping(rule.ThreatOrigin?.ID, rule.ThreatCategories.map(x => x.ID), null, appliedElements, rule, null);
            // }
          }
        }
      });
    };

    // Stencil threats
    if ([DiagramTypes.Hardware, DiagramTypes.DataFlow].includes(diagram.DiagramType)) checkElements(RuleTypes.Stencil, (diagram as HWDFDiagram).Elements.GetChildrenFlat());
    // DFD threats
    if (diagram.DiagramType == DiagramTypes.DataFlow) checkElements(RuleTypes.DFD, (diagram as HWDFDiagram).Elements.GetChildrenFlat().filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow));
    if (diagram.DiagramType == DiagramTypes.DataFlow) checkElements(RuleTypes.Protocol, (diagram as HWDFDiagram).Elements.GetChildrenFlat().filter(x => x.Type.ElementTypeID == ElementTypeIDs.DataFlow));

    mappingsBefore.forEach(x => {
      if (x.ThreatState == ThreatStates.NotSet) x.MappingState = MappingStates.Removed; // mark all mappings that does not apply anymore as to remove
      else x.RuleStillApplies = false;
    });
    return pf.GetThreatMappings().filter(x => x.ViewID == diagram.ID);
  }

  /**
   * Generate threats for given component stack
   * @param stack the component stack
   * @returns list of threat mappings belonging to the given stack
   */
  public GenerateStackThreats(stack: MyComponentStack): ThreatMapping[] {
    let pf = this.dataService.Project;

    pf.GetThreatMappings().filter(x => x.ViewID == stack.ID && !x.IsGenerated).forEach(x => x.MappingState = MappingStates.Stable);
    let mappingsBefore = pf.GetThreatMappings().filter(x => x.ViewID == stack.ID && x.IsGenerated); // current threats
    mappingsBefore.filter(x => x.MappingState == MappingStates.Removed).forEach(x => pf.DeleteThreatMapping(x)); // delete threats that are marked to remove
    mappingsBefore = mappingsBefore.filter(x => x.MappingState != MappingStates.Removed); // update current threats

    let checkComponents = (components: MyComponent[]) => {
      // rules for each element
      components.forEach(component => {
        this.dataService.Config.GetThreatRules().filter(x => x.IsActive && x.RuleType == RuleTypes.Component && x.RuleGenerationType == RuleGenerationTypes.EachElement).forEach(rule => {
          let matches = this.checkElementAgainstRule(rule, component, components);
          matches.forEach(m => {
            let existing = this.checkForExistingMapping(rule, m.target, m.elements);
            if (existing) {
              existing.MappingState = MappingStates.Stable;
              mappingsBefore.splice(mappingsBefore.findIndex(x => x.ID == existing.ID), 1); // remove from list as this mapping still applies
            }
            else {
              const map = pf.CreateThreatMapping(stack.ID, true);
              let quest: ThreatQuestion = null;
              if (rule.ComponentRestriction.DetailRestrictions.length == 1) {
                quest = pf.Config.GetThreatQuestions().find(y => y.ComponentType.ID == component.Type.ID && y.Property.ID == rule.ComponentRestriction.DetailRestrictions[0].PropertyRest.ID);
              }
              map.SetMapping(rule.ThreatOrigin?.ID, rule.ThreatCategories.map(x => x.ID), m.target, m.elements, rule, quest);
            }
          });
        });
      });
    };

    checkComponents(stack.GetChildren());

    mappingsBefore.forEach(x => {
      if (x.ThreatState == ThreatStates.NotSet) x.MappingState = MappingStates.Removed; // mark all mappings that does not apply anymore as to remove
      else x.RuleStillApplies = false;
    });
    return pf.GetThreatMappings().filter(x => x.ViewID == stack.ID);
  }

  public AddMnemonicThreat(element: DFDElement, letter: IElementTypeThreat) {
    if (element) {
      let dia = this.dataService.Project.FindDiagramOfElement(element.ID);
      let map = this.dataService.Project.CreateThreatMapping(dia.ID, false);
      map.SetMapping('', [], element, [], null, null);
      map.IsGenerated = false;
      map.Name = letter.Name;
      map.Description = letter.Description;
      if (letter.threatCategoryID) {
        map.ThreatCategories = [this.dataService.Config.GetThreatCategory(letter.threatCategoryID)];
      }
      const dialogRef = this.dialog.OpenThreatMappingDialog(map, true);
      dialogRef.subscribe(result => {
        if (!result) {
          this.dataService.Project.DeleteThreatMapping(map);
        }
      });
      return dialogRef;
    }
  }

  /**
   * Check if the given rule applies on the given element
   * @param rule the threat rule
   * @param element element under investigation
   * @returns true if rule applies on element
   */
  private checkElementAgainstRule(rule: ThreatRule, element: ViewElementBase, elements: ViewElementBase[]): IEvalResult[] {
    if (rule.RuleType == RuleTypes.DFD) {
      let checkDataFlow = (df: DataFlow, nodeOffset: number, isReverse: boolean, isFirstSubPath: boolean = true): [boolean, boolean] => {
        const applyRev = isFirstSubPath && (rule.DFDRestriction.AppliesReverse || [FlowArrowPositions.Both, FlowArrowPositions.Initiator].includes(df.ArrowPos));
        let startNode = rule.DFDRestriction.NodeTypes[nodeOffset+0];
        let endNode = rule.DFDRestriction.NodeTypes[nodeOffset+1];
        let res = true;
        if (!isReverse) {
          if (res && !this.isCorrectNodeType(startNode, df.Sender)) res = false; // check sender type
          if (res && !this.isCorrectNodeType(endNode, df.Receiver)) res = false; // check receiver type
        }
        if (isReverse || (!res && applyRev)) {
          res = isReverse = true;
          startNode = rule.DFDRestriction.NodeTypes[rule.DFDRestriction.NodeTypes.length-2-nodeOffset];
          endNode = rule.DFDRestriction.NodeTypes[rule.DFDRestriction.NodeTypes.length-1-nodeOffset];
          if (res && !this.isCorrectNodeType(startNode, df.Receiver)) res = false; // check sender type
          if (res && !this.isCorrectNodeType(endNode, df.Sender)) res = false; // check receiver type
        }
        let restrictions: IDetailRestriction[] = rule.DFDRestriction?.NodeRestrictions;
        res = res && this.evalRestrictions(restrictions, rule.RuleType, df, nodeOffset);
        return [res, isReverse];
      }

      const df = element as DataFlow;
      if (rule.DFDRestriction.NodeTypes.length == 2) {
        if (checkDataFlow(df, 0, false)[0]) {
          return [ { target: df, elements: [df.Sender, df, df.Receiver] } ];
        }
      }
      else {
        let res: IEvalResult[] = [];

        let checkFurtherNodes = (startNode: DFDElement, nodes: ViewElementBase[], nodeOffset: number, isReverse: boolean) => {
          let possibleFlows = elements.filter(x => x instanceof DataFlow).filter(x => (x as DataFlow).Sender?.ID == startNode.ID);
          possibleFlows.forEach(flow => {
            const dfCheck = checkDataFlow(flow as DataFlow, nodeOffset, isReverse, false);
            if (dfCheck[0]) {
              let newNodes = [...nodes, flow, (flow as DataFlow).Receiver];
              if (nodeOffset+2 == rule.DFDRestriction.NodeTypes.length) {
                res.push({ target: startNode, elements: newNodes });
              }
              else checkFurtherNodes((flow as DataFlow).Receiver, newNodes, nodeOffset+1, dfCheck[1]);
            }
          });
        };
        const dfCheck = checkDataFlow(df, 0, false); 
        if (dfCheck[0]) {
          checkFurtherNodes(df.Receiver, [df.Sender, df, df.Receiver], 1, dfCheck[1]);
        }
        
        return res;
      }

      return [];
    }
    else {
      let threatApplies = true;
      // check stencil/component type 
      if (rule.RuleType == RuleTypes.Stencil) {
        const requiredStencil = this.dataService.Config.GetStencilType(rule.StencilRestriction.stencilTypeID);
        if (requiredStencil.IsDefault) threatApplies = (element as DFDElement).Type.ElementTypeID == requiredStencil.ElementTypeID;
        else threatApplies = (element as DFDElement).Type.ID == rule.StencilRestriction.stencilTypeID; 
        threatApplies = threatApplies && !(element instanceof DFDElementRef || element instanceof DFDContainerRef);
      }
      else if (rule.RuleType == RuleTypes.Component) {
        threatApplies = (element as MyComponent).Type.ID == rule.ComponentRestriction.componentTypeID;
      }
      else if (rule.RuleType == RuleTypes.Protocol) {
        threatApplies = (element as DataFlow).ProtocolStack.map(x => x.ID).includes(rule.ProtocolRestriction.protocolID);
      }

      // check restrictions
      let restrictions: IDetailRestriction[] = rule.StencilRestriction?.DetailRestrictions;
      if (rule.RuleType == RuleTypes.Component) restrictions = rule.ComponentRestriction.DetailRestrictions;
      threatApplies = threatApplies && this.evalRestrictions(restrictions, rule.RuleType, element, 0);
      if (threatApplies) {
        return [ { target: element, elements: [element] } ];
      }
      else return [];
    }
  }

  /**
   * Check if given restrictions apply to the given element
   * @param rs all restrictions
   * @param ruleType rule type
   * @param element element under investigation
   * @returns true if all restrictions apply
   */
  private evalRestrictions(restrictions: IDetailRestriction[], ruleType: RuleTypes, element: ViewElementBase, dfdNodeOffset: number): boolean {
    if (restrictions == null || restrictions.length == 0) return true;

    // calculate interim result for each layer window
    let currLayer = Math.max(...restrictions.map(x => x.Layer));
    let results = new Array(restrictions.length);
    results.fill(null, 0, restrictions.length);
    while (currLayer >= 0) {
      let startIndex = -1;
      let startEval = false;
      for (let i = 0; i < restrictions.length; i++) {
        if (restrictions[i].Layer == currLayer && startIndex == -1) startIndex = i;
        else if (startIndex >= 0 && restrictions[i].Layer != currLayer) startEval = true; 

        if (startEval || (startIndex >= 0 && i == restrictions.length-1)) {
          let restWindow = restrictions.slice(startIndex, (i == restrictions.length-1) ? i+1 : i);
          results[startIndex] = [currLayer, restWindow[restWindow.length-1].IsOR, this.evalRestrictionWindow(restWindow, ruleType, element, dfdNodeOffset)];
          startIndex = -1;
          startEval = false;
        }
      }

      currLayer = currLayer-1;
    }

    // reduce result, layer for layer
    results = results.filter(x => x != null);
    currLayer = Math.max(...restrictions.map(x => x.Layer));
    while (currLayer >= 0) {
      for (let i = 1; i < results.length; i++) {
        if (results[i] != null && results[i][0] == currLayer) {
          results[i-1][2] = results[i-1][1] ? (results[i-1][2] || results[i][2]) : (results[i-1][2] && results[i][2]);
          results.splice(i, 1);
          i--;
        }
      }
      currLayer = currLayer-1;
    }

    results = results.filter(x => x != null);
    if (results.length == 0) return false;
    else if (results.length > 1) console.error('Only one layer should remain');
    else return results[0][2];
  }

  /**
   * Check if given restrictions apply to the given element
   * @param rs all restrictions
   * @param ruleType rule type
   * @param element element under investigation
   * @returns true if all restrictions apply
   */
  private evalRestrictionWindow(rs: IDetailRestriction[], ruleType: RuleTypes, element: ViewElementBase, dfdNodeOffset: number): boolean {
    let res = this.evalRestriction(rs[0], ruleType, element, dfdNodeOffset);

    let isOR = rs[0].IsOR;
    for (let i = 1; i < rs.length; i++) {
      let interres = this.evalRestriction(rs[i], ruleType, element, dfdNodeOffset);
      res = isOR ? (res || interres) : (res && interres);
      isOR = rs[i].IsOR;
    }

    return res;
  }

  /**
   * Check if given restriction applies to the given element
   * @param r the restriction
   * @param ruleType rule type
   * @param element element under investigation
   * @returns true if restriction applies
   */
  private evalRestriction(r: IDetailRestriction, ruleType: RuleTypes, element: ViewElementBase, dfdNodeOffset: number): boolean {
    if (r.RestType == RestrictionTypes.Property) {
      if ([RuleTypes.Stencil, RuleTypes.Component].includes(ruleType) || r.NodeNumber == -1) { return ThreatEngineService.EvalProp(r.PropertyRest, element); }
      if (r.NodeNumber == dfdNodeOffset+0) { return ThreatEngineService.EvalProp(r.PropertyRest, (element as DataFlow).Sender); }
      if (r.NodeNumber == dfdNodeOffset+1) { return ThreatEngineService.EvalProp(r.PropertyRest, (element as DataFlow).Receiver); }
      return true;
    }
    else if (r.RestType == RestrictionTypes.DataFlowCrosses) {
      if (r.DataflowRest.TrustAreaIDs.length == 0) return (element as DataFlow).Sender.Parent.ID != (element as DataFlow).Receiver.Parent.ID;
      else return r.DataflowRest.TrustAreaIDs.includes((element as DataFlow).Sender.Parent.Type.ID) || r.DataflowRest.TrustAreaIDs.includes((element as DataFlow).Receiver.Parent.Type.ID);
    }
    else if (r.RestType == RestrictionTypes.PhysicalElement) {
      if (ruleType == RuleTypes.Stencil) { return ThreatEngineService.EvalProp(r.PhyElementRest.Property, (element as DFDElement).PhysicalElement); }
      if (r.NodeNumber == dfdNodeOffset+0) { return ThreatEngineService.EvalProp(r.PhyElementRest.Property, (element as DataFlow).Sender.PhysicalElement); }
      if (r.NodeNumber == dfdNodeOffset+1) { return ThreatEngineService.EvalProp(r.PhyElementRest.Property, (element as DataFlow).Receiver.PhysicalElement); }
      if (r.NodeNumber >= dfdNodeOffset+2) return true;
      return false;
    }
    else if (r.RestType == RestrictionTypes.SenderInterface) {
      if ((element as DataFlow).SenderInterface) return ThreatEngineService.EvalProp(r.SenderInterfaceRestriction.Property, (element as DataFlow).SenderInterface);
      return false;
    }
    else if (r.RestType == RestrictionTypes.ReceiverInterface) {
      if ((element as DataFlow).ReceiverInterface) return ThreatEngineService.EvalProp(r.ReceiverInterfaceRestriction.Property, (element as DataFlow).ReceiverInterface);
      return false;
    }

    console.error('Unknown path in evalRestriction()', r, ruleType, element, dfdNodeOffset);
  };

  /**
   * Check if there is a mapping for the given rule and element
   * @param rule matching rule
   * @param target matching element
   * @param targets matching elements
   * @returns ThreatMapping if a mapping for this rule on this element has already been created 
   */
  private checkForExistingMapping(rule: ThreatRule, target: ViewElementBase, targets: ViewElementBase[]): ThreatMapping {
    return this.dataService.Project.GetThreatMappings().find(x => {
      let res = x.ThreatOrigin?.ID == rule.ThreatOrigin?.ID && x.ThreatRule?.ID == rule.ID && x.Target?.ID == target?.ID;
      // if (rule.RuleType == RuleTypes.DFD && rule.RuleGenerationType == RuleGenerationTypes.EachElement) {
      //   res = res && x.Targets.length == 3 && x.Targets[0].ID == (target as DataFlow).Sender.ID && x.Targets[1].ID == (target as DataFlow).ID && x.Targets[2].ID == (target as DataFlow).Receiver.ID;
      // }
      if (targets) {
        res = res && x.Targets.length == targets.length;
        if (res) {
          for (let i = 0; i < targets.length; i++) {
            res = res && targets[i].ID == x.Targets[i].ID;
          }
        }
      }
      return res;
    });
  }

  /**
   * Check the DFDElement (node of data flow) of matching type
   * @param typeIDs list of matching stencil type IDs
   * @param element DFD element to check
   * @returns true if no correct typeID was provided, stencil types matches, or if provided typeID is a default type and element is part of this group
   */
  private isCorrectNodeType (typeIDs: ITypeIDs, element: DFDElement): boolean {
    if (typeIDs.TypeIDs == null || typeIDs.TypeIDs.length == 0) return true;
    let res = false;
    typeIDs.TypeIDs.forEach(id => {
      let stencil = this.dataService.Config.GetStencilType(id);
      if (stencil.IsDefault) res = res || element.Type.ElementTypeID == stencil.ElementTypeID; 
      else res = res || stencil.ID == element.Type.ID;
    });
    return res;
  };

  public static EvalProp(property: IPropertyRestriction, ele: DatabaseBase) {
    if (!property.ID || !ele) return false;
    let val = ele.GetProperty(property.ID);
    switch (property.ComparisonType) {
      case PropertyComparisonTypes.Equals: return val == property.Value;
      case PropertyComparisonTypes.EqualsNot: return val != property.Value;
      case PropertyComparisonTypes.GreaterThan: return val >= property.Value;
      case PropertyComparisonTypes.LessThan: return val <= property.Value;
      case PropertyComparisonTypes.GreaterThanOrEquals: return val >= property.Value;
      case PropertyComparisonTypes.LessThanOrEquals: return val <= property.Value;
    }
  }
}
