# Greenlight - The Data4PT Validation tool



<p align="center">
  <img src="https://img.shields.io/badge/go%20version-%3E=1.17-61CFDD.svg?style=for-the-badge&logo=appveyor" alt="Go Version">
  <a href="https://hub.docker.com/r/lekojson/greenlight"
    ><img
      src="https://img.shields.io/docker/pulls/lekojson/greenlight.svg?style=for-the-badge&logo=appveyor"
      alt="Docker pulls"
  /></a>
  <a href="https://hub.docker.com/r/lekojson/greenlight"
    ><img
      src="https://img.shields.io/docker/stars/lekojson/greenlight.svg?style=for-the-badge&logo=appveyor"
      alt="Docker stars"
  /></a>
</p>

<p align="center">
  <a href="#-web-gui">Web</a>
  ·
  <a href="#%EF%B8%8F-cli">CLI</a>
  ·
  <a href="#%EF%B8%8F-building-from-source">Source</a>
  ·
  <a href="#%EF%B8%8F-configuration">Configuration</a>
</p>
<h1></h1>

<table>
<tr><td>
<img
  src="https://github.com/concreteit/greenlight-media/raw/develop/greenlight.gif"
  alt="Simple validation"
  width="50%"
  align="right"
/>

**The minimal, customizable, NeTEx validation tool**

- **Customizable:** configure what you see and how you see it.
- **Scripting** write your own validation rules using javascript
- **Fancy** shows relevant information at a glance.
- **Easy:** quick to install – start using it in minutes.
</td>
</tr>
</table>


# Introduction
The tool consists of a number of components, each with a different responsibility. This will ensure that the tool is modular and that each component is easy to understand and maintain.


<img
  src="media/getting-started_components.png"
  alt="Components"
    style="margin-bottom:20px;margin-top:10px"
/>

**Core** - This is the main component of the tool, it reads the configuration, handles file imports, calls the validation scripts and summarizes the result. The Core provides an API that other components use to control the validation or to get access to shared functions, e.g, in libXML. The API also makes it possible to extend the tool with different front ends, as the CLI and Web Interface.

