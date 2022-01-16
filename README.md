# Greenlight

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
  <a href="#-installation">Installation</a>
  ·
  <a href="#%EF%B8%8F-configuration">Configuration</a>
</p>

<h1></h1>

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

<br>

## 🚀 Installation

### Prerequisites

- [Docker](https://www.docker.com/) installed and ready to go
- (optional) [Go](https://go.dev/) - required if you are intending to build from source (latest build using 1.17.2)
- (optional) [libxml2](http://www.xmlsoft.org/) - required if you are intending to build from source

### Getting started

**Note**: if you don't have NeTEx xml document (or two) ready to test with we provide a few demo files in the source and docker image

#### 🐳 Using Docker

1. Getting the latest image
  ```sh
  docker pull lekojson/greenlight
  ```

2. Running a validation

   - #### With demo files provided in the image
  
   ```sh
   docker run -it lekojson/greenlight -i testdata
   ```

   - #### Providing your own files
  
   ```sh
   docker run -it -v /path/to/documents:/greenlight/documents lekojson/greenlight
   ```

#### 🛠️ Building from source

**Note**: Greenlight is using Go and is powered by libxml2, so make sure those are installed and configured

1. Clone repository
```sh
git clone https://github.com/concreteit/greenlight
```

2. Navigate to project
```sh
cd greenlight
```

3. Getting dependencies
```sh
go get
```

4. Building and running validation
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
