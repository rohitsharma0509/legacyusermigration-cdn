#!/bin/bash
npm_config_registry=https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release npx @adobe/tessa-npm-plugin "$@"
