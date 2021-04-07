# cdk8s-aws-lb-controller-api-object

![Release](https://github.com/opencdk8s/cdk8s-aws-lb-controller-api-object/workflows/Release/badge.svg?branch=development)
[![npm version](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-aws-lb-controller-api-object.svg)](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-aws-lb-controller-api-object)
[![PyPI version](https://badge.fury.io/py/cdk8s-aws-lb-controller-api-object.svg)](https://badge.fury.io/py/cdk8s-aws-lb-controller-api-object)
![npm](https://img.shields.io/npm/dt/@opencdk8s/cdk8s-aws-lb-controller-api-object?label=npm&color=green) 

API Object for AWS Load Balancer Controller, powered by the [cdk8s project](https://cdk8s.io) and [aws-load-balancer-controller](https://github.com/kubernetes-sigs/aws-load-balancer-controller)  🚀

## Overview 

```typescript
import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { AWSLoadBalancerControllerObject } from '@opencdk8s/cdk8s-aws-lb-controller-api-object'


export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);
    new AWSLoadBalancerControllerObject(this, 'example', {
      metadata: {
        annotations: {
          'kubernetes.io/ingress.class': 'alb',
        }
      },
      spec: {
        rules: [{
          host: "example.com",
          http: {
            paths: [{
              path: '/*',
              backend: {
                serviceName: 'helloworld-svc',
                servicePort: 80
              }
            }]
          }
        }]
      }
    })

    }
}

const app = new App();
new MyChart(app, 'example');
app.synth();
```

Example `cdk8s synth` manifest as follows.

<details>
<summary>manifest.k8s.yaml</summary>

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: alb
  name: example-c89c1904
spec:
  rules:
    - host: example.com
      http:
        paths:
          - backend:
              serviceName: helloworld-svc
              servicePort: 80
            path: /*


```

</details>

## Installation

### TypeScript

Use `yarn` or `npm` to install.

```sh
$ npm install @opencdk8s/cdk8s-aws-lb-controller-api-objects
```

```sh
$ yarn add @opencdk8s/cdk8s-aws-lb-controller-api-objects
```

### Python

```sh
$ pip install cdk8s-aws-lb-controller-api-objects
```
## Contribution

1. Fork ([link](https://github.com/opencdk8s/cdk8s-aws-lb-controller-api-objects/fork))
2. Bootstrap the repo:
  
    ```bash
    npx projen   # generates package.json 
    yarn install # installs dependencies
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

[Hunter-Thompson](https://github.com/Hunter-Thompson)
