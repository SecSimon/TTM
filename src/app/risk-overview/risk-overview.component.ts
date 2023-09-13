import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { INavigationNode } from '../shared/components/nav-tree/nav-tree.component';
import { ThemeService } from '../util/theme.service';
import { DataService } from '../util/data.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../util/dialog.service';
import { LocStorageKeys, LocalStorageService } from '../util/local-storage.service';
import { SideNavBase } from '../shared/components/side-nav/side-nav-base';
import { Router } from '@angular/router';
import { NavTreeBase } from '../shared/components/nav-tree/nav-tree-base';
import { DatabaseBase } from '../model/database';
import { AttackScenario, ThreatSeverities, ThreatSeverityUtil, ThreatStateUtil, ThreatStates } from '../model/threat-model';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LowMediumHighNumber, LowMediumHighNumberUtil } from '../model/assets';
import { CvssEntryComponent } from '../shared/components/cvss-entry/cvss-entry.component';
import { OwaspRREntryComponent } from '../shared/components/owasp-rr-entry/owasp-rr-entry.component';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-risk-overview',
  templateUrl: './risk-overview.component.html',
  styleUrls: ['./risk-overview.component.scss']
})
export class RiskOverviewComponent extends SideNavBase implements AfterViewInit {
  private nodes: INavigationNode[];
  private _selectedNode: INavigationNode;
  private _attackScenarios: AttackScenario[] = [];
  private _selectedScenarios: AttackScenario[] = [];
  private _sortScenarios: MatSort;

  public get selectedNode(): INavigationNode { return this._selectedNode; }
  public set selectedNode(val: INavigationNode) {
    this._selectedNode = val;
    this.AttackScenarios = [];
    if (val) {
      const res = [];
      const checkForAS = (node: INavigationNode) => {
        if (node.data instanceof AttackScenario) res.push(node.data);
        else if (node.children) node.children.forEach(x => checkForAS(x));
      };
      checkForAS(val);
      this.AttackScenarios = res;
    }
  }

  public get sortScenarios(): MatSort { return this._sortScenarios; }
  @ViewChild('scenariotable') set sortScenarios(val: MatSort) { 
    this._sortScenarios = val;
    if (this.dataSourceScenarios) this.dataSourceScenarios.sort = val;
  }
  @ViewChild(MatMenuTrigger) public matMenuTrigger: MatMenuTrigger; 
  public menuTopLeftPosition =  {x: '0', y: '0'};

  public displayedScenarioColumns = [];
  public dataSourceScenarios: MatTableDataSource<AttackScenario>;

  public get AttackScenarios(): AttackScenario[] { return this._attackScenarios; }
  public set AttackScenarios(val: AttackScenario[]) {
    this._attackScenarios = val;
    const mySort = (data: AttackScenario, sortHeaderId: string) => {
      if (sortHeaderId == 'number') return Number(data.Number);
      if (sortHeaderId == 'name') return data.Name;
      if (sortHeaderId == 'elements') return this.GetTargets(data);
      if (sortHeaderId == 'view') return this.dataService.Project.GetView(data.ViewID).Name;
      if (sortHeaderId == 'severity') return data.Severity;
      if (sortHeaderId == 'cvssVector') return data.ScoreCVSS?.Vector;
      if (sortHeaderId == 'cvssScore') return data.ScoreCVSS?.Score;
      if (sortHeaderId == 'owaspVector') return this.GetOwaspRRVector(data);
      if (sortHeaderId == 'owaspScore') return data.ScoreOwaspRR?.Score;
      if (sortHeaderId == 'likelihood') return data.Likelihood;
      if (sortHeaderId == 'risk') return data.Risk;
      if (sortHeaderId == 'status') return data.ThreatState; 
      console.error('Missing sorting header', sortHeaderId); 
    };
    const myFilter = (data: AttackScenario, filter: string) => {
      let search = filter.trim().toLowerCase();
      let res = data.Name.toLowerCase().indexOf(search);
      if (res == -1) res = data.AttackVector?.Name.toLowerCase().indexOf(search);
      if (res == -1) res = this.GetTargets(data)?.toLowerCase().indexOf(search); 
      return (res != null && res != -1);
    };

    const cols = ['number', 'name', 'elements'];
    if ([...new Set(val.map(x => x.ViewID))].length > 1) cols.push('view');
    if (val.some(x => this.GetCvssVector(x) != null)) cols.push('cvssVector');
    if (val.some(x => x.ScoreCVSS && x.ScoreCVSS.Score)) cols.push('cvssScore');
    if (val.some(x => this.GetOwaspRRVector(x) != null)) cols.push('owaspVector');
    if (val.some(x => x.ScoreOwaspRR && x.ScoreOwaspRR.Score)) cols.push('owaspScore');
    cols.push(...['severity', 'likelihood', 'risk', 'status', 'more']);
    this.displayedScenarioColumns = cols;

    this.dataSourceScenarios = new MatTableDataSource(val);
    this.dataSourceScenarios.sort = this.sortScenarios;
    this.dataSourceScenarios.sortingDataAccessor = mySort;
    this.dataSourceScenarios.filterPredicate = myFilter;

    if (this.sortScenarios) this.sortScenarios.sortChange.emit(this.sortScenarios);
  }
  public get selectedScenarios(): AttackScenario[] { return this._selectedScenarios; }
  public set selectedScenarios(val: AttackScenario[]) {
    if (val.length == this._selectedScenarios.length) {
      if (val.every(x => this._selectedScenarios.some(y => y.ID == x.ID))) return;
    }
    this._selectedScenarios = val;
  }

