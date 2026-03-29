# 毕业设计项目环境配置指南 (VS Code)

本项目采用了前后端分离+独立算法服务的架构，包含三个相对独立的工作目录：
1. **backend**: Java (Spring Boot) 后端服务
2. **frontend**: React (Vite) 前端界面
3. **algorithm**: Python (FastAPI) 算法服务

本文档说明如何在本地 VS Code 中从零准备开发环境。

## 1. 基础运行环境准备

在开始编写代码前，请确保您的 Windows 系统上已安装以下运行环境：

- **JDK 21**: [Adoptium](https://adoptium.net/) 提供。安装后需配置 `JAVA_HOME` 环境变量。
  - *验证命令*: `java -version` (应输出 `openjdk 21...`)
- **Maven**: 您的后端项目通过 pom.xml 管理，建议安装并配置 Maven。
  - *验证命令*: `mvn -v`
- **Node.js**: (推荐 v18 或 v20 LTS) 用于构建前端 Vite 项目。附带 `npm` 包管理器。
  - *验证命令*: `node -v` 和 `npm -v`
- **Python**: (推荐 3.10 或更高版本) 用于运行算法与 FastAPI 服务。
  - *验证命令*: `python --version`

## 2. VS Code 扩展推荐

在 VS Code 的扩展选项卡中搜索并安装以下核心扩展（以支持对应语言）：

- **Extension Pack for Java** (微软官方): 提供 Java 语法高亮、代码补全和 Maven 支持。
- **Spring Boot Extension Pack** (VMware 官方): 辅助 Spring 快速开发。
- **Python** (微软官方): 提供 Python 调试与运行环境支持。

## 3. 各模块依赖安装与运行说明

### 3.1 算法模块 (`/algorithm`)

该模块使用 Python FastAPI。

1. **进入目录**: `cd algorithm`
2. **创建虚拟环境** (推荐，避免污染全局): `python -m venv venv`
3. **激活虚拟环境**: 
   - Windows cmd: `venv\Scripts\activate.bat`
   - Windows PowerShell: `.\venv\Scripts\Activate.ps1`
4. **安装依赖**: `pip install -r requirements.txt`
5. **运行服务**: `uvicorn app.main:app --reload`
   - *说明*: 服务默认会运行在 `http://127.0.0.1:8000`。

### 3.2 界面模块 (`/frontend`)

该模块使用 React + Vite 构建。

1. **进入目录**: `cd frontend`
2. **安装依赖**: `npm install`
3. **运行开发服务器**: `npm run dev`
   - *说明*: 默认端口通常为 `http://localhost:5173`。

### 3.3 后端模块 (`/backend`)

该模块基于 Spring Boot 3.3.5 构建，Java 版本为 21。

1. **进入目录**: `cd backend`
2. **安装依赖**: `mvn clean install -DskipTests` (或直接通过 VS Code 的 Maven 侧边栏进行 Reload)
3. **运行服务**: `mvn spring-boot:run` 或在 VS Code 中直接运行 `TunnelMvpBackendApplication.java`
   - *说明*: 配置了 Web 依赖，通常默认端口为 `http://localhost:8080` (取决于 `application.yml` 配置)。