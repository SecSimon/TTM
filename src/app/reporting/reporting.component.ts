import { Component, ComponentRef, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { DataService } from '../util/data.service';
import { DialogService } from '../util/dialog.service';
import { ThemeService } from '../util/theme.service';

import { ProjectFile } from '../model/project-file';
import { TTMService } from '../util/ttm.service';

import { CtxDiagram, Diagram, DiagramTypes } from '../model/diagram';
import { CtxCanvas, HWDFCanvas } from '../modeling/diagram/diagram.component';

import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { LocalStorageService, LocStorageKeys } from '../util/local-storage.service';
import { NodeTypes } from '../modeling/modeling.component';
import { ResizedEvent } from 'angular-resize-event';
import { DeviceAssetsComponent } from '../modeling/device-assets/device-assets.component';
import { StackComponent } from '../modeling/stack/stack.component';
import { AssetGroup, LowMediumHighNumberUtil } from '../model/assets';
import { ImpactCategoryUtil, RiskStrategyUtil, AttackScenario, ThreatSeverityUtil, ThreatStateUtil, ThreatStates } from '../model/threat-model';
import { DatabaseBase } from '../model/database';
import { Countermeasure, MitigationProcessStateUtil, MitigationStates, MitigationStateUtil } from '../model/mitigations';
import { ResultsChartComponent } from '../dashboard/results-chart/results-chart.component';
import { ResultsAnalysisComponent } from '../dashboard/results-analysis/results-analysis.component';

import { 
  AlignmentType,
  Document, ExternalHyperlink, HeadingLevel,
  ImageRun, Packer,
  Paragraph,
  Table,
  TableBorders,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign
} from 'docx';

import html2canvas from 'html2canvas';
import { ExportTemplate } from '../model/export-template';
import { CvssEntryComponent } from '../shared/components/cvss-entry/cvss-entry.component';
import { OwaspRREntryComponent } from '../shared/components/owasp-rr-entry/owasp-rr-entry.component';
import { CapecEntryComponent } from '../shared/components/capec-entry/capec-entry.component';
import { CweEntryComponent } from '../shared/components/cwe-entry/cwe-entry.component';
import { StringExtension } from '../util/string-extension';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss']
})
export class ReportingComponent implements OnInit {

  private readonly docWidth = 793;
  private htmlBuffer: HTMLElement[] = [];
  private docxBuffer = [];

  @ViewChild('reportcontent') public content: ElementRef;

  public IsReportGenerated: boolean = false;
  public IsReportGenerating: boolean = false;

