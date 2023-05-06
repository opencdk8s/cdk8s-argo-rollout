import { ApiObject, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';
import * as k8s from './imports/k8s';
export * as k8s from './imports/k8s';

export interface AnalysisTemplate {
  readonly templateName: string;
};

export interface ValueFrom {
  readonly podTemplateHashValue?: string;
  readonly fieldRef?: k8s.ObjectFieldSelector;
};

export interface AnalysisArgs {
  readonly name: string;
  readonly value?: string;
  readonly valueFrom?: ValueFrom;
};

export interface AnalysisSpec {
  readonly templates: AnalysisTemplate[];
  readonly args: AnalysisArgs[];
};

export type MatchTypes =
    {
      exact: string
    } |
    {
      regex: string;
    } |
    {
      prefix: string;
    };

export type CanaryStep = 
  {
    setWeight: number;
  } | 
  {
    pause: { 
      duration?: string;
    }
  } |
  {
    analysis: AnalysisSpec
  } |
  {
    experiment: {
      duration: string;
      templates: { name: string; specRef: string }[];
      analyses: { name: string; templateName: string }[];
    }
  } |
  {
    setCanaryScale: 
      {
        replicas: number
      } |
      {
        weight: number
      } |
      {
        matchTrafficWeight: boolean
      }
  } |
  {
    setHeaderRoute: {
      name: string;
      match: {
        headerName: string;
        headerValue: MatchTypes;
      }
    }
  } |
  {
    setMirrorRoute: {
      name: string;
      percentage: number;
      match: {
          method: MatchTypes;
          path: MatchTypes;
          headers: {
            [key: string]: MatchTypes;
          }
      }[]
    }
  }
  

export interface StrategyMutualSpecs {
  readonly scaleDownDelaySeconds?: number;
  readonly scaleDownDelayRevisionLimit?: number;
  readonly antiAffinity?: k8s.PodAntiAffinity;
  readonly abortScaleDownDelaySeconds?: number;
}

export interface BlueGreenStrategySpecs extends StrategyMutualSpecs {
  readonly activeService: string;
  readonly prePromotionAnalysis?: AnalysisSpec;
  readonly postPromotionAnalysis?: AnalysisSpec;
  readonly previewService?: string;
  readonly previewReplicaCount?: number;
  readonly autoPromotionEnabled?: boolean;
  readonly autoPromotionSeconds?: number;
}

export interface CanaryStrategySpecs extends StrategyMutualSpecs {
   readonly canaryService?: string;
   readonly stableService?: string;
   readonly canaryMetadata?: k8s.ObjectMeta;
   readonly stableMetadata?: k8s.ObjectMeta;
   readonly maxUnavailable?: number;
   readonly maxSurge?: string;
   readonly minPodsPerReplicaSet?: number;
   readonly analysis?: AnalysisSpec;
   readonly steps?: CanaryStep[];
   readonly trafficRouting?: {
    readonly nginx?: {
      readonly stableIngresses: string[];
      readonly annotationPrefix?: string;
      readonly additionalIngressAnnotations?: {
        'canary-by-header': string;
        'canary-by-header-value:': string;
      }
    };
    readonly istio?: {
      readonly virtualServices: {
        readonly name: string;
        readonly routes: string[];
      }[];
    }
    readonly alb?: {
      readonly ingress: string;
      readonly servicePort: string;
      readonly annotationPrefix?: string;
    }
    readonly smi?: {
      readonly rootService?: string;
      readonly trafficSplitName?: string;
    }
   }
}

export interface StrategySpecs {
  readonly blueGreen?: BlueGreenStrategySpecs;
  readonly canary?: CanaryStrategySpecs;
}

export interface ArgoSpecs {
  readonly strategy: StrategySpecs;
  readonly selector: k8s.LabelSelector;
  readonly template: k8s.PodTemplateSpec;
  readonly analysis?: {
    successfulRunHistoryLimit?: number;
    unsuccessfulRunHistoryLimit?: number;
  };
  readonly minReadySeconds?: number;
  readonly paused?: boolean;
  readonly progressDeadlineSeconds?: number;
  readonly progressDeadlineAbort?: boolean;
  readonly replicas?: number;
  readonly revisionHistoryLimit?: number;
  readonly rollbackWindow?: {
    revisions: number;
  }
}

export interface ArgoRolloutProps {
  /**
   * Standard object's metadata.
   *
   */
  readonly metadata: k8s.ObjectMeta;

  /**
   * Spec defines the behavior of the ingress
   *
   */
  readonly spec: ArgoSpecs;
}

export class ArgoRollout extends ApiObject {
  public static readonly GVK: GroupVersionKind = {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Rollout',
  };
  /**
   * Renders a Kubernetes manifest for an ingress object. https://github.com/kubernetes-sigs/aws-load-balancer-controller
   *
   * This can be used to inline resource manifests inside other objects (e.g. as templates).
   *
   * @param props initialization props
   */
  public static manifest(props: ArgoRolloutProps): any {
    let rolloutSpec: ArgoSpecs;
    if(props.spec.strategy.canary && props.spec.strategy.blueGreen) {
      throw new Error('Strategy can be canary or bluegreen but not both');
    }

    if(props.spec.strategy.canary) { 
      if(props.spec.strategy.canary.trafficRouting) {
        if (!props.spec.strategy.canary.canaryService) {
          throw new Error('When Traffic routing is configured, the property canaryService is required');
        }
        if(!props.spec.strategy.canary.stableService) {
          throw new Error('When Traffic routing is configured, the property stableService is required');
        }
      }
      rolloutSpec = {
        selector: props.spec.selector,
        ...this.getGeneralSpecProps(props.spec),
        template: props.spec.template,
        strategy: {
          canary: {
            canaryService: props.spec.strategy.canary.canaryService,
            stableService: props.spec.strategy.canary.stableService,
            canaryMetadata: props.spec.strategy.canary.canaryMetadata ?? {
              annotations: {
                role: 'canary'
              },
              labels: {
                role: 'canary'
              }
            },
            stableMetadata: props.spec.strategy.canary.stableMetadata ?? {
              annotations: {
                role: 'stable'
              },
              labels: {
                role: 'stable'
              }
            },
            maxUnavailable: props.spec.strategy.canary.maxUnavailable ?? 1,
            maxSurge: props.spec.strategy.canary.maxSurge ?? "20%",
            minPodsPerReplicaSet: props.spec.strategy.canary.minPodsPerReplicaSet ?? (props.spec.strategy.canary.trafficRouting ? 2 : 1),
            analysis: props.spec.strategy.canary.analysis,
            steps: props.spec.strategy.canary.steps,
            trafficRouting: props.spec.strategy.canary.trafficRouting,
            ...this.getStrategyMutualProps(props.spec.strategy.canary as CanaryStrategySpecs)
          }
        }
      }
    } else if(props.spec.strategy.blueGreen) { // blueGreen
      rolloutSpec = {
        selector: props.spec.selector,
        ...this.getGeneralSpecProps(props.spec),
        template: props.spec.template,
        strategy: {
          blueGreen: {
            activeService: props.spec.strategy.blueGreen?.activeService,
            prePromotionAnalysis: props.spec.strategy.blueGreen?.prePromotionAnalysis,
            postPromotionAnalysis: props.spec.strategy.blueGreen?.postPromotionAnalysis,
            previewService: props.spec.strategy.blueGreen?.previewService,
            previewReplicaCount: props.spec.strategy.blueGreen?.previewReplicaCount ?? 1,
            autoPromotionEnabled: props.spec.strategy.blueGreen?.autoPromotionEnabled ?? true,
            autoPromotionSeconds: props.spec.strategy.blueGreen?.autoPromotionSeconds,
            ...this.getStrategyMutualProps(props.spec.strategy.blueGreen as BlueGreenStrategySpecs)
          }
        }
      }
    } else {
      throw new Error('Rollout strategy is missing. Canary or bluegreen strategy must be provided');
    }

    const rolloutProps: ArgoRolloutProps = {
      metadata: props.metadata,
      spec: rolloutSpec
    }

    return {
      ...ArgoRollout.GVK,
      ...rolloutProps,
    };
  }

  /**
   * Defines an "extentions" API object for AWS Load Balancer Controller - https://github.com/kubernetes-sigs/aws-load-balancer-controller
   * @param scope the scope in which to define this object
   * @param id a scope-local name for the object
   * @param props initialization props
   */
  public constructor(scope: Construct, id: string, props: ArgoRolloutProps) {
    super(scope, id, ArgoRollout.manifest(props));
  }

  private static getStrategyMutualProps(strategyProps: BlueGreenStrategySpecs | CanaryStrategySpecs) : StrategyMutualSpecs {
    return {
      scaleDownDelaySeconds: strategyProps?.scaleDownDelaySeconds ?? 30,
      abortScaleDownDelaySeconds: strategyProps?.abortScaleDownDelaySeconds ?? 30,
      scaleDownDelayRevisionLimit: strategyProps?.scaleDownDelayRevisionLimit,
      antiAffinity: strategyProps?.antiAffinity
    }
  }

  private static getGeneralSpecProps(props: ArgoSpecs): { [key: string ]: any } {
    let analysisProps: { [key: string ]: number };
    if(props.analysis) {
      const successfulRunHistoryLimit: number = props.analysis.successfulRunHistoryLimit ?? 5;
      const unsuccessfulRunHistoryLimit: number = props.analysis.unsuccessfulRunHistoryLimit ?? 5;
      analysisProps = {
        successfulRunHistoryLimit: successfulRunHistoryLimit,
        unsuccessfulRunHistoryLimit: unsuccessfulRunHistoryLimit
      }
    } else {
      analysisProps = {
        successfulRunHistoryLimit: 5,
        unsuccessfulRunHistoryLimit: 5
      }
    }
    return {
      minReadySeconds: props.minReadySeconds ?? 0,
      paused: props.paused,
      progressDeadlineSeconds: props.progressDeadlineSeconds ?? 600,
      progressDeadlineAbort: props.progressDeadlineAbort ?? false,
      replicas: props.replicas ?? 1,
      revisionHistoryLimit: props.revisionHistoryLimit ?? 10,
      rollbackWindow: props.rollbackWindow,
      analysis: analysisProps
    }

  }
}
