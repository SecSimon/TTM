import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NodeTypes } from '../modeling/modeling.component';

export interface ITTMStage {
  name: string;
  desc: string;
  icon: string;
  steps: ITTMStep[];
}

export interface ITTMStep {
  number: number;
  name: string;
  activities: ITTMActivity[];
  link?: string;
}

export interface ITTMActivity {
  name: string;
  desc: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TTMService {
  private stages: ITTMStage[];

  public get Stages(): ITTMStage[] {
    if (!this.stages) this.initialize();

    return this.stages;
  }

  constructor(private translate: TranslateService) {
  }

  private initialize() {
    if (Object.keys(this.translate.translations).length == 0) return;
    let stage1: ITTMStage = {
      name: 'Analyze',
      desc: 'What are we working on?',
      icon: 'create',
      steps: [
        {
          number: 1,
          name: 'Device Characterization & Scope Defintion',
          link: 'modeling?tab=' + NodeTypes.CharScope,
          activities: [
            {
              name: this.translate.instant('ttm.1.1.n'),
              desc: this.translate.instant('ttm.1.1.d')
            },
            {
              name: this.translate.instant('ttm.1.2.n'),
              desc: this.translate.instant('ttm.1.2.d')
            },
            {
              name: this.translate.instant('ttm.1.3.n'),
              desc: this.translate.instant('ttm.1.3.d')
            }
          ]
        },
        {
          number: 2,
          name: 'Business Objectives and Impact Definition',
          link: 'modeling?tab=' + NodeTypes.ObjImpact,
          activities: [
            {
              name: this.translate.instant('ttm.2.1.n'),
              desc: this.translate.instant('ttm.2.1.d')
            },
            {
              name: this.translate.instant('ttm.2.2.n'),
              desc: this.translate.instant('ttm.2.2.d')
            }
          ]
        },
        {
          number: 3,
          name: 'Device Interaction Analysis',
          activities: [
            {
              name: this.translate.instant('ttm.3.1.n'),
              desc: this.translate.instant('ttm.3.1.d'),
              link: 'modeling?tab=' + NodeTypes.Context,
            },
            {
              name: this.translate.instant('ttm.3.2.n'),
              desc: this.translate.instant('ttm.3.2.d'),
            },
            {
              name: this.translate.instant('ttm.3.3.n'),
              desc: this.translate.instant('ttm.3.3.d'),
              link: 'modeling?tab=' + NodeTypes.UseCase,
            },
            {
              name: this.translate.instant('ttm.3.4.n'),
              desc: this.translate.instant('ttm.3.4.d'),
            }
          ]
        },
        {
          number: 4,
          name: 'Asset Identification',
          activities: [
            {
              name: this.translate.instant('ttm.4.1.n'),
              desc: this.translate.instant('ttm.4.1.d'),
              link: 'modeling?tab=' + NodeTypes.Assets
            },
            {
              name: this.translate.instant('ttm.4.2.n'),
              desc: this.translate.instant('ttm.4.2.d'),
            }
          ]
        }
      ]
    };
    let stage2: ITTMStage = {
      name: 'Model',
      desc: 'What can go wrong?',
      icon: 'architecture',
      steps: [
        {
          number: 5,
          name: 'Threat and Threat Source Identification',
          activities: [
            {
              name: this.translate.instant('ttm.5.1.n'),
              desc: this.translate.instant('ttm.5.1.d'),
              link: 'modeling?tab=' + NodeTypes.ThreatSources
            },
            {
              name: this.translate.instant('ttm.5.2.n'),
              desc: this.translate.instant('ttm.5.2.d'),
              link: 'modeling?tab=' + NodeTypes.SystemThreats
            },
            {
              name: this.translate.instant('ttm.5.3.n'),
              desc: this.translate.instant('ttm.5.3.d'),
              link: 'configuration'
            }
          ]
        },
        {
          number: 6,
          name: 'Hardware Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Hardware,
          activities: [
            {
              name: this.translate.instant('ttm.6.1.n'),
              desc: this.translate.instant('ttm.6.1.d'),
            },
            {
              name: this.translate.instant('ttm.6.2.n'),
              desc: this.translate.instant('ttm.6.2.d'),
            }
          ]
        },
        {
          number: 7,
          name: 'Software Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Software,
          activities: [
            {
              name: this.translate.instant('ttm.7.1.n'),
              desc: this.translate.instant('ttm.7.1.d'),
            },
            {
              name: this.translate.instant('ttm.7.2.n'),
              desc: this.translate.instant('ttm.7.2.d'),
            }
          ]
        },
        {
          number: 8,
          name: 'Use Case Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Dataflow,
          activities: [
            {
              name: this.translate.instant('ttm.8.1.n'),
              desc: this.translate.instant('ttm.8.1.d'),
            },
            {
              name: this.translate.instant('ttm.8.2.n'),
              desc: this.translate.instant('ttm.8.2.d'),
            }
          ]
        },
        {
          number: 9,
          name: 'Process Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Process,
          activities: [
            {
              name: this.translate.instant('ttm.9.1.n'),
              desc: this.translate.instant('ttm.9.1.d'),
            },
            {
              name: this.translate.instant('ttm.9.2.n'),
              desc: this.translate.instant('ttm.9.2.d'),
            }
          ]
        },
        {
          number: 10,
          name: 'Vulnerability Review & Penetration Testing',
          activities: [
            {
              name: this.translate.instant('ttm.10.1.n'),
              desc: this.translate.instant('ttm.10.1.d'),
            },
            {
              name: this.translate.instant('ttm.10.2.n'),
              desc: this.translate.instant('ttm.10.2.d'),
            }
          ]
        }
      ]
    };
    let stage3: ITTMStage = {
      name: 'Mitigate',
      desc: 'What are we going to do about it?',
      icon: 'security',
      steps: [
        {
          number: 11,
          name: 'Risk Assessment',
          link: 'dashboard',
          activities: [
            {
              name: this.translate.instant('ttm.11.1.n'),
              desc: this.translate.instant('ttm.11.1.d'),
            },
            {
              name: this.translate.instant('ttm.11.2.n'),
              desc: this.translate.instant('ttm.11.2.d'),
            }
          ]
        },
        {
          number: 12,
          name: 'Countermeasure Defintion',
          activities: [
            {
              name: this.translate.instant('ttm.12.1.n'),
              desc: this.translate.instant('ttm.12.1.d'),
              link: 'dashboard'
            },
            {
              name: this.translate.instant('ttm.12.2.n'),
              desc: this.translate.instant('ttm.12.2.d'),
              link: 'mitigation',
            },
            {
              name: this.translate.instant('ttm.12.3.n'),
              desc: this.translate.instant('ttm.12.3.d'),
            }
          ]
        }
      ]
    };
    let stage4: ITTMStage = {
      name: 'Validate',
      desc: 'Did we do a good enough job?',
      icon: 'fact_check',
      steps: [
        {
          number: 13,
          name: 'Validation & Documentation',
          activities: [
            {
              name: this.translate.instant('ttm.13.1.n'),
              desc: this.translate.instant('ttm.13.1.d'),
            },
            {
              name: this.translate.instant('ttm.13.2.n'),
              desc: this.translate.instant('ttm.13.2.d'),
            },
            {
              name: this.translate.instant('ttm.13.3.n'),
              desc: this.translate.instant('ttm.13.3.d'),
            },
            {
              name: this.translate.instant('ttm.13.4.n'),
              desc: this.translate.instant('ttm.13.4.d'),
            }
          ]
        }
      ]
    };

    this.stages = [stage1, stage2, stage3, stage4];
  }
}