  public get ShowCharts(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.PAGE_REPORTING_SHOW_CHARTS);
    return res == 'true';
  };
  public set ShowCharts(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_REPORTING_SHOW_CHARTS, String(val));
  }

  public get DiagramShowGrid(): boolean {
    let res = this.locStorage.Get(LocStorageKeys.PAGE_REPORTING_DIAGRAM_SHOW_GRID);
    return res == 'true';
  };
  public set DiagramShowGrid(val: boolean) {
    this.locStorage.Set(LocStorageKeys.PAGE_REPORTING_DIAGRAM_SHOW_GRID, String(val));
  }

  public Project: ProjectFile;
  public Dia: CtxCanvas|HWDFCanvas;

  public get exportTemplates(): ExportTemplate[] { return this.dataService.Project.GetExportTemplates(); }

  public selectedExportTemplate: ExportTemplate = null;

  constructor(public theme: ThemeService, public dataService: DataService, public ttmService: TTMService, private translate: TranslateService,
    public dialog: DialogService, private router: Router, private http: HttpClient, private locStorage: LocalStorageService, private viewContainerRef: ViewContainerRef) { 
      if (!this.dataService.Project) {
        this.router.navigate(['/home'], {
          queryParams: { origin: 'reporting' }
        });
      } 
    }

  ngOnInit(): void {
    this.Project = this.dataService.Project;
  }

  public async GenerateReport() {
    this.IsReportGenerating = true;
    await this.initializeReportHTML();
    this.initializeReportDOCX().then(async () => {
      // Executive Summary
      this.createHeading(this.translate.instant('report.ExecutiveSummary'));
      this.createParagraph(StringExtension.Format(this.translate.instant('report.SUC'), this.Project.GetDevices().map(x => x.Name).join(', '), this.Project.GetMobileApps().map(x => x.Name).join(', ')));
      this.createParagraph(StringExtension.Format(this.translate.instant('report.UseCaseUC'), this.Project.GetDFDiagrams().map(x => x.Name).join(', ')));
      this.createParagraph('');
      this.createParagraph(this.translate.instant('report.IdentifiedSystemThreats') + ': ');
      this.createUL(this.Project.GetSystemThreats().map(x => x.Name));

      this.createParagraph('');
      this.createParagraph(StringExtension.Format(this.translate.instant('report.scenariosAndMeasures'), this.Project.GetAttackScenariosApplicable().length.toString(), this.Project.GetCountermeasuresApplicable().length.toString()));
      this.createParagraph('');
      // charts / tables
      let charts = [];
      let chartsData = [];
      this.Project.GetMyTagCharts().filter(x => x.MyTags.length > 0).forEach(chart => {
        charts.push(ResultsAnalysisComponent.CreateTagDiagram);
        chartsData.push(chart);
      });

      charts.push(...[ResultsAnalysisComponent.CreateThreatSummaryDiagram, ResultsAnalysisComponent.CreateRiskSummaryDiagram, ResultsAnalysisComponent.CreateThreatPerTypeDiagram, ResultsAnalysisComponent.CreateThreatPerLifecycleDiagram, ResultsAnalysisComponent.CreateThreatPerImpactCatDiagram, ResultsAnalysisComponent.CreateCountermeasureSummaryDiagram]);
      chartsData.push(...[null, null, null, null, null, null]);
      for (let i = 0; i < charts.length; i++) {
        const diaData = charts[i](this.Project, this.translate, false, false, 600, 400, chartsData[i]);
        if (this.ShowCharts) {
          let resultsComp = this.viewContainerRef.createComponent(ResultsChartComponent);
          resultsComp.instance.elRef.nativeElement.style.color = 'black';
          resultsComp.instance.diagram = diaData;

          await new Promise<void>(resolve => setTimeout(() => {
            let removeRec = (ele: HTMLElement) => {
              ele.classList.remove('chartDark');
              Array.from(ele.children).forEach(x => removeRec(x as HTMLElement));
            };
            removeRec(resultsComp.instance.elRef.nativeElement as HTMLElement);
            resolve();
          }, 10));
          let res = this.getComponentImage(resultsComp, 600, [0, 0, 0, 0]);
          await res.then((img) => {
            this.createImage(img[0], img[1], img[2]);
          });
        }
        else {
          let rows = [];
          diaData.results.forEach(row => {
            rows.push([row.name, ...row.series.map(x => x.value)]);
          });
          this.createTable([diaData.xAxisLabel, ...diaData.results[0].series.map(x => x.name)], rows);
          this.createParagraph('');
        }
      }

      // System threats and their attack scenariso
      if (this.Project.GetSystemThreats().length > 0) {
        this.createSubHeading(this.translate.instant('report.RiskOfSystemThreats'));
        this.createParagraph(this.translate.instant('report.systemThreatsExplanation'));
        this.createParagraph('');
        const scenarios = this.Project.GetAttackScenariosApplicable();
        this.Project.GetSystemThreats().forEach(threat => {
          const scens = scenarios.filter(x => x.SystemThreats.includes(threat));
          scens.sort((a, b) => {
            if (a.Risk >= 0 && b.Risk >= 0) return Number(a.Risk) > Number(b.Risk) ? -1 : (Number(a.Risk) == Number(b.Risk) ? 0 : 1);
            if (a.Risk) return -1;
            return 1;
          });
          if (scens.length > 0) {
            const risks = scens.map(x => x.Risk).filter(x => x == x);
            const maxRisk = Math.max(...risks.map(x => Number(x)));
            const risk = this.translate.instant(maxRisk > 0 ? LowMediumHighNumberUtil.ToString(maxRisk) : 'report.UnknownRisk');
            this.createParagraph(threat.Name + ' - ' + this.translate.instant('properties.Risk') + ': ' + risk);
            const items = [];
            scens.forEach(s => {
              const descs = [];
              if (s.ScoreCVSS && s.ScoreCVSS.Score > 0) descs.push(this.translate.instant('report.CvssScore') + ': ' + s.ScoreCVSS.Score.toFixed(1));
              if (s.ScoreOwaspRR && s.ScoreOwaspRR.Score > 0) descs.push(this.translate.instant('report.OwaspRRScore') + ': ' + s.ScoreOwaspRR.Score.toFixed(1));
              if (s.Risk) descs.push(this.translate.instant('properties.Risk') + ': ' + this.translate.instant(LowMediumHighNumberUtil.ToString(s.Risk)));
              items.push(s.GetLongName() + ': ' + descs.join(', '));
            });
            this.createUL(items);
          }
          else {
            this.createParagraph(threat.Name + ' - ' + this.translate.instant('report.UnknownRisk'));
          }
          
          this.createParagraph('');
        });
      }

      // Detailed Results
      const printSenariosAndMeasures = (viewID: string) => {
        const as = this.Project.GetAttackScenariosApplicable().filter(x => x.ViewID == viewID);
        as.sort((a, b) => {
          if (a.Risk >= 0 && b.Risk >= 0) return Number(a.Risk) > Number(b.Risk) ? -1 : (Number(a.Risk) == Number(b.Risk) ? 0 : 1);
          if (a.Risk) return -1;
          return 1;
        });

        if (as.length > 0) {
          this.createParagraph('');
          this.createBoldParagraph(this.translate.instant('general.AttackScenarios'))
          as.forEach(scenario => {
            this.createBoldParagraph(scenario.GetLongName());
            this.createParagraph(this.translate.instant('properties.Status') + ': ' + this.translate.instant(ThreatStateUtil.ToString(scenario.ThreatState)));
            if (scenario.Description?.length > 0) this.createParagraph(this.translate.instant('properties.Description') + ': ' + scenario.Description);
            if (scenario.SystemThreats?.length > 0) this.createParagraph(this.translate.instant('general.SystemThreats') + ': ' + scenario.SystemThreats.map(x => x.Name).join(', '));
            if (scenario.AttackVector?.AttackTechnique?.CAPECID) this.createLink(this.translate.instant('properties.CAPECID') + ': ' + scenario.AttackVector.AttackTechnique.CAPECID.toString(), CapecEntryComponent.GetURL(scenario.AttackVector.AttackTechnique.CAPECID));
            if (scenario.AttackVector?.Weakness?.CWEID) this.createLink(this.translate.instant('properties.CWEID') + ': ' + scenario.AttackVector.Weakness.CWEID.toString(), CweEntryComponent.GetURL(scenario.AttackVector.Weakness.CWEID));
            if (scenario.ScoreCVSS && scenario.ScoreCVSS.Score) {
              this.createParagraph(this.translate.instant('report.CvssScore') + ': ' + scenario.ScoreCVSS.Score.toFixed(1));
              this.createLink(this.translate.instant('report.CvssVector') + ': ' + CvssEntryComponent.GetVector(scenario.ScoreCVSS), CvssEntryComponent.GetURL(scenario.ScoreCVSS));
            }
            if (scenario.ScoreOwaspRR && scenario.ScoreOwaspRR.Score) {
              this.createParagraph(this.translate.instant('report.OwaspRRScore') + ': ' + scenario.ScoreOwaspRR.Score.toFixed(1));
              this.createLink(this.translate.instant('report.OwaspRRVector') + ': ' + OwaspRREntryComponent.GetVector(scenario.ScoreOwaspRR), OwaspRREntryComponent.GetURL(scenario.ScoreOwaspRR));
            }
            if (scenario.Severity) this.createParagraph(this.translate.instant('properties.Severity') + ': ' + this.translate.instant(ThreatSeverityUtil.ToString(scenario.Severity)));
            if (scenario.Likelihood) this.createParagraph(this.translate.instant('general.Likelihood') + ': ' + this.translate.instant(LowMediumHighNumberUtil.ToString(scenario.Likelihood)));
            if (scenario.Risk) this.createParagraph(this.translate.instant('properties.Risk') + ': ' + this.translate.instant(LowMediumHighNumberUtil.ToString(scenario.Risk)));
            if (scenario.RiskStrategy) this.createParagraph(this.translate.instant('properties.RiskStrategy') + ': ' + this.translate.instant(RiskStrategyUtil.ToString(scenario.RiskStrategy)));
            if (scenario.RiskStrategyReason?.length > 0) this.createParagraph(this.translate.instant('properties.RiskStrategyReason') + ': ' + scenario.RiskStrategyReason);
            if (scenario.GetCountermeasures()?.length > 0) this.createParagraph(this.translate.instant('general.Countermeasures') + ': ' + scenario.GetCountermeasures().map(x => x.GetLongName()).join(', '));
            if (scenario.MyTags.length > 0) this.createParagraph(this.translate.instant('general.Tags') + ': ' + scenario.MyTags.map(x => x.Name).join(', '));
            this.createParagraph('');
          });
        }

        const cms = this.Project.GetCountermeasuresApplicable().filter(x => x.ViewID == viewID);
        if (cms.length > 0) {
          this.createParagraph('');
          this.createBoldParagraph(this.translate.instant('general.Countermeasures'))
          cms.forEach(cm => {
            this.createBoldParagraph(cm.GetLongName());
            if (cm.MitigationState) this.createParagraph(this.translate.instant('properties.Status') + ': ' + this.translate.instant(MitigationStateUtil.ToString(cm.MitigationState)));
            if (cm.Description?.length > 0) this.createParagraph(this.translate.instant('properties.Description') + ': ' + cm.Description);
            if (cm.MitigationProcess) this.createParagraph(this.translate.instant('general.MitigationProcess') + ': ' + cm.MitigationProcess.GetLongName());
            this.createParagraph(this.translate.instant('pages.modeling.countermeasure.mitigatedThreats') + ': ' + cm.AttackScenarios.map(x => x.GetLongName()).join(', '));
            if (cm.MyTags.length > 0) this.createParagraph(this.translate.instant('general.Tags') + ': ' + cm.MyTags.map(x => x.Name).join(', '));
            this.createParagraph('');
          });
        }
      };

      this.createParagraph('');
      this.createHeading(this.translate.instant('report.DetailedResults'));
      // All steps
      this.createSubHeading(this.ttmService.Stages[0].steps[0].name);
      this.Project.GetCharScope().StepProperties.forEach(prop => {
        if (this.Project.GetCharScope()[prop].length > 0) {
          this.createSubSubHeading(this.translate.instant('pages.modeling.charscope.' + prop));
          this.createUL(this.Project.GetCharScope()[prop]);
        }
      });
      this.createSubHeading(this.ttmService.Stages[0].steps[1].name);
      this.Project.GetObjImpact().StepProperties.forEach(prop => {
        if (this.Project.GetObjImpact()[prop].length > 0) {
          this.createSubSubHeading(this.translate.instant('pages.modeling.objimpact.' + prop));
          this.createUL(this.Project.GetObjImpact()[prop]);
        }
      });

      this.createSubHeading(this.ttmService.Stages[0].steps[2].name);
      this.createSubSubHeading(this.translate.instant('report.SysInterationDia'));
      this.createDiagram(this.Project.GetSysContext().ContextDiagram);
      printSenariosAndMeasures(this.Project.GetSysContext().ContextDiagram.ID);
      this.createSubSubHeading(this.translate.instant('report.UseCaseDia'));
      this.createDiagram(this.Project.GetSysContext().UseCaseDiagram);
      printSenariosAndMeasures(this.Project.GetSysContext().UseCaseDiagram.ID);

      // asset identification
      this.createSubHeading(this.ttmService.Stages[0].steps[3].name);
      let assets: [string, AssetGroup][] = [['Assets', this.Project.GetProjectAssetGroup()]];
      this.Project.GetDevices().forEach(x => assets.push([x.Name, x.AssetGroup]));
      this.Project.GetMobileApps().forEach(x => assets.push([x.Name, x.AssetGroup]));
      assets = assets.filter(x => x[1] != null);
      for (let i = 0; i < assets.length; i++) {
        if (assets[i][1].IsActive) {
          this.createSubSubHeading(assets[i][0]);
          const assetComp = this.viewContainerRef.createComponent(DeviceAssetsComponent);
          assetComp.instance.assetGroup = assets[i][1];
          assetComp.instance.hideButtons = true;
          assetComp.instance.elRef.nativeElement.style.color = 'black';
          await new Promise<void>(resolve => setTimeout(() => {
            let removeRec = (ele: HTMLElement) => {
              if (ele.classList.contains('assetColumn')) {
                ele.style.backgroundColor = '#e7e5e5';
              }
              if (ele.tagName == 'path') {
                ele.setAttribute('fill', '#e7e5e5');
              }
              Array.from(ele.children).forEach(x => removeRec(x as HTMLElement));
            };
            removeRec(assetComp.instance.elRef.nativeElement as HTMLElement);
            resolve();
          }, 10));
          let res = this.getComponentImage(assetComp, this.docWidth, [0, 25, 0, 0]);
          await res.then((img) => {
            this.createImage(img[0], img[1], img[2]);
          });
        }
      }

      // threat sources
      this.createSubHeading(this.translate.instant('general.ThreatSources'));
      this.Project.GetThreatSources().Sources.forEach(src => {
        this.createBoldParagraph(src.Name);
        if (src.Motive.length > 0) {
          this.createParagraph(this.translate.instant('properties.Motive') + ':');
          this.createUL(src.Motive);
        }
        this.createParagraph(this.translate.instant('general.Likelihood') + ': ' + this.translate.instant(LowMediumHighNumberUtil.ToString(src.Likelihood)));
        this.createParagraph('');
      });

      // system threats
      this.createSubHeading(this.translate.instant('general.SystemThreats'));
      this.Project.GetSystemThreats().forEach(threat => {
        this.createBoldParagraph(threat.Name);
        if (threat.ThreatCategory) this.createParagraph(this.translate.instant('general.ThreatCategory') + ': ' + threat.ThreatCategory.Name);
        if (threat.Description?.length > 0) this.createParagraph(this.translate.instant('properties.consequencesImpact') + ': ' + threat.Description);
        if (threat.AffectedAssetObjects?.length > 0) this.createParagraph(this.translate.instant('report.AffectedAssets') + ': ' + threat.AffectedAssetObjects.map(x => x.Name).join(', '));
        this.createParagraph(this.translate.instant('properties.Impact') + ': ' + this.translate.instant(LowMediumHighNumberUtil.ToString(threat.Impact)) + ' (' +  threat.ImpactCats.map(x => this.translate.instant(ImpactCategoryUtil.ToString(x))).join(', ') + ')');
        this.createParagraph('');
      });

      // models
      // hardware
      this.createSubHeading(this.ttmService.Stages[1].steps[1].name);
      this.Project.GetDevices().forEach(x => {
        this.createSubSubHeading(x.Name);
        this.createDiagram(x.HardwareDiagram);
        printSenariosAndMeasures(x.HardwareDiagram.ID);
      });

      // software
      this.createSubHeading(this.ttmService.Stages[1].steps[2].name);
      let stacks = [...this.Project.GetDevices(), ...this.Project.GetMobileApps()];
      for (let i = 0; i < stacks.length; i++) {
        if (stacks[i].SoftwareStack?.GetChildrenFlat().length > 0) {
          this.createSubSubHeading(stacks[i].Name);
          const stackComp = this.viewContainerRef.createComponent(StackComponent);
          stackComp.instance.stack = stacks[i].SoftwareStack;
          stackComp.instance.elRef.nativeElement.style.color = 'black';
          await new Promise<void>(resolve => setTimeout(() => {
            let removeRec = (ele: HTMLElement) => {
              if (ele.classList.contains('component-dark')) {
                ele.style.borderColor = 'black';
                ele.classList.remove('component-dark');
              }
              Array.from(ele.children).forEach(x => removeRec(x as HTMLElement));
            };
            removeRec(stackComp.instance.elRef.nativeElement as HTMLElement);
            resolve();
          }, 10));
          
          let res = this.getComponentImage(stackComp, this.docWidth, [20, 50, 0, 25]);
          await res.then((img) => {
            this.createImage(img[0], img[1], img[2]);
            printSenariosAndMeasures(stacks[i].SoftwareStack.ID);
          });
        }
      }

      // data flows
      this.createSubHeading(this.ttmService.Stages[1].steps[3].name);
      this.Project.GetHWDFDiagrams().filter(x => x.DiagramType == DiagramTypes.DataFlow).forEach(x => {
        this.createSubSubHeading(x.Name);
        this.createDiagram(x);
        printSenariosAndMeasures(x.ID);
      });

      // processes
      this.createSubHeading(this.ttmService.Stages[1].steps[4].name);
      for (let i = 0; i < stacks.length; i++) {
        if (stacks[i].ProcessStack?.GetChildrenFlat().length > 0) {
          this.createSubSubHeading(stacks[i].Name);
          const stackComp = this.viewContainerRef.createComponent(StackComponent);
          stackComp.instance.stack = stacks[i].ProcessStack;
          stackComp.instance.elRef.nativeElement.style.color = 'black';
          await new Promise<void>(resolve => setTimeout(() => {
            let removeRec = (ele: HTMLElement) => {
              if (ele.classList.contains('component-dark')) {
                ele.style.borderColor = 'black';
                ele.classList.remove('component-dark');
              }
              Array.from(ele.children).forEach(x => removeRec(x as HTMLElement));
            };
            removeRec(stackComp.instance.elRef.nativeElement as HTMLElement);
            resolve();
          }, 10));
          
          let res = this.getComponentImage(stackComp, this.docWidth, [20, 50, 0, 25]);
          await res.then((img) => {
            this.createImage(img[0], img[1], img[2]);
            printSenariosAndMeasures(stacks[i].ProcessStack.ID);
          });
        }
      }

      this.createSubHeading(this.translate.instant('general.MitigationProcesses'));
      this.createParagraph(this.translate.instant('report.mitigationProcessExplanation'));
      this.createParagraph('');
      this.Project.GetMitigationProcesses().forEach(process => {
        this.createBoldParagraph(process.GetLongName());
        if (process.MitigationProcessState) this.createParagraph(this.translate.instant('properties.Status') + ': ' + this.translate.instant(MitigationProcessStateUtil.ToString(process.MitigationProcessState)) + ' (' + this.translate.instant('general.Progress') + ': ' + process.Progress.toFixed(0) +  '%)');
        if (process.Description?.length > 0) this.createParagraph(this.translate.instant('properties.Description') + ': ' + process.Description);
        if (process.Tasks?.length > 0) {
          this.createParagraph(this.translate.instant('general.Tasks'));
          this.createUL(process.Tasks.map(x => (x.IsChecked ? this.translate.instant('general.Done') : this.translate.instant('general.DoneNot')) + ': ' + x.Note));
        }
        if (process.Notes?.length > 0) {
          this.createParagraph(this.translate.instant('general.Notes'));
          this.createUL(process.Notes.map(x => new Date(Number(x.Date)).toLocaleDateString() + ' - ' + x.Author + ': ' + x.Note));
        }
        if (process.Countermeasures.length > 0) {
          this.createParagraph(this.translate.instant('general.Countermeasures') + ': ' + process.Countermeasures.map(x => x.GetLongName()).join(', '));
        }
        this.createParagraph('');
      });

      // finish: remove old HTML report
      Array.from((this.content.nativeElement as HTMLDivElement).children).forEach(x => (this.content.nativeElement as HTMLDivElement).removeChild(x));
      this.htmlBuffer.forEach(x => (this.content.nativeElement as HTMLDivElement).appendChild(x));
  
      this.IsReportGenerated = true;
      this.IsReportGenerating = false;
    });
  }

  public SaveHTML() {
    let res = '<!DOCTYPE html>\n<html>\n<head><title>' + 'TTModeler Report: ' + this.Project.GetProjectName() + '</title></head><body>';
    res += this.content.nativeElement.innerHTML;
    res += '</body></html>';
    const blob = new Blob([res]);
    saveAs(blob, this.Project.Name.replace('.ttmp', '.html'));
  }

  public SaveDOCX() {
    const doc = new Document({
      creator: this.dataService.UserDisplayName,
      description: this.dataService.Project.Description,
      title: this.dataService.Project.GetProjectName(),
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
            }
          },
          heading1: {
            paragraph: {
              spacing: {
                before: 120
              }
            }
          },
          heading2: {
            paragraph: {
              spacing: {
                before: 120
              }
            }
          },
          heading3: {
            paragraph: {
              spacing: {
                before: 120
              }
            }
          }
        }
      },
      sections: [
        {
          children: this.docxBuffer
        }
      ]
    });

    Packer.toBuffer(doc).then((buffer) => {
      const blob = new Blob([buffer]);
      saveAs(blob, this.Project.Name.replace('.ttmp', '.docx'));
    });
  }

  public AddTemplate() {
    this.selectedExportTemplate = this.dataService.Project.CreateExportTemplate();
  }

  public DeleteTemplate(template) {
    this.dialog.OpenDeleteObjectDialog(template).subscribe(res => {
      if (res) {
        if (template == this.selectedExportTemplate) this.selectedExportTemplate = null;
        this.dataService.Project.DeleteExportTemplate(template);
      }
    });
  }

  private initializeReportHTML() {
    return new Promise<void>((resolve) => {
      this.readFile('./assets/icons/favicon.192x192.png').then(img => {
        const title = this.createHtmlTitle('TTModeler Report ');
        const titleImg = document.createElement('img');
        titleImg.src = img;
        titleImg.style.width = '50px';
        titleImg.style.marginLeft = '20px';
        titleImg.style.verticalAlign = 'middle';
        titleImg.alt = 'logo';
        title.appendChild(titleImg);
        this.htmlBuffer = [title];
        this.htmlBuffer.push(this.createHtmlParagraph(this.translate.instant('report.for')));
        this.htmlBuffer.push(this.createHtmlTitle(this.Project.GetProjectName()));
        this.htmlBuffer.push(this.createHtmlParagraph(new Date().toLocaleDateString() + ', Version ' + this.Project.UserVersion));
        resolve();
      });
    });
  }

  private initializeReportDOCX() {
    return new Promise<void>((resolve) => {
      this.readFile('./assets/icons/favicon.192x192.png').then(img => {
        this.docxBuffer = [
          new Paragraph({ 
            text: 'TTModeler Report     ',
            heading: HeadingLevel.TITLE,
            children: [
              new ImageRun({
                data: img,
                transformation: {
                  width: 50,
                  height: 50
                }
              })
            ]
          }),
          this.createDocxParagraph(this.translate.instant('report.for')),
          this.createDocxTitle(this.Project.GetProjectName()),
          this.createParagraph(''),
          this.createDocxParagraph(this.GetDate().toLocaleDateString() + ', ' + 'Version ' + this.Project.UserVersion),
          this.createParagraph('')
        ];

        resolve();
      });
    });
  }

  private createUL(items: string[]) {
    this.createDocxUL(items);
    this.createHtmlUL(items);
  }

  private createDocxUL(items: string[]) {
    items.forEach(x => {
      const li = new Paragraph({
        text: x,
        bullet: {
          level: 0
        }
      });
      this.docxBuffer.push(li);
    });
  }

  private createHtmlUL(items: string[]) {
    const ul = document.createElement('ul');
    items.forEach(x => {
      ul.appendChild(this.createHtmlElement('li', x));
    });
    this.htmlBuffer.push(ul);
  }

  private createTitle(text: string) {
    this.docxBuffer.push(this.createDocxTitle(text));
    this.htmlBuffer.push(this.createHtmlTitle(text));
  }

  private createDocxTitle(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.TITLE
    });
  }

  private createHtmlTitle(text: string): HTMLElement {
    return this.createHtmlElement('h1', text);
  }

  private createHeading(text: string) {
    this.docxBuffer.push(this.createDocxHeading(text));
    this.htmlBuffer.push(this.createHtmlHeading(text));
  }

  private createDocxHeading(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_1
    });
  }

  private createHtmlHeading(text: string): HTMLElement {
    return this.createHtmlElement('h2', text);
  }

  private createSubHeading(text: string) {
    this.docxBuffer.push(this.createDocxSubHeading(text));
    this.htmlBuffer.push(this.createHtmlSubHeading(text));
  }

  private createDocxSubHeading(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_2
    });
  }

  private createHtmlSubHeading(text: string): HTMLElement {
    return this.createHtmlElement('h3', text);
  }

  private createSubSubHeading(text: string) {
    this.docxBuffer.push(this.createDocxSubSubHeading(text));
    this.htmlBuffer.push(this.createHtmlSubSubHeading(text));
  }

  private createDocxSubSubHeading(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_3
    });
  }

  private createHtmlSubSubHeading(text: string): HTMLElement {
    return this.createHtmlElement('h4', text);
  }

  private createParagraph(text: string) {
    this.docxBuffer.push(this.createDocxParagraph(text));
    this.htmlBuffer.push(this.createHtmlParagraph(text));
  }

  private createDocxParagraph(text: string): Paragraph {
    return new Paragraph({
      text: text
    });
  }

  private createHtmlParagraph(text: string): HTMLElement {
    return this.createHtmlElement('p', text);
  }

  private createBoldParagraph(text: string) {
    this.docxBuffer.push(this.createDocxBoldParagraph(text));
    this.htmlBuffer.push(this.createHtmlBoldParagraph(text));
  }

  private createDocxBoldParagraph(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true
        })
      ]
    });
  }

  private createHtmlBoldParagraph(text: string): HTMLElement {
    const bold = this.createHtmlElement('strong', text);
    const p = document.createElement('p');
    p.appendChild(bold);
    return p;
  }

  private createLink(text: string, url: string) {
    this.docxBuffer.push(this.createDocxLink(text, url));
    this.htmlBuffer.push(this.createHtmlLink(text, url));
  }

  private createDocxLink(text: string, url: string): Paragraph {
    return new Paragraph({
      children: [
        new ExternalHyperlink({
            children: [
                new TextRun({
                    text: text,
                    style: "Hyperlink",
                }),
            ],
            link: url,
        }),
    ]
    });
  }

  private createHtmlLink(text: string, url: string): HTMLElement {
    const a = this.createHtmlElement('a', text) as HTMLAnchorElement;  
    a.href = url;
    a.target = '_blank';
    return a;
  }

  private createTable(th: string[], rows: string[][]) {
    this.docxBuffer.push(this.createDocxTable(th, rows));
    this.htmlBuffer.push(this.createHTMLTable(th, rows));
  }

  private createDocxTable(th: string[], rows: string[][]) {
    const rs = [];
    let tr = new TableRow({
      children: [],
    });
    th.forEach(x => {
      tr.addChildElement(new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: x.toString(),
                bold: true
              })
            ],
            alignment: x == th[0] ? AlignmentType.LEFT : AlignmentType.CENTER
          })
        ],
        verticalAlign: VerticalAlign.CENTER
      }));
    });
    rs.push(tr);
    rows.forEach(row => {
      tr = new TableRow({
        children: []
      });
      row.forEach(x => {
        tr.addChildElement(new TableCell({
          children: [
            new Paragraph({
              text: x.toString(),
              alignment: x == row[0] ? AlignmentType.LEFT : AlignmentType.CENTER
            })
          ],
        }));
      });
      rs.push(tr);
    });

    const table = new Table({
      rows: rs,
      borders: TableBorders.NONE
    });

    return table;
  }

  private createHTMLTable(th: string[], rows: string[][]) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    let tr = document.createElement('tr');
    th.forEach(x => tr.appendChild(this.createHtmlElement('th', x)));
    (tr.children.item(0) as HTMLTableCellElement).style.textAlign = 'left';
    Array.from(tr.children).filter((u, i) => i >= 1).forEach(x => {
      (x as HTMLTableCellElement).style.padding = '0 5px';
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      tr = document.createElement('tr');
      row.forEach(x => tr.appendChild(this.createHtmlElement('td', x)));
      Array.from(tr.children).filter((u, i) => i >= 1).forEach(x => {
        const c = x as HTMLTableCellElement;
        c.style.textAlign = 'center';
        c.style.padding = '0 5px';
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  private createImage(src: string, width: number, height: number) {
    this.docxBuffer.push(this.createDocxImage(src, width, height));
    this.htmlBuffer.push(this.createHtmlImage(src));
  }

  private createDocxImage(src: string, width: number, height: number) {
    const maxWidth = 600;
    const scale = maxWidth > width ? 1 : maxWidth / width;
    return new Paragraph({
      children: [
        new ImageRun({
          data: src,
          transformation: {
            width: width * scale,
            height: height * scale
          }
        })
      ],
      alignment: AlignmentType.CENTER
    });
  }

  private createHtmlImage(src: string) {
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.src = src;
    div.appendChild(img);
    div.style.textAlign = 'center';
    return div;
  }

  private async getComponentImage(ref: ComponentRef<any>, width: number, crop: number[]) {
    const div = document.createElement('div');
    div.appendChild(ref.instance.elRef.nativeElement);
    div.style.width = width.toString() + 'px';
    document.body.appendChild(div);

    const res = await new Promise<any[]>(resolve => setTimeout(() => {
      html2canvas(ref.instance.elRef.nativeElement, { allowTaint: true }).then((canvas) => {
        let res = canvas.toDataURL('image/png');
        const img = new Image();
        img.src = res;

        let cropImg = (img) => {
          const croppedCanvas = document.createElement('canvas');
          const context = croppedCanvas.getContext('2d');
          croppedCanvas.width = canvas.width - (crop[0] + crop[2]);
          croppedCanvas.height = canvas.height - (crop[1] + crop[3]);
          context.drawImage(img, crop[0], crop[1], canvas.width-crop[0]-crop[2], canvas.height-crop[1]-crop[3], 0, 0, croppedCanvas.width, croppedCanvas.height);
          return [croppedCanvas.toDataURL(), croppedCanvas.width, croppedCanvas.height];
        };
        img.onload = () => {
          let croppedURL = cropImg(img);
          document.body.removeChild(div);
          resolve(croppedURL);
        }
      });
    }, 10));

    return res;
  }

  private createDiagram(diagram: Diagram) {
    const img = this.getDiagramImage(diagram);
    this.docxBuffer.push(this.createDocxDiagram(img[0], img[1], img[2]));
    this.htmlBuffer.push(this.createHtmlDiagram(img[0]));
  }

  private createDocxDiagram(image: string, width: number, height: number) {
    const maxWidth = 600;
    const scale = maxWidth > width ? 1 : maxWidth / width;
    return new Paragraph({
      children: [
        new ImageRun({
          data: image,
          transformation: {
            width: width * scale,
            height: height * scale
          }
        })
      ]
    });
  }

  private createHtmlDiagram(image: string) {
    const img = document.createElement('img');
    img.src = image;
    img.style.maxWidth = this.docWidth.toString() + 'px';
    return img;
  }

  private getDiagramImage(diagramOrig: Diagram): any[] {
    // work with copy of diagram
    const diagram = Diagram.FromJSON(JSON.parse(JSON.stringify(diagramOrig.ToJSON())), this.Project, this.Project.Config);
    const width = this.docWidth;
    const height = 500;
    const div = document.createElement('div');
    div.style.width = width.toString() + 'px';
    div.style.height = height.toString() + 'px';
    div.style.pointerEvents = 'none';
    let event = new ResizedEvent(new DOMRectReadOnly(0, 0, width, height), null);
    if (diagram instanceof CtxDiagram) this.Dia = new CtxCanvas(diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate, diagram.IsUseCaseDiagram ? NodeTypes.UseCase : NodeTypes.Context);
    else this.Dia = new HWDFCanvas(diagram, this.dataService, this.theme, this.dialog, this.locStorage, this.translate);
    this.Dia.OnResized(event, div);
    this.Dia.PrintMode(this.DiagramShowGrid);
    const size = this.Dia.FitToCanvas(width);
    event = new ResizedEvent(new DOMRectReadOnly(0, 0, width, size[1]+10), null);
    div.style.height = size[1].toString() + 'px';
    this.Dia.OnResized(event, div, false);

    return [this.Dia.GetImage(), width, size[1]];
  }

  private createHtmlElement(tag: string, textContent: string): HTMLElement {
    const element = document.createElement(tag);
    element.textContent = textContent;
    return element;
  }

  private readFile(path: string) {
    return new Promise<string>((resolve, reject) => {
      this.http.get(path, { responseType: 'blob' }).subscribe(res => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result?.toString());
        }
  
        reader.readAsDataURL(res);
      });
    });
  }

  public GetDate() {
    return new Date();
  }
}
