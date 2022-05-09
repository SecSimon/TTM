import { Injectable } from '@angular/core';
import { NodeTypes } from '../modeling/modeling.component';

export interface ITTMStage {
  name: string;
  desc: string;
  icon: string;
  steps: ITTMStep[];
}

export interface ITTMStep {
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

  public Stages: ITTMStage[] = [];

  constructor() {
    let stage1: ITTMStage = {
      name: 'Analyze',
      desc: 'What are we working on?',
      icon: 'create',
      steps: [
        {
          name: 'Device Characterization & Scope Defintion',
          link: 'modeling?tab=' + NodeTypes.CharScope,
          activities: [
            {
              name: 'Characterise the device',
              desc: 'Define and describe sector, function, function, application, requirements, criticiality, location and environment, connectivity and target market.'
            },
            {
              name: 'Identify the requirements',
              desc: 'Identify requirements in terms of standards, laws, policies, guidelines, and best practices for safety, security, privacy, and compliance.'
            },
            {
              name: 'Define the scope',
              desc: 'Identify the people involved.\nDetermine the budget for this process.\nDefine the time frame.\nDefine the expected output.\nIdentify assumptions and constraints.'
            }
          ]
        },
        {
          name: 'Business Objectives and Impact Definition',
          link: 'modeling?tab=' + NodeTypes.ObjImpact,
          activities: [
            {
              name: 'Define the device, business, and brand goals',
              desc: ''
            },
            {
              name: 'Identify the potential business impact',
              desc: ''
            }
          ]
        },
        {
          name: 'Device Interaction Analysis',
          activities: [
            {
              name: 'Identify actors and external systems',
              desc: 'Examples: user, service technician, owner, cloud service, controller ',
              link: 'modeling?tab=' + NodeTypes.Context,
            },
            {
              name: 'Create a system context diagram',
              desc: 'Include the device, actors, and external systems.\nSpecify the used interface.',
            },
            {
              name: ' Create a use case diagram',
              desc: 'List all use cases and actors.\nMap the actors to the use cases',
              link: 'modeling?tab=' + NodeTypes.UseCase,
            },
            {
              name: "Identify/Define the actors' privileges",
              desc: 'If not already defined, follow the security principle least privilege to set them',
            }
          ]
        },
        {
          name: 'Asset Identification',
          activities: [
            {
              name: 'Identify all valuable assets by considering all actors',
              desc: '',
              link: 'modeling?tab=' + NodeTypes.Assets
            },
            {
              name: 'Classify data using a data classification standard',
              desc: 'Use your preferred standard. Examples: NIST SP 800-53, ISO 27001, GDPR'
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
          name: 'Threat and Threat Source Identification',
          activities: [
            {
              name: 'Identify threat sources and describe their motive',
              desc: '',
              link: 'modeling?tab=' + NodeTypes.ThreatSources
            },
            {
              name: 'Identify threat (categories) and their consequences',
              desc: '',
              link: 'modeling?tab=' + NodeTypes.DeviceThreats
            },
            {
              name: 'Collect known attack techniques and common weaknesses',
              desc: 'Collect available libraries (e.g. CWE, CAPEC), attack trees, and guidelines -> extend the configuration file'
            }
          ]
        },
        {
          name: 'Hardware Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Hardware,
          activities: [
            {
              name: 'Create a hardware model',
              desc: ''
            },
            {
              name: 'Analyse attacks and weaknesses',
              desc: 'Elements, such as ASICs, pre-provisioned processors, and data stores, are prone to supply chain attacks.\nPhysical attacks are mainly conducted on these elements, e.g. side-channel analysis, fault injection, dumping the firmware.\nSensors may threaten privacy.\nActuators may threaten safety.\nInterfaces may allow the extraction of data, injection of commands, and causing a denial of service among others.'
            }
          ]
        },
        {
          name: 'Software Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Software,
          activities: [
            {
              name: 'List all software components of the device including third-party software',
              desc: 'When applicable, combine the diagram with the hardware model, for example, for cryptography or secure boot'
            },
            {
              name: 'Analyse attacks and weaknesses',
              desc: ''
            }
          ]
        },
        {
          name: 'Use Case Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Dataflow,
          activities: [
            {
              name: 'Created a DFD for each use case identified in stage 1',
              desc: 'The uses cases should include all physical links modelled in the hardware model.\nIdentify and list security-relevant properties for each element.\nCombine the diagram with the hardware and software models.'
            },
            {
              name: 'Analyse attacks and weaknesses',
              desc: 'Sensors may threaten privacy, actuators may threaten safety.'
            }
          ]
        },
        {
          name: 'Process Threat Modeling',
          link: 'modeling?tab=' + NodeTypes.Process,
          activities: [
            {
              name: 'Identify security-relevant processes and requirements',
              desc: ''
            },
            {
              name: 'Analyse threats and weaknesses in the identified processes',
              desc: ''
            }
          ]
        },
        {
          name: 'Vulnerability Review & Penetration Testing',
          activities: [
            {
              name: 'Check the hardware and software components against public vulnerability databases',
              desc: ''
            },
            {
              name: 'Conduct a penetration test on the device',
              desc: ''
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
          name: 'Risk Assessment',
          link: 'dashboard',
          activities: [
            {
              name: 'Assess all found attack vectors and weaknesses by a severity score',
              desc: ''
            },
            {
              name: 'Determine the risk',
              desc: 'This tool calculates the risk using severity and likelihood '
            }
          ]
        },
        {
          name: 'Countermeasure Defintion',
          activities: [
            {
              name: 'Identify threats that exceed a tolerable risk score',
              link: 'dashboard',
              desc: ''
            },
            {
              name: 'Define countermeasures to for the risk (mitigate, avoid, transfer)',
              link: 'mitigation',
              desc: ''
            },
            {
              name: 'Calculate the residual risk score',
              desc: ''
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
          name: 'Validation & Documentation',
          activities: [
            {
              name: 'Validate the implemented countermeasures for their effectiveness',
              desc: 'Develop test cases, list assumptions'
            },
            {
              name: 'Compare the device model with the reality',
              desc: 'Evaluate all previous steps for their correctness'
            },
            {
              name: 'Document all activities and their results in such a way that they can be understood by external persons who were not involved in the process',
              desc: ''
            },
            {
              name: 'Communicate the results to all involved parties',
              desc: ''
            }
          ]
        }
      ]
    };

    this.Stages = [stage1, stage2, stage3, stage4];
  }
}
