# Greenlight - The Data4PT Validation tool

<p align="center">
  <img src="https://img.shields.io/badge/go%20version-%3E=1.17-61CFDD.svg?style=for-the-badge&logo=appveyor" alt="Go Version">
  <a href="https://hub.docker.com/r/itxpt/greenlight"
    ><img
      src="https://img.shields.io/docker/pulls/itxpt/greenlight.svg?style=for-the-badge&logo=appveyor"
      alt="Docker pulls"
  /></a>
  <a href="https://hub.docker.com/r/itxpt/greenlight"
    ><img
      src="https://img.shields.io/docker/stars/itxpt/greenlight.svg?style=for-the-badge&logo=appveyor"
      alt="Docker stars"
  /></a>
</p>

<p align="center">
  <a href="#web-interface">Web</a>
  ·
  <a href="#command-line-interface---cli">CLI</a>
  ·
  <a href="#building-from-source">Source</a>
</p>

<h1></h1>

<table>
<tr><td>
<img
  src="https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/a71c8167-683a-45fb-98ef-ca29964dbfb5"
  alt="Simple validation"
  width="25%"
  align="right"
/>
  
**The minimal, customizable, NeTEx validation tool**

- **Customizable:** configure what you see and how you see it.
- **Scripting** write your own validation rules using JavaScript
- **Fancy** shows relevant information at a glance.
- **Easy** quick to install – start using it in minutes.
- **Try it yourself** https://greenlight.itxpt.eu 
</td>
</tr>
</table>

