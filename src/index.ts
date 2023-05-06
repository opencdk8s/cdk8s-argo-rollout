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
   readonly TrafficRoutingParams?: {
    nginx?: {
      stableIngresses: string[];
      annotationPrefix?: string;
      additionalIngressAnnotations?: {
        'canary-by-header': string;
        'canary-by-header-value:': string;
      }
    };
    istio?: {
      virtualServices: {
        name: string;
        routes: string[];
      }[];
    }
    alb?: {
      ingress: string;
      servicePort: string;
      annotationPrefix?: string;
    }
    smi?: {
      rootService?: string;
      trafficSplitName?: string;
    } 
   }
}

export interface StrategySpecs {
  readonly blueGreen?: BlueGreenStrategySpecs;
  readonly canary?: CanaryStrategySpecs;
}

export interface ArgoSpecs {
  strategy: StrategySpecs;
  readonly minReadySeconds?: number;
  readonly paused?: boolean;
  readonly progressDeadlineSeconds?: number;
  readonly replicas?: number;
  readonly revisionHistoryLimit?: number;
  readonly selector: k8s.LabelSelector;
  readonly template: k8s.PodTemplateSpec;
}

export interface ArgoRolloutProps {
  /**
   * Standard object's metadata.
   *
   */
  readonly metadata?: k8s.ObjectMeta;

  /**
   * Spec defines the behavior of the ingress
   *
   */
  readonly spec?: ArgoSpecs;
}

interface ArgoRolloutInternalProps extends ArgoRolloutProps {
  spec?: ArgoSpecs;
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
    let rolloutProps: ArgoRolloutInternalProps = props;
    //let rolloutSpec: ArgoSpecs = rolloutProps.spec;
    if(props.spec) {
      delete rolloutProps.spec['strategy']
      if(props.spec.strategy.canary && props.spec.strategy.blueGreen) throw new Error('Strategy can be canary or bluegreen but not both');
      if(!props.spec.strategy.canary && !props.spec.strategy.blueGreen) throw new Error('Rollout strategy is missing. Canary or bluegreen strategy must be provided');
      if(props.spec.strategy.canary) {
        if(props.spec.strategy.canary.TrafficRoutingParams) {
          if (!props.spec.strategy.canary.canaryService) {
            throw new Error('When Traffic routing is configured, the property canaryService is required');
          }
          if(!props.spec.strategy.canary.stableService) {
            throw new Error('When Traffic routing is configured, the property stableService is required');
          }
        }
        rolloutProps.spec = {
          ...rolloutProps.spec,
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
              minPodsPerReplicaSet: props.spec.strategy.canary.minPodsPerReplicaSet ?? (props.spec.strategy.canary.TrafficRoutingParams ? 2 : 1),
              analysis: props.spec.strategy.canary.analysis,
              steps: props.spec.strategy.canary.steps,
              trafficRouting: props.spec.strategy.canary.TrafficRoutingParams,
              ...getStrategyMutualProps(props.spec.strategy.canary)
            }
          }
        }
      } else { // blueGreen
        rolloutProps.spec = {
          ...rolloutProps.spec,
          strategy: {
            blueGreen: {
              activeService: props.spec.strategy.blueGreen?.activeService,
              prePromotionAnalysis: props.spec.strategy.blueGreen?.prePromotionAnalysis,
              postPromotionAnalysis: props.spec.strategy.blueGreen?.postPromotionAnalysis,
              previewService: props.spec.strategy.blueGreen?.previewService,
              previewReplicaCount: props.spec.strategy.blueGreen?.previewReplicaCount ?? 1,
              autoPromotionEnabled: props.spec.strategy.blueGreen?.autoPromotionEnabled ?? true,
              autoPromotionSeconds: props.spec.strategy.blueGreen?.autoPromotionSeconds,
              ...getStrategyMutualProps(props.spec.strategy.blueGreen)
            }
          }
        }
      }
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

  private getStrategyMutualProps(strategyProps: BlueGreenStrategySpecs | CanaryStrategySpecs) : StrategyMutualSpecs {
    return {
      scaleDownDelaySeconds: strategyProps.scaleDownDelaySeconds ?? 30,
      abortScaleDownDelaySeconds: strategyProps.abortScaleDownDelaySeconds ?? 30,
      scaleDownDelayRevisionLimit: strategyProps.scaleDownDelayRevisionLimit,
      antiAffinity: strategyProps.antiAffinity
    }
  }
}