**libXML** - An [open source, standard library](https://gitlab.gnome.org/GNOME/libxml2/-/wikis/home) integrated into the tool. It is libXML that does all the XSD and XML validation. It is called from the scripts via the API in the Core component.

**CLI** - The Command Line Interface is used in a terminal or integrated in an import/export pipeline. Parameters are used to configure the tool and to specify the files to be validated. The result can be read in the terminal or saved as a file.

**Web Interface** - Provides an easy to use interface via the web browser. The web interface makes the tool easer to use for the occasional user or for just testing small files. After loading the web page you can select the NeTEx profile to use, select one or more validation rules and then run the validation. After completion you get the result on the web page but can also download it to a file.

**Scripts** - Individual validation rules implemented as scripts. The scripts are written in JavaScript that is easy to start with and JavaScript is also well documented. The validation scripts are small programs that each implements one or more validation rules. The scrips provided with the tool implements one rule per script to make it easy to follow and understand how they work. To gain a better performance several rules can be implemented in the same script. Each script uses the API in Core to load the files to validate and to call functions in libXML. XPath provided via libXML is used by most of the scripts to search for and compare different elements in the NeTEx-files. 
</p>

# Getting started

To use the tool you need to install Docker on the computer that you will use. You can use Windows, Mac or Linux as your base operating system, and you will find Docker and instructions on how to install in the [Docker Getting Started](https://www.docker.com/get-started/) guide. 

After you have installed Docker you can get the latest image by typing the following command in a terminal window:

```
docker pull lekojson/greenlight
```

Then you can then start the container with the command:

```
docker run -it -p 8080:8080 lekojson/greenlight server
```

You can also start the container via Docker Desktop, find the downloaded image and click on start:

![Docker Desktop](media/getting-started_docker-desktop.png?raw=true)

# Web interface

When the container is running you can use the web interface by opening a web browser and type the address [http://localhost:8080/](http://localhost:8080/), and then click on **Begin validating** to start a new validation session. 

![Web Start page](media/getting-started_web-start.png?raw=true)

Configuration

First you select which schema/profile to use in the validation. In the current version three default schemas are available; NeTEx Standard, NeTEx Light and EPIP. In a future version of the tool it will be possible to upload your own local schema.

![Web Select schema](media/getting-started_web-schema-selection.png?raw=true)

The next step is to select which additional rules you want to check. You first get an overview and brief description of each rule. Zero or more rules can be selected by clicking the rules in the list box.

![Web Select rules](media/getting-started_web-rule-selection.png?raw=true)

The last step is to upload the files to be validated, it can be single files or multiple files compressed in an archive. Click **Upload files** to select which files to upload and then wait until all files has been uploaded, see the Status indicator in the files list.

![Web Start upload](media/getting-started_web-start-upload.png?raw=true)

When all files are uploaded you start the validation by clicking on **Validate**.

![Web Uploaded files](media/getting-started_web-uploaded-files.png)

The validation will start by validating each file against the selected schema and rules. Depending on the number of files and their sizes the validation can take some time to complete. When the validation is done the result for each file is displayed. You can also download the result in json or csv format to a local file to process it further.

![Web Validation result](media/getting-started_web-validation-result.png)


## 🖥️ CLI

### Prerequisites

- [Docker](https://www.docker.com/) installed and ready to go

### Getting started

**Note**: if you don't have NeTEx xml document (or two) ready to test with we provide a few demo files in the source and docker image

1. Getting the latest image
  ```sh
  docker pull lekojson/greenlight
  ```

2. Running a validation

   - #### With demo files provided in the image

   ```sh
   docker run -it lekojson/greenlight validate -i testdata
   ```

   - #### Providing your own files

   ```sh
   docker run -it -v /path/to/documents:/greenlight/documents lekojson/greenlight validate
   ```

## 🛠️ Building from source

### Prerequisites

- [Go](https://go.dev/)
- [libxml2](http://www.xmlsoft.org/)
- [nodejs](https://nodejs.org/)

### Getting started

**Note**: Greenlight is using Go and is powered by libxml2, so make sure those are installed and configured

1. Clone repository
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

#### 4.a CLI

1. Building and running a validation
   - #### Validate with demo files provided in the source
   _changes in path definition will differ running on windows_
   ```sh
   go run cmd/*.go validate -i testdata
   ```

   - #### Validate using your own files
   _changes in path definition will differ running on windows_
   ```sh
   go run cmd/*.go validate -i /path/to/documents
   ```

#### 4.b Web GUI
1. Buliding and running the backend server
  - #### Build and start the server
  ```sh
  go run cmd/*.go server
  ```

2. Building and running the frontend application
  - #### Navigate to directory
  ```sh
  cd app
  ```

  - #### Install dependencies
  ```sh
  npm i
  ```

  - #### Start the server
  ```sh
  npm run dev
  ```

3. Open a browser and navigate to `http://localhost:8080`

### ⚙️ Configuration

Configurations can be made in a three different ways (in order of priority), through _command line arguments_, _environment variables_ and _configuration file_

#### Command line

- ##### By adding arguments to tool, example running a logger instead of _fancy_ output

```sh
docker run -it lekojson/greenlight -i testdata -l debug
```

- ##### All arguments can be found by running

```sh
docker run -it lekojson/greenlight --help
```

#### Environment variables

Environment comes with the prefix `GREENLIGHT_` and match the paths (separated by `_`) in configuration file (see below). Three different datatypes are supported, `string`, `boolean` and `string slice` which also match the configuration file.

- ##### Setting multiple inputs through environment variable

```sh
docker run -it -e GREENLIGHT_INPUTS=testdata,/path/to/documents lekojson/greenlight
```

- ##### Changing output format in the overview report

```sh
docker run -it -e GREENLIGHT_OUTPUTS_REPORT_FORMAT=mds lekojson/greenlight -i testdata
```

#### Configuration file

- ##### To get started configuring greenlight, create the following file `~/.greenlight/config.yaml`

```sh
mkdir -p ~/.greenlight && touch ~/.greenlight/config.yaml
```

- ##### Using standard logging instead of _fancy_ output

```yaml
logLevel: debug
```

- ##### Add configuration file to validation

```sh
docker run -it -v ~/.greenlight/config.yaml:/greenlight/config.yaml lekojson/greenlight -i testdata
```

#### Glossary

Supported configuration file formats are, `yaml`, `json`, `toml`, `hcl`, `envfile` and `java properties`. The tool looks for the configuration file `config.${format}` in one of the following folders (in order of priority):

  - ~/.greenlight
  - /etc/greenlight
  - /
  - /greenlight
  - .

_Example configuration file_
```yaml
schema: xsd/NeTEx_publication.xsd # schema to use for validation, comes shipped with the source/container image
logLevel: debug # default is undefined, setting this parameter disables the fancy setting, regardless of its value
fancy: true # displays a progress instead of log
inputs: # where to look for documents
  - ~/.greenlight/documents
  - /etc/greenlight/documents
  - /documents
  - /greenlight/documents
  - ./documents
outputs:
  - report: # logged in standard output
      format: mdext # mdext (markdown extended) or mds (markdown simple)
  - file:
      format: json # formats available are: json or xml
      path: . # where to save the file (filename format is ${path}/report-${current_date_time}.${format}
builtin: true # whether to use builtin scripts
scripts: # where to look for custom scripts
  - ~/.greenlight/scripts
  - /etc/greenlight/scripts
  - /scripts
  - /greenlight/scripts
  - ./scripts
```

<h1></h1>

<p align="center">
  <img width="400" src="https://github.com/concreteit/greenlight-media/raw/develop/data4pt.jpeg" alt="data4pt logo">
</p>

<p align="center">
  <img width="400" src="https://github.com/concreteit/greenlight-media/raw/develop/itxpt.jpeg" alt="itxpt logo">
</p>