  constructor(public theme: ThemeService, public dataService: DataService, private translate: TranslateService,
    private locStorage: LocalStorageService, private dialog: DialogService, private router: Router) { 
      super();
      if (!this.dataService.Project) {
        this.router.navigate(['/home'], {
          queryParams: { origin: 'risk' }
        });
      }
    }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createNodes();
      this.selectedNode = this.nodes[0];
    });
  }

  public ApplyScenarioFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceScenarios.filter = filterValue.trim().toLowerCase();
  }

  public OnScenarioDblClick(as: AttackScenario) {
    this.dialog.OpenAttackScenarioDialog(as, false, this.dataSourceScenarios.sortData(this.dataSourceScenarios.filteredData, this.sortScenarios));
  }

  public IsAttackScenario() {
    return this.selectedNode?.data instanceof AttackScenario;
  }

  public IsScenarioSelected(as: AttackScenario) {
    return this.selectedScenarios.includes(as);
  }

  public SelectScenario(as: AttackScenario) {
    this.selectedScenarios = [as];
  }

  public GetTargets(as: AttackScenario) {
    return as.Targets.filter(x => x).map(x => x.GetProperty('Name')).join(', ');
  }

  public GetViewName(as: AttackScenario) {
    return this.dataService.Project.GetView(as.ViewID)?.Name;
  }

  public GetCvssVector(as: AttackScenario) {
    if (as.ScoreCVSS){
      const vec = CvssEntryComponent.GetVector(as.ScoreCVSS);
      if (vec?.length > 8) return vec;
    } 
    return null;
  }

  public GetOwaspRRVector(as: AttackScenario) {
    if (as.ScoreOwaspRR){
      return OwaspRREntryComponent.GetVector(as.ScoreOwaspRR);
    } 
    return null;
  }

  public GetOwaspRRScore(as: AttackScenario) {
    if (as.ScoreOwaspRR?.Score) return ThreatSeverityUtil.ToString(as.ScoreOwaspRR.Score);
    return null;
  }

  public GetThreatStates() {
    return ThreatStateUtil.GetThreatStates();
  }

  public GetThreatStateName(ts: ThreatStates) {
    return ThreatStateUtil.ToString(ts);
  }

  public GetSeverityTypes() {
    return ThreatSeverityUtil.GetTypesDashboard();
  }

  public GetSeverityTypeName(sev: ThreatSeverities) {
    return ThreatSeverityUtil.ToString(sev);
  }

  public GetLMHValues() {
    return LowMediumHighNumberUtil.GetKeys();
  }

  public GetLMHName(type: LowMediumHighNumber) {
    return LowMediumHighNumberUtil.ToString(type);
  }

  public OpenContextMenu(event, entry) {
    event.preventDefault();

    this.menuTopLeftPosition.x = event.clientX + 'px'; 
    this.menuTopLeftPosition.y = event.clientY + 'px'; 

    this.matMenuTrigger.menuData = { item: entry }; 
    this.matMenuTrigger.openMenu(); 
  }

  public GetSplitSize(splitter: number, gutter: number, defaultSize: number) {
    let size = this.locStorage.Get(LocStorageKeys.PAGE_RISK_SPLIT_SIZE_X + splitter.toString());
    if (size != null) return Number(JSON.parse(size)[gutter]);
    return defaultSize;
  }

  public OnSplitSizeChange(event, splitter: number) {
    this.locStorage.Set(LocStorageKeys.PAGE_RISK_SPLIT_SIZE_X + splitter.toString(), JSON.stringify(event['sizes']));
  }

  public createNodes() {
    const prevNodes = this.nodes;
    this.nodes = [];
    const pf = this.dataService.Project;

    const createAS = (as: AttackScenario): INavigationNode => {
      const node: INavigationNode = {
        name: () => 'AS' + as.Number + ') ' + as.Name,
        canSelect: true,
        data: as
      };
      return node;
    };

    const root: INavigationNode = {
      name: () => this.translate.instant('general.RiskAssessment'),
      icon:'crisis_alert',
      canSelect: true,
      hasMenu: true,
      children: []
    };

    const views: DatabaseBase[] = [];
    if (pf.GetSysContext().ContextDiagram) views.push(pf.GetSysContext().ContextDiagram);
    if (pf.GetSysContext().UseCaseDiagram) views.push(pf.GetSysContext().UseCaseDiagram);
    pf.GetDevices().forEach(x => {
      if (x.HardwareDiagram) views.push(x.HardwareDiagram);
      if (x.SoftwareStack) views.push(x.SoftwareStack);
      if (x.ProcessStack) views.push(x.ProcessStack);
    });
    pf.GetMobileApps().forEach(x => {
      if (x.SoftwareStack) views.push(x.SoftwareStack);
      if (x.ProcessStack) views.push(x.ProcessStack);
    });
    pf.GetDFDiagrams().forEach(x => views.push(x));

    views.forEach(view => {
      const scenarios = pf.GetAttackScenariosApplicable().filter(x => x.ViewID == view.ID);
      if (scenarios.length > 0) {
        const dia: INavigationNode = {
          name: () => view.Name,
          canSelect: true,
          children: []
        };

        scenarios.forEach(x => dia.children.push(createAS(x)));

        root.children.push(dia);
      }
    });

    this.nodes.push(root);
    
    NavTreeBase.TransferExpandedState(prevNodes, this.nodes);
    this.navTree.SetNavTreeData(this.nodes);
  }
}