# Table of Content
- [Introduction](#introduction)
- [Requirements](#requirements)
- [Getting started](#getting-started)
 -[Local installation](#local-installation) 
- [Web interface](#web-interface)
- [Command Line Interface - CLI](#command-line-interface-cli)
- [Building from source](#building-from-source)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started-1)


&nbsp;

# Introduction
The tool consists of a number of components, each with a different responsibility. This will ensure that the tool is modular and that each component is easy to understand and maintain.


![image](https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/5c999e94-b91d-48c3-900c-0593326a8426)


**Core** - This is the main component of the tool, it reads the configuration, handles file imports, calls the validation scripts and summarizes the result. The Core provides an API that other components use to control the validation or to get access to shared functions, e.g, in libXML. The API also makes it possible to extend the tool with different front ends, as the CLI and Web Interface.

**libXML** - An [open source, standard library](https://gitlab.gnome.org/GNOME/libxml2/-/wikis/home) integrated into the tool. It is libXML that does all the XSD and XML validation. It is called from the scripts via the API in the Core component.

**CLI** - The Command Line Interface is used in a terminal or integrated in an import/export pipeline. Parameters are used to configure the tool and to specify the files to be validated. The result can be read in the terminal or saved as a file.

**Web Interface** - Provides an easy to use interface via the web browser. The web interface makes the tool easer to use for the occasional user or for just testing small files. After loading the web page you can select the NeTEx profile to use, select one or more validation rules and then run the validation. After completion you get the result on the web page but can also download it to a file.

**Scripts** - Individual validation rules implemented as scripts. The scripts are written in JavaScript that is easy to start with and JavaScript is also well documented. The validation scripts are small programs that each implements one or more validation rules. The scrips provided with the tool implements one rule per script to make it easy to follow and understand how they work. To gain a better performance several rules can be implemented in the same script. Each script uses the API in Core to load the files to validate and to call functions in libXML. XPath provided via libXML is used by most of the scripts to search for and compare different elements in the NeTEx-files.
</p>

&nbsp;

# Requirements
To run the tool locally you must ensure that the machine used has the capability to handle the files to be validated. The validation times can be long and the tool can stop if the processing power or memory is to low. Below is a recommendation for the configuration of a machine. Be aware that very large or very many files affects the performance, and can result in longer validation times even on a machine with the recommended hardware.

| Minimum | Recommended | Best performance |
|---------| ------------| -----------------|
| 4 cores | 6 cores | 6 cores or more |
| 8 GB memory | 16 GB memory | 32 GB memory |



&nbsp;

# Getting started
To try out the tool for the first time and evaluate the functionality you can use our hosted web interface at https://greenlight.itxpt.eu See [Web Interface](#Web-interface) for an overview of how to use the tool with the visual interface.

If you find the tool useful and want to use it in more advanced scenarios, with larger files or include it in a pipeline, then you can download and install it locally in your own environment.

## Local installation

To use the tool locally, you need to install Docker on the computer that you will use. You can use Windows, Mac or Linux as your base operating system, and you will find Docker and instructions on how to install in the [Docker Getting Started](https://www.docker.com/get-started/) guide.

After you have installed Docker, you can get the latest version of the Greenlight image by typing the following command in a terminal window:

```
docker pull itxpt/greenlight
```

![image](https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/64e7f05a-d43c-44e6-b29b-066cd8412852)


We suggest that you first start to use the web interface to verify that the installation works and to learn more about the functionality. 

Start the web interface with the command:

```
docker run -it -p 8080:8080 itxpt/greenlight server
```


![image](https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/56c1fe22-f8ba-4164-9f26-8f2ee405eb2f)



If you have used the image before, you can also start the web interface via Docker Desktop, goto to the Containers tab and press Start on the Greenlight container.

![image](https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/e3ded9be-f33c-4eb9-8391-3c2d68e43830)


&nbsp;

# Web interface

You can use the web interface by opening a web browser and type the address http://localhost:8080/ or you can access the online tool at the address https://greenlight.itxpt.eu/. Then you can click on Start validating to start a new validation session. You can also always use the New validation button in the upper right corner to start over with a new validation.

![image](https://github.com/EliotTerrier/NeTEx-Profile-EPIP-wiki/assets/134064791/343a28c9-14aa-4830-9c8a-0deca87a6db5)

**For mor details on how to use the web interface, see [Manual for the web interface](https://github.com/ITxPT/DATA4PTTools/wiki/Manual-for-Web-Interface)**

# Command Line Interface (CLI)

The CLI is for more advanced use cases where you want more control over the validation or if you want to include the validation in your own pipeline. An example could be to recieve a file via an integration, validate the file with GreenLight and if there are any errors inform via email and otherwise save the file for use in another system.

To use the CLI you must first download the Docker image as described in [Getting started](#getting-started)

When you use the CLI you first give the command ```docker``` and the parameters ```run -it [docker_image]``` in this case the docker_image is itxpt/greenlight. After that you give the different commands and flags to greenlight, e.g., ```help```. If you want to use other docker parameters, you have to put them before the name of the image to use. See below for more complex examples of how to invoke the greenlight command.

&nbsp;

**For more details on how to use the CLI, see [Manual for command line interface](https://github.com/ITxPT/DATA4PTTools/wiki/Manual-for-command-line-interface)**

# Building from source

## Prerequisites

Greenlight is using Go and is powered by libxml2, so make sure those are installed first. If you want to work on the web interface you will also need Node.js

- [Go](https://go.dev/)

  Download and install the latest version with standard settings

- [libxml2](http://www.xmlsoft.org/)

  Install using

  Mac: ```brew install libxml2```

  Linux: ```sudo apt install libxml2```

  Windows: Build from [source](https://gitlab.gnome.org/GNOME/libxml2) or download [precompiled binaries](https://pages.lip6.fr/Jean-Francois.Perrot/XML-Int/Session1/WinLibxml.html)

- [nodejs](https://nodejs.org/) - only required for the web interface
    
Download and install the latest version with standard settings

## Getting started


1. Open a terminal and navigate to the folder where you want to install the source code.
```sh
cd /home/developer/code
```

2. Clone repository
```sh
git clone https://github.com/ITxPT/DATA4PTTools
```

2. Navigate to project
```sh
cd DATA4PTTools
```

3. Downloading dependencies
```sh
go get
```
