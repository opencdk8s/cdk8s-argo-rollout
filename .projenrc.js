const { ConstructLibraryCdk8s } = require('projen');

const project = new ConstructLibraryCdk8s({
  author: 'Sumit Agarwal',
  authorAddress: 'sa.sumit@outlook.com',
  cdk8sVersion: '1.0.0-beta.8',
  defaultReleaseBranch: 'master',
  stability: 'experimental',
  jsiiFqn: 'projen.ConstructLibraryCdk8s',
  name: '@opencdk8s/cdk8s-argo-rollout',
  npmAccess: 'public',
  repositoryUrl: 'https://github.com/opencdk8s/cdk8s-argo-rollout',

  python: {
    distName: 'cdk8s-argo-rollout',
    module: 'cdk8s_argo_rollout',
  },
  peerDeps: ['constructs@^3.3.5'],
  releaseEveryCommit: true,
  devDeps: [
    'constructs@^3.3.5',
    'prettier@^2.2.1',
    'jsii-pacmak@^1.20.1',
    '@commitlint/config-conventional@^11.0.0',
    '@commitlint/cli@^11.0.0',
    'eslint-import-resolver-node@^0.3.4',
    'eslint-import-resolver-typescript@^2.3.0',
    'eslint-plugin-import@^2.22.1',
    'eslint@^7.19.0',
    'jsii-diff@^1.20.1',
    'jsii-docgen@^1.8.36',
    'jsii@^1.20.1',
    'json-schema@^0.3.0',
  ],

  dependabot: false,
  pullRequestTemplate: false,
  releaseBranches: ['master'],
  codeCov: true,
  clobber: false,
  readme: true,
});

const common_exclude = ['cdk.out', 'package.json', 'yarn-error.log', 'coverage', '.DS_Store', '.idea', '.vs_code'];
project.gitignore.exclude(...common_exclude);

project.synth();
