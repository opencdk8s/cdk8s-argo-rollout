const { ConstructLibraryCdk8s } = require('projen');

const project = new ConstructLibraryCdk8s({
  author: 'Sumit Agarwal',
  authorAddress: 'sa.sumit@outlook.com',
  cdk8sVersion: '1.0.0-beta.27',
  cdk8sPlusVersion: '1.0.0-beta.50',
  constructsVersion: '3.3.120',
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
  releaseEveryCommit: true,
  devDeps: [
    'prettier@^2.2.1',
  ],
  publishToGo: {
    gitUserName: 'Hunter-Thompson',
    gitUserEmail: 'aatman@auroville.org.in',
    moduleName: 'github.com/opencdk8s/cdk8s-argo-rollouts-go',
  },
  dependabot: false,
  pullRequestTemplate: false,
  codeCov: true,
  clobber: false,
  readme: true,
});

const common_exclude = ['cdk.out', 'yarn-error.log', 'coverage', '.DS_Store', '.idea', '.vs_code'];
project.gitignore.exclude(...common_exclude);

project.synth();
