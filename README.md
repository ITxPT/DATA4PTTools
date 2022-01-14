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
  src="./media/greenlight.gif"
  alt="Simple validation"
  width="50%"
  align="right"
/>

**The minimal, customizable, NeTEx validation tool**

- **Customizable:** configure what you see and how you see it.
- **Scripting** write your own validation rules using javascript
- **Fancy** shows relevant information at a glance.
- **Easy:** quick to install – start using it in minutes.

<br><br><br><br><br>

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

<h1></h1>

<p align="center">
  <img width="400" src="./media/data4pt.jpeg" alt="data4pt logo">
</p>

<p align="center">
  <img width="400" src="./media/itxpt.jpeg" alt="itxpt logo">
</p>
