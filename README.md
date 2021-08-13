# cdk8s-argo-rollout

![Release](https://github.com/opencdk8s/cdk8s-argo-rollout/workflows/Release/badge.svg?branch=master)
[![npm version](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-argo-rollout.svg)](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-argo-rollout)
[![PyPI version](https://badge.fury.io/py/cdk8s-argo-rollout.svg)](https://badge.fury.io/py/cdk8s-argo-rollout)
![npm](https://img.shields.io/npm/dt/@opencdk8s/cdk8s-argo-rollout?label=npm&color=green) 

## Installation

### TypeScript

Use `yarn` or `npm` to install.

```sh
$ npm install @opencdk8s/cdk8s-argo-rollout
```

```sh
$ yarn add @opencdk8s/cdk8s-argo-rollout
```

### Python

```sh
$ pip install cdk8s-argo-rollout
```
## Contribution

1. Fork ([link](https://github.com/opencdk8s/cdk8s-argo-rollout/fork))
2. Bootstrap the repo:
  
    ```bash
    yarn install # installs dependencies
    npx projen  

    ```
3. Development scripts:
   |Command|Description
   |-|-
   |`yarn compile`|Compiles typescript => javascript
   |`yarn watch`|Watch & compile
   |`yarn test`|Run unit test & linter through jest
   |`yarn test -u`|Update jest snapshots
   |`yarn run package`|Creates a `dist` with packages for all languages.
   |`yarn build`|Compile + test + package
   |`yarn bump`|Bump version (with changelog) based on [conventional commits]
   |`yarn release`|Bump + push to `master`
4. Create a feature branch
5. Commit your changes
6. Rebase your local changes against the master branch
7. Create a new Pull Request (use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for the title please)

## Licence

[Apache License, Version 2.0](./LICENSE)

## Author

[Sumit Agarwal](https://github.com/agarwal-sumit)
