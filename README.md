# <img src="https://github.com/SecSimon/TTM/blob/main/src/assets/icons/favicon.192x192.png?raw=true" alt="logo" style="width:50px;"/> TTModeler - Thing Threat Modeler
![maintained - yes](https://img.shields.io/badge/maintained-fixes_only-ffff00)
[![GitHub release](https://img.shields.io/github/release/SecSimon/TTM?include_prereleases=&sort=semver&color=blue)](https://github.com/SecSimon/TTM/releases/)
[![license](https://img.shields.io/badge/license-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![build](https://github.com/SecSimon/TTM/actions/workflows/ubuntu.yml/badge.svg)](https://github.com/SecSimon/TTM/actions/workflows/ubuntu.yml)

[![Web - https://www.simon-liebl.de/TTM](https://img.shields.io/badge/Web-simon--liebl.de/TTM-blue?logo=github-pages&logoColor=white)](https://www.simon-liebl.de/TTM)
[![OS - Linux](https://img.shields.io/badge/OS-Linux-blue?logo=linux&logoColor=white)](https://github.com/SecSimon/TTM/releases)
[![OS - Windows](https://img.shields.io/badge/OS-Windows-blue?logo=windows&logoColor=white)](https://github.com/SecSimon/TTM/releases)

📢 TTModeler will only receive bug fixes for now. An improved version is available here: [TTModeler Pro](https://emgarde.de)

## Threat Modeling for Internet of Things Devices

TTModeler is a free and open-source threat modeling tool specialized on IoT devices and is available as web and desktop application.

TTModeler has the following benefits:
- Web and desktop application
- Online project storage with versioning
- Offline storage (without versioning)
- Built-in but customizable threat and mitigation library
- Integration of CWE, CAPEC, and CVE
- Integration of best practice guidelines for software and processes
- Diagramming: data flow diagram, hardware diagram, context diagram, use case diagram
- Risk assessment (CVSS, OWASP Risk Rating)
- Threat and mitigation dashboard
- Out of box reports (Word, HTML)
- Excel and CSV export
- Support of multiple languages (English, German)
- Collaboration with other persons (online storage only)

Watch an introduction video on [YouTube](https://youtube.com/playlist?list=PLSMRtuVN409fB35RLljjg3jNkVJbLIP1u).

## About TTModeler

The aim of TTModeler is to simplify threat modeling for IoT devices. Manufacturers of embedded devices should be able to access the security of their device without much prior security expertise. 

The tool can be used **without** creating an account. The online version enables versioning and collaboration.   

## How to use the online verison of TTModeler

TTModeler utilizes GitHub as data storage. Your projects can be stored in **private repositories** and can be additionally **password protected** for advanced data protection.

You need to create a **GitHub account** or log in using your existing account.

Afterwards, follow these steps:

#### Step 1: Fork the data repository 
Fork the [data repository](https://github.com/SecSimon/TTM-data) by clicking on _Use this template_. Choose a name (e.g. _My-Private-TTM-Projects_) and set the repository to **private(!!!)**.

#### Step 2: Install the app
Install the [ThingThreatModeler](https://github.com/apps/thingthreatmodeler) app (install button is only visible when you are logged in). Click on _Install_, select _Only selected repositories_, and select the repository that you created in the previous step. Click on _Install & Authorize_.

#### Step 3: Log in to TTModeler using GitHub 
Go to the [Login page](https://www.simon-liebl.de/TTM/login) and log in using your GitHub account. 

#### Step 4: Explore the examples and start threat modelling
Create your own projects on the [Home page](https://www.simon-liebl.de/TTM/home). Happy threat modeling!

## Create your own TTModeler

Clone this repository locally:
``` bash
git clone https://github.com/SecSimon/TTM.git
```

Install dependencies with npm:
``` bash
npm install
cd app/
npm install
```

Run the application
``` bash
npm run ng:serve // serves web application (http://localhost:4200)
npm run electron:serve // serves desktop application
npm start // serves both desktop and web application
```

Build the desktop application
``` bash
npm run electron:build // creates executable depending on your operating system
```
